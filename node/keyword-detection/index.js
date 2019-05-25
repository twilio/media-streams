const express = require('express');
const expressWebSocket = require('express-ws');
const websocketStream = require('websocket-stream/stream');
const SpeechToText = require('watson-developer-cloud/speech-to-text/v1');
const Transform = require('stream').Transform;
const app = express();
const PORT = 8080;
 
// extend express app with app.ws()
expressWebSocket(app, null, {
    perMessageDeflate: false,
});

const keywords = process.argv.slice(2)  || ["help", "keyword"];
console.log('Keywords are now set to: ', keywords);

const speechToText = new SpeechToText();

app.ws("/media", (ws, req) => {
  // Wrap the websocket in a Node stream
  const mediaStream = websocketStream(ws);
  // Data sent through websocket is a JSON string with a payload that is base64 encoded
  const mediaDecoderStream = new Transform({
    transform: (chunk, encoding, callback) => {
      const msg = JSON.parse(chunk.toString('utf8'));
      return callback(null, Buffer.from(msg.payload, 'base64'));
    }
  });
  // Set up a connected websocket stream to IBM Cloud
  const recognizeStream = speechToText.recognizeUsingWebSocket({
    content_type: "audio/mulaw;rate=8000",
    model: "en-US_NarrowbandModel",
    keywords: keywords,
    keywords_threshold: 0.5,
    readableObjectMode: true,
    interim_results: true,
  });
  // Connect the pipes
  mediaStream
    .pipe(mediaDecoderStream)
    .pipe(recognizeStream);
  // Process the results that IBM sends back
  recognizeStream.on('data', msg => {
    msg.results.forEach(result => {
      if (result.keywords_result) {
        Object.keys(result.keywords_result).forEach(keyword => {
          console.log(`Keyword detected "${keyword}": ${result.alternatives[0].transcript}`);
        });  
      }
    });
  });
  
});

console.log(`WebSocket server is listening on localhost:${PORT}`);
app.listen(PORT);