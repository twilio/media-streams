const EventEmitter = require('events');
const StreamMessage = require('./StreamMessage');

class StreamMessageEmitter extends EventEmitter {

    constructor() {
        super();
        this.count = 0;
    }

    push(message) {
        this.count++;
        const streamMessage = StreamMessage.from(message);
        this.emit('message', streamMessage);
        if (this.listeners('data')) {
            this.emit('data', streamMessage.payloadAsBuffer());
        }
    }
}

module.exports = StreamMessageEmitter;
