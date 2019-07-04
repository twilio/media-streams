function fromJSON(json) {
  return new StreamMessage(JSON.parse(json));
}

class StreamMessage {
  constructor(obj) {
    this.obj = obj;
  }

  toString() {
    return this.rawString || JSON.stringify(this.obj);
  }

  static from(value) {
    let msg = undefined;
    if (typeof value === "string") {
      msg = fromJSON(value);
      msg.rawString = value;
    }
    // 'websocket' message
    if (value.type) {
      if (value.type === "utf8") {
        msg = fromJSON(value.utf8Data);
        msg.rawString = value.utf8Data;
      } else {
        throw new Error(`Unhandled message type: ${value.type}`);
      }
    }
    if (msg === undefined) {
      throw new Error(`Unknown message type: ${typeof value}`);
    }
    return msg;
  }

  payloadAsBuffer() {
    return Buffer.from(this.obj.payload || this.obj.media.payload, "base64");
  }
}

module.exports = StreamMessage;
