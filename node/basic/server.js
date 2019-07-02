"use strict";

const fs = require('fs');
const path = require('path');
const http = require('http');
const HttpDispatcher = require('httpdispatcher');


const MediaStreamServer = require('./MediaStreamServer');

const dispatcher = new HttpDispatcher();
const httpServer = http.createServer(handleRequest);

const HTTP_SERVER_PORT = 8080;

function log(message) {
  console.log(new Date(), message);
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

mss.on('message', event => {
  if (event.metadata.count == 1) {
    log('Received initial message');
    log(`Message was: ${event.streamMessage}`);
    log('Suppressing remaining messages...');
  }
});

mss.on('data', event => {
  if (event.metadata.count == 1) {
    log('Received initial data');
    log(`Audio payload size in bytes: ${event.buffer.byteLength}`);
    log('Suppressing remaining data...');
  }
});
  
mss.on('close', event => {
  log(`WebSocket closed. Received a total of ${event.metadata.count} messages`);
});

httpServer.listen(HTTP_SERVER_PORT, function(){
  log("Server listening on: http://localhost:" + HTTP_SERVER_PORT);
});
