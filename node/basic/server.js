"use strict";

const fs = require('fs');
const path = require('path');
const http = require('http');
const HttpDispatcher = require('httpdispatcher');
const WebSocketServer = require('websocket').server;

const StreamMessage = require('./StreamMessage');

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
  log('WebSocket connection accepted');
  let messageCount = 0;
  connection.on('message', message => {
    if (messageCount === 0) {
      log('Received initial message: ');
      const streamMessage = StreamMessage.from(message);
      // .toString?
      log(`Message was: ${streamMessage}`);
      log(`Audio payload size in bytes: ${streamMessage.payloadAsBuffer().byteLength}`);
      log('Suppressing remaining messages...');
    }
    messageCount++;
  });
  connection.on('close', () => {
    log(`WebSocket closed. Received a total of ${messageCount} messages`);
  });
});

wsserver.listen(HTTP_SERVER_PORT, function(){
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
