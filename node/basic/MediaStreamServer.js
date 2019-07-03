const EventEmitter = require("events");
const WebSocketServer = require("websocket").server;
const StreamMessage = require("./StreamMessage");

class MediaStreamServer extends EventEmitter {
  constructor(options) {
    super();
    this.connections = {};
    // TODO: Accept port or server
    this.websocketServer = new WebSocketServer({
      httpServer: options.server,
      autoAcceptConnections: true
    });
    this.websocketServer.on("connect", connection => {
      // This is closed over for each connection
      const metadata = {};
      connection.on("message", message =>
        this.processMessage(message, metadata)
      );
      connection.on("close", () => this.handleClose(metadata));
    });
  }

  processMessage(message, metadata) {
    try {
      let count = metadata.messageCount || 0;
      count++;
      metadata.messageCount = count;
      // This is a raw websocket message
      this.emit("rawMessage", message);
      const streamMessage = StreamMessage.from(message);
      const sequenceNumber = streamMessage.obj.sequenceNumber;
      // This is a utf8 string
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
          // Generate "connected" keys
          metadata.version = "0.1.0";
          metadata.protocol = "Call";
          // Generate "start" keys
          const keys = ["mediaFormat", "accountSid", "streamSid", "callSid"];
          keys.forEach(key => (metadata[key] = streamMessage.obj[key]));
          // Tracks is inbound only
          metadata.tracks = ["inbound"];
          metadata.customParameters = {};
          // Cache as it is always the same
          metadata.generated = true;
        }
      }
      if (event === "media") {
        let media;
        if (metadata.generated) {
          // Map media to look like v0.2.0
          media = {
            track: "inbound",
            chunk: metadata.messageCount,
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
        // Only convert to Buffer if requested
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

  handleClose(metadata) {
    this.emit("close", { metadata });
  }
}

module.exports = MediaStreamServer;
