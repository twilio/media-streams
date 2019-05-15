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

function handleRequest(request, response){
  try {
    dispatcher.dispatch(request, response);
  } catch(err) {
    console.log(err);
  }
}

dispatcher.onPost('/twiml', function(req,res) {
  console.log((new Date()) + 'POST TwiML');

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
  console.log((new Date()) + 'Media WS: Connection accepted');
  new MediaStream(connection);
});

class MediaStream {
  constructor(connection) {
    connection.on('message', this.processMessage.bind(this));
    connection.on('close', this.close.bind(this));
    this.latestSequence = 0;
  }

  processMessage(message){
    if (message.type === 'utf8') {
      var data = JSON.parse(message.utf8Data);
      if (data.sequenceNumber) {
        this.latestSequence = data.sequenceNumber;
      }
      if (data.sequenceNumber == 1) {
        console.log((new Date()) + ' Media WS: received media and metadata: '
          + JSON.stringify(data));
        console.log((new Date()) + ' Media WS:  ADDITIONAL MESSAGES FROM WEBSOCKET BEING SUPPRESED');
      }

    } else if (message.type === 'binary') {
      console.log((new Date()) + ' Media WS: binary message received (not supported)');
    }
  }

  close(){
    console.log((new Date()) + ' Media WS: closed. Recieved a total of [' + this.latestSequence + '] messages');
  }
}

wsserver.listen(HTTP_SERVER_PORT, function(){
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
