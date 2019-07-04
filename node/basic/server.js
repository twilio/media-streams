"use strict";

const fs = require('fs');
const path = require('path');
const http = require('http');
const HttpDispatcher = require('httpdispatcher');


const MediaStreamServer = require('./MediaStreamServer');

const dispatcher = new HttpDispatcher();
const httpServer = http.createServer(handleRequest);

const HTTP_SERVER_PORT = 8080;

function log(message, ...args) {
  console.log(new Date(), message, ...args);
}

function handleRequest(request, response){
  try {
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.log(err);
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

const mss = new MediaStreamServer({server: httpServer});

const SEQUENCE_LIMIT = 3;

mss.on('message', event => {
  if (event.sequenceNumber <= SEQUENCE_LIMIT) {
    log(`Received "message" #${event.sequenceNumber}`);
    log("Message was:", event.message);
    log("Metadata was:", event.metadata);
    if (event.sequenceNumber == SEQUENCE_LIMIT) {
      log('Remaining messages suppressed');
    }
  }
});

mss.on('media', event => {
  if (event.sequenceNumber <= SEQUENCE_LIMIT) {
    log('Received "media" data');
    log("Media was:", event.media);
    log("Metadata was:", event.metadata);
    if (event.sequenceNumber == SEQUENCE_LIMIT) {
      log('Remaining messages suppressed');
    }
  }
});

mss.on('mediaPayload', event => {
  if (event.sequenceNumber <= SEQUENCE_LIMIT) {
    log('Received "mediaPayload" data');
    log(`Audio payload size in bytes: ${event.buffer.byteLength}`);
    log("Metadata was:", event.metadata);
    if (event.sequenceNumber == SEQUENCE_LIMIT) {
      log('Remaining messages suppressed');
    }
  }
});

mss.once('raw', message => {
  log('Message from "raw" one time only', message);
});
  
mss.on('close', event => {
  log(`WebSocket closed. Received a total of ${event.metadata.messageCount} messages`);
});

httpServer.listen(HTTP_SERVER_PORT, function(){
  log("Server listening on: http://localhost:" + HTTP_SERVER_PORT);
});
