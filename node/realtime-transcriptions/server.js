import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import TranscriptionService from './transcription-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_SERVER_PORT = process.env.PORT || 8080;

function log(message, ...args) {
  console.log(new Date().toISOString(), message, ...args);
}

const app = express();
const httpServer = createServer(app);
const mediaws = new WebSocketServer({ server: httpServer });

// Serve static XML TwiML template
app.post('/twiml', (req, res) => {
  const filePath = path.join(__dirname, 'templates', 'streams.xml');
  res.setHeader('Content-Type', 'text/xml');
  fs.createReadStream(filePath).pipe(res);
});

// Handle Media Stream connections
mediaws.on('connection', (connection) => {
  log('Media WS: Connection accepted');
  new MediaStreamHandler(connection);
});

// MediaStreamHandler class
class MediaStreamHandler {
  constructor(connection) {
    this.metaData = null;
    this.trackHandlers = {};

    connection.on('message', this.processMessage.bind(this));
    connection.on('close', this.close.bind(this));
  }

  processMessage(message) {
    try {
      const data = JSON.parse(message);

      if (data.event === 'start') {
        this.metaData = data.start;
        return;
      }

      if (data.event !== 'media') return;

      const track = data.media.track;
      if (!this.trackHandlers[track]) {
        const service = new TranscriptionService();
        service.on('transcription', (transcription) => {
          log(`Transcription (${track}):`, transcription);
        });
        this.trackHandlers[track] = service;
      }

      this.trackHandlers[track].send(data.media.payload);
    } catch (err) {
      log('Failed to parse message:', err);
    }
  }

  close() {
    log('Media WS: Connection closed');

    for (const track of Object.keys(this.trackHandlers)) {
      log(`Closing handler for track: ${track}`);
      this.trackHandlers[track].close();
    }
  }
}

httpServer.listen(HTTP_SERVER_PORT, () => {
  console.log(`Server listening on http://localhost:${HTTP_SERVER_PORT}`);
});
