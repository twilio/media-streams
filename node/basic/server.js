"use strict";

const fs = require('fs');
const path = require('path');
var http = require('http');
var HttpDispatcher = require('httpdispatcher');
var WebSocketServer = require('websocket').server;

var dispatcher = new HttpDispatcher();
var wsserver = http.createServer(handleRequest);

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
  new MediaStream(connection);
});

class MediaStream {
  constructor(connection) {
    connection.on('message', this.processMessage.bind(this));
    connection.on('close', this.close.bind(this));
    this.hasSeenMedia = false;
    this.messageCount = 0;
  }

  processMessage(message){
    if (message.type === 'utf8') {
      var data = JSON.parse(message.utf8Data);
      if (data.event === "connected") {
        log('Media WS: Connected event received: ', data);
      }
      if (data.event === "start") {
        log('Media WS: Start event received: ', data);
      }
      if (data.event === "media") {
        if (!this.hasSeenMedia) {
          log('Media WS: Media event received: ', data);
          log('Media WS: Suppressing additional messages...');
          this.hasSeenMedia = true;
        }
      }
      if (data.event === "stop") {
        log('Media WS: Stop event received: ', data);
      }
      this.messageCount++;
    } else if (message.type === 'binary') {
      log('Media WS: binary message received (not supported)');
    }
  }

  close(){
    log('Media WS: Stopped. Received a total of [' + this.messageCount + '] messages');
  }
}

wsserver.listen(HTTP_SERVER_PORT, function(){
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
