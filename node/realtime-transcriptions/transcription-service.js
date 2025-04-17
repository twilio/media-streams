import { EventEmitter } from 'events';
import { SpeechClient } from '@google-cloud/speech';

const speech = new SpeechClient();

export default class TranscriptionService extends EventEmitter {
  constructor() {
    super();
    this.stream = null;
    this.streamCreatedAt = null;
  }

  send(payload) {
    this.getStream().write(payload);
  }

  close() {
    if (this.stream) {
      this.stream.destroy();
      this.stream = null;
    }
  }

  newStreamRequired() {
    if (!this.stream) {
      return true;
    }
    const now = Date.now();
    const timeSinceCreated = now - this.streamCreatedAt;
    return timeSinceCreated / 1000 > 60;
  }

  getStream() {
    if (this.newStreamRequired()) {
      this.close();

      const request = {
        config: {
          encoding: 'MULAW',
          sampleRateHertz: 8000,
          languageCode: 'en-US',
        },
        interimResults: true,
      };

      this.streamCreatedAt = Date.now();

      this.stream = speech
        .streamingRecognize(request)
        .on('error', (err) => {
          console.error('Speech stream error:', err);
        })
        .on('data', (data) => {
          const result = data.results?.[0];
          const transcript = result?.alternatives?.[0]?.transcript;
          if (transcript) {
            this.emit('transcription', transcript);
          }
        });
    }

    return this.stream;
  }
}
