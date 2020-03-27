const EventEmitter = require("events");
const { Transform, PassThrough, pipeline } = require("stream");
const dialogflow = require("dialogflow").v2beta1;
const structjson = require("structjson");
const uuid = require("uuid");

const projectId = process.env.DIALOGFLOW_PROJECT_ID;
const intentQueryAudioInput = {
  audioConfig: {
    audioEncoding: "AUDIO_ENCODING_MULAW",
    sampleRateHertz: 8000,
    languageCode: "en-US",
    singleUtterance: true
  },
  interimResults: false
};

function createDetectStream(isFirst, sessionId, sessionPath, sessionClient) {
  let queryInput = intentQueryAudioInput;
  if (isFirst) {
    queryInput = {
      event: {
        name: process.env.DIALOGFLOW_STARTING_EVENT_NAME,
        languageCode: "en-US"
      }
    };
  }
  const initialStreamRequest = {
    queryInput,
    session: sessionPath,
    queryParams: {
      session: sessionClient.sessionPath(projectId, sessionId)
    },
    outputAudioConfig: {
      audioEncoding: "OUTPUT_AUDIO_ENCODING_MP3"
    }
  };

  const detectStream = sessionClient.streamingDetectIntent();
  detectStream.write(initialStreamRequest);
  return detectStream;
}

function createAudioResponseStream() {
  return new Transform({
    objectMode: true,
    transform: (chunk, encoding, callback) => {
      if (!chunk.outputAudio || chunk.outputAudio.length == 0)
        return callback();
      return callback(null, chunk.outputAudio);
    }
  });
}

function createAudioRequestStream() {
  return new Transform({
    objectMode: true,
    transform: (chunk, encoding, callback) => {
      const msg = JSON.parse(chunk.toString("utf8"));
      // Only process media messages
      if (msg.event !== "media") return callback();
      // This is mulaw/8000 base64-encoded
      return callback(null, { inputAudio: msg.media.payload });
    }
  });
}

class DialogflowService extends EventEmitter {
  constructor() {
    super();
    this.sessionId = uuid.v4();
    // Instantiates a session client
    this.sessionClient = new dialogflow.SessionsClient();
    this.sessionPath = this.sessionClient.sessionPath(
      projectId,
      this.sessionId
    );
    // State management
    this.isFirst = true;
    this.isReady = false;
    this.isDone = false;
    this.isInterrupted = false;
  }

  send(message) {
    const stream = this.startPipeline();
    stream.write(message);
  }

  getFinalQueryResult() {
    if (this.finalQueryResult) {
      const queryResult = {
        intent: {
          name: this.finalQueryResult.intent.name,
          displayName: this.finalQueryResult.intent.displayName
        },
        parameters: structjson.structProtoToJson(
          this.finalQueryResult.parameters
        )
      };
      return queryResult;
    }
  }

  startPipeline() {
    if (!this.isReady && !this.isDone) {
      // Generate the streams
      this._requestStream = new PassThrough({ objectMode: true });
      const audioStream = createAudioRequestStream();
      const detectStream = createDetectStream(
        this.isFirst,
        this.sessionId,
        this.sessionPath,
        this.sessionClient
      );
      const responseStream = new PassThrough({ objectMode: true });
      const audioResponseStream = createAudioResponseStream();
      if (this.isFirst) this.isFirst = false;
      this.isInterrupted = false;
      // Pipeline is async....
      pipeline(
        this._requestStream,
        audioStream,
        detectStream,
        responseStream,
        audioResponseStream,
        err => {
          if (err) {
            this.emit("error", err);
          }
          // Update the state so as to create a new pipeline
          this.isReady = false;
        }
      );
      this._requestStream.on("data", data => {
        const msg = JSON.parse(data.toString("utf8"));
        if (msg.event === "start") {
          console.log(`Captured call ${msg.start.callSid}`);
          this.emit('callStarted', msg.start.callSid);
        }
      });
      responseStream.on("data", data => {
        if (data.recognitionResult) {
          this.emit("interrupted", data.recognitionResult.transcript);
          this.isInterrupted = true;
        }
        if (
          data.queryResult &&
          data.queryResult.intent &&
          data.queryResult.intent.endInteraction
        ) {
          console.log(
            `Ending interaction with: ${data.queryResult.fulfillmentText}`
          );
          this.finalQueryResult = data.queryResult;
          this.stop();
        }
      });
      audioResponseStream.on("data", data => {
        this.emit("audio", data);
      });
      // Set ready
      this.isReady = true;
    }
    return this._requestStream;
  }

  stop() {
    console.log("Stopping Dialogflow");
    this._requestStream.end();
    this.isDone = true;
  }
}

module.exports = {
  DialogflowService
};
