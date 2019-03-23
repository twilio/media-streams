"use strict";
require('dotenv').load();

const fs = require('fs');
const path = require('path');
var http = require('http');
var HttpDispatcher = require('httpdispatcher');
var WebSocketServer = require('websocket').server;
const Speech = require('@google-cloud/speech');

var dispatcher = new HttpDispatcher();
const speech = new Speech.SpeechClient();

var wsserver = http.createServer(handleRequest);


var mediaws = new WebSocketServer({
  httpServer: wsserver,
  autoAcceptConnections: true,
});

function handleRequest(request, response){
  try {
      dispatcher.dispatch(request, response);
  } catch(err) {
      console.log(err);
  }
}

dispatcher.onPost('/twiml', function(req,res) {
  var filePath = path.join(__dirname+'/templates', 'streams.xml');
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    'Content-Type': 'text/xml',
    'Content-Lenght': stat.size
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

mediaws.on('connect', function(connection) {
  console.log((new Date()) + 'Media WS: Connection accepted');
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
        console.log((new Date()) + 'Media WS: text message received (not supported)');
    } else if (message.type === 'binary') {
        this.getStream().write(message.binaryData);
    }
  }

  close(){
    console.log((new Date()) + 'Media WS: closed');

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
        interimResults: false
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

wsserver.listen(8080, function(){
  console.log("Server listening on: http://localhost:%s", 8080);
});
