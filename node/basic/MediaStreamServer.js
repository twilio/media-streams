const EventEmitter = require("events");
const WebSocketServer = require("websocket").server;
const StreamMessage = require("./StreamMessage");

function log(message) {
  console.log(new Date(), 'MediaStreamServer', message);
}

class MediaStreamServer extends EventEmitter {
  constructor(options) {
    super();
    this.connections = {};
    this.websocketServer = new WebSocketServer({
      httpServer: options.server,
      autoAcceptConnections: true
    });
    this.websocketServer.on("connect", connection => {
      log("Websocket Connected");
      this.connections[connection] = {};
      connection.on(
        "message",
        message => this.processMessage(connection, message)
      );
      connection.on(
        "close",
        () => this.handleClose(connection)
      );
    });
  }

  processMessage(connection, message) {
    try {
      const metadata = this.connections[connection];
      let count = metadata.messageCount || 0;
      count++;
      metadata.messageCount = count;
      const streamMessage = StreamMessage.from(message);
      this.emit("message", {
        streamMessage,
        metadata
      });
      if (this.listeners("data")) {
        this.emit("data", {
          buffer: streamMessage.payloadAsBuffer(),
          metadata
        });
      }
  
    } catch(e) {
      console.error(e);
    }
  }
  handleClose(connection) {
    const metadata = this.connections[connection];
    this.emit("close", {metadata});
    delete this.connections[connection];
  }
}

module.exports = MediaStreamServer;
