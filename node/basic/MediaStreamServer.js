const EventEmitter = require("events");
const WebSocketServer = require("websocket").server;
const StreamMessage = require("./StreamMessage");

function log(message) {
  console.log(new Date(), "MediaStreamServer", message);
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
      connection.on("message", message =>
        this.processMessage(connection, message)
      );
      connection.on("close", () => this.handleClose(connection));
    });
  }

  processMessage(connection, message) {
    try {
      const metadata = this.connections[connection];
      let count = metadata.messageCount || 0;
      count++;
      metadata.messageCount = count;
      this.emit("rawMessage", message);
      const streamMessage = StreamMessage.from(message);
      const sequenceNumber = streamMessage.obj.sequenceNumber;
      this.emit("raw", streamMessage.toString());
      let event = streamMessage.obj.event;
      if (event) {
        if (event === "connected") {
          metadata.protocol = streamMessage.obj.protocol;
          metadata.version = streamMessage.obj.version;
          this.emit("connected", {
            sequenceNumber,
            metadata
          });
        } else if (event === "start") {
          Object.keys(streamMessage.obj.start).forEach(key => {
            metadata[key] = streamMessage.obj[key];
          });
          this.emit("start", {
            sequenceNumber,
            start: streamMessage.obj.start,
            metadata
          });
        }
      } else {
        // v0.1.0 doesn't include events
        event = "media";
        if (!metadata.generated) {
          metadata.version = "0.1.0";
          metadata.protocol = "Call";
          const keys = ["mediaFormat", "accountSid", "streamSid", "callSid"];
          keys.forEach(key => (metadata[key] = streamMessage.obj[key]));
          // Cache as it is always the same
          metadata.generated = true;
        }
      }
      if (event === "media") {
        let media;
        if (metadata.generated) {
          media = {
            timestamp: streamMessage.obj.timestamp,
            payload: streamMessage.obj.payload
          };
        } else {
          media = streamMessage.obj.media;
        }
        this.emit("media", {
          sequenceNumber,
          media,
          metadata
        });
        if (this.listeners("mediaPayload")) {
          this.emit("mediaPayload", {
            sequenceNumber,
            buffer: streamMessage.payloadAsBuffer(),
            metadata
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
  handleClose(connection) {
    const metadata = this.connections[connection];
    this.emit("close", { metadata });
    delete this.connections[connection];
  }
}

module.exports = MediaStreamServer;
