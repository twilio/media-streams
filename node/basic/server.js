"use strict";

const fs = require('fs');
const path = require('path');
const http = require('http');
const HttpDispatcher = require('httpdispatcher');
const WebSocketServer = require('websocket').server;

const StreamMessageEmitter = require('./StreamMessageEmitter');

const dispatcher = new HttpDispatcher();
const wsserver = http.createServer(handleRequest);

const HTTP_SERVER_PORT = 8080;

var mediaWS = new WebSocketServer({
  httpServer: wsserver,
  autoAcceptConnections: true,
});

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

mediaWS.on('connect', function(connection) {
  const messenger = new StreamMessageEmitter();
  log('WebSocket connection accepted');
  connection.on('message', messenger.push.bind(messenger)); 
  
  messenger.on('message', streamMessage => {
    if (messenger.count == 1) {
      log('Received initial message');
      log(`Message was: ${streamMessage}`);
      log('Suppressing remaining messages...');
    }
  });

  messenger.on('data', buffer => {
    if (messenger.count == 1) {
      log('Received initial data');
      log(`Audio payload size in bytes: ${buffer.byteLength}`);
      log('Suppressing remaining data...');
    }
  });
  
  connection.on('close', () => {
    log(`WebSocket closed. Received a total of ${messenger.count} messages`);
  });
});

wsserver.listen(HTTP_SERVER_PORT, function(){
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
