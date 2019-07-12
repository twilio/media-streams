"use strict";
require('dotenv').load();

const fs = require('fs');
const path = require('path');
var http = require('http');
var HttpDispatcher = require('httpdispatcher');
var WebSocketServer = require('websocket').server;
const Speech = require('@google-cloud/speech');

var dispatcher = new HttpDispatcher();
var wsserver = http.createServer(handleRequest);

const speech = new Speech.SpeechClient();

const HTTP_SERVER_PORT = 8080;

var mediaws = new WebSocketServer({
  httpServer: wsserver,
  autoAcceptConnections: true,
});

function log(message, ...args) {
  console.log(new Date(), message, ...args);
}

function handleRequest(request, response){
  try {
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.error(err);
  }
}

dispatcher.onPost('/twiml', function(req,res) {
  log('POST TwiML');

  var filePath = path.join(__dirname+'/templates', 'streams.xml');
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': 'text/xml',
    'Content-Length': stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

mediaws.on('connect', function(connection) {
  log('Media WS: Connection accepted');
  new TranscriptionStream(connection);
});

class TranscriptionStream {
  constructor(connection) {
    this.streamCreatedAt = null;
    this.stream = null;

    connection.on('message', this.processMessage.bind(this));
    connection.on('close', this.close.bind(this));
  }

  processMessage(message){
    if (message.type === 'utf8') {
      var data = JSON.parse(message.utf8Data);
      // Only worry about media messages
      if (data.event !== "media") {
        return;
      }
      this.getStream().write(data.media.payload);
    } else if (message.type === 'binary') {
      log('Media WS: binary message received (not supported)');
    }
  }

  close(){
    log('Media WS: closed');

    if (this.stream){
      this.stream.destroy();
    }
  }

  newStreamRequired() {
    if(!this.stream) {
      return true;
    } else {
      const now = new Date();
      const timeSinceStreamCreated = (now - this.streamCreatedAt);
      return (timeSinceStreamCreated/1000) > 60;
    }
  }

  getStream() {
    if(this.newStreamRequired()) {
      if (this.stream){
        this.stream.destroy();
      }

      var request = {
        config: {
          encoding: 'MULAW',
          sampleRateHertz: 8000,
          languageCode: 'en-US'
        },
        interimResults: true
      };

      this.streamCreatedAt = new Date();
      this.stream = speech.streamingRecognize(request)
                          .on('error', console.error)
                          .on('data', this.onTranscription.bind(this));
    }

    return this.stream;
  }

  onTranscription(data){
    var result = data.results[0];
    if (result === undefined || result.alternatives[0] === undefined) {
      return;
    }

    var transcription = result.alternatives[0].transcript;
    console.log((new Date()) + 'Transcription: ' + transcription);
  }
}

wsserver.listen(HTTP_SERVER_PORT, function(){
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
