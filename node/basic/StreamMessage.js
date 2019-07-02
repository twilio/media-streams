function fromJSON(json) {
  return new StreamMessage(JSON.parse(json));
}

class StreamMessage {
  constructor(obj) {
    this.obj = obj;
  }

  toString() {
    return JSON.stringify(this.obj);
  }

  static from(value) {
    if (typeof value === "string") {
      return fromJSON(value);
    }
    // 'websocket' message
    if (value.type && value.type) {
      if (value.type === "utf8") {
        return fromJSON(value.utf8Data);
      }
      throw new Error(`Unhandled message type: ${value.type}`);
    }
    throw new Error(`Unknown message type: ${typeof value}`);
  }

  payloadAsBuffer() {
    return Buffer.from(this.obj.payload, "base64");
  }
}

module.exports = StreamMessage;
