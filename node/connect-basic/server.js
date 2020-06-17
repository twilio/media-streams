const fs = require("fs");
const path = require("path");
var http = require("http");
var HttpDispatcher = require("httpdispatcher");
var WebSocketServer = require("websocket").server;

var dispatcher = new HttpDispatcher();
var wsserver = http.createServer(handleRequest);

const HTTP_SERVER_PORT = 8080;
const REPEAT_THRESHOLD = 50;

var mediaws = new WebSocketServer({
  httpServer: wsserver,
  autoAcceptConnections: true,
});

function log(message, ...args) {
  console.log(new Date(), message, ...args);
}

function handleRequest(request, response) {
  try {
    dispatcher.dispatch(request, response);
  } catch (err) {
    console.error(err);
  }
}

dispatcher.onPost("/twiml", function (req, res) {
  log("POST TwiML");

  var filePath = path.join(__dirname + "/templates", "streams.xml");
  var stat = fs.statSync(filePath);

  res.writeHead(200, {
    "Content-Type": "text/xml",
    "Content-Length": stat.size,
  });

  var readStream = fs.createReadStream(filePath);
  readStream.pipe(res);
});

mediaws.on("connect", function (connection) {
  log("From Twilio: Connection accepted");
  new MediaStream(connection);
});

class MediaStream {
  constructor(connection) {
    this.connection = connection;
    connection.on("message", this.processMessage.bind(this));
    connection.on("close", this.close.bind(this));
    this.hasSeenMedia = false;
    this.messages = [];
    this.repeatCount = 0;
  }

  processMessage(message) {
    if (message.type === "utf8") {
      var data = JSON.parse(message.utf8Data);
      if (data.event === "connected") {
        log("From Twilio: Connected event received: ", data);
      }
      if (data.event === "start") {
        log("From Twilio: Start event received: ", data);
      }
      if (data.event === "media") {
        if (!this.hasSeenMedia) {
          log("From Twilio: Media event received: ", data);
          log("Server: Suppressing additional messages...");
          this.hasSeenMedia = true;
        }
        // Store media messages
        this.messages.push(data);
        if (this.messages.length >= REPEAT_THRESHOLD) {
          log(`From Twilio: ${this.messages.length} omitted media messages`);
          this.repeat();
        }
      }
      if (data.event === "mark") {
        log("From Twilio: Mark event received", data);
      }
      if (data.event === "close") {
        log("From Twilio: Close event received: ", data);
        this.close();
      }
    } else if (message.type === "binary") {
      log("From Twilio: binary message received (not supported)");
    }
  }

  repeat() {
    const messages = [...this.messages];
    this.messages = [];
    const streamSid = messages[0].streamSid;

    // Decode each message and store the bytes in an array
    const messageByteBuffers = messages.map((msg) =>
      Buffer.from(msg.media.payload, "base64")
    );
    // Combine all the bytes, and then base64 encode the entire payload.
    const payload = Buffer.concat(messageByteBuffers).toString("base64");
    const message = {
      event: "media",
      streamSid,
      media: {
        payload,
      },
    };
    const messageJSON = JSON.stringify(message);
    const payloadRE = /"payload":"[^"]*"/gi;
    log(
      `To Twilio: A single media event containing the exact audio from your previous ${messages.length} inbound media messages`,
      messageJSON.replace(
        payloadRE,
        `"payload":"an omitted base64 encoded string with length of ${message.media.payload.length} characters"`
      )
    );
    this.connection.sendUTF(messageJSON);

    // Send a mark message
    const markMessage = {
      event: "mark",
      streamSid,
      mark: {
        name: `Repeat message ${this.repeatCount}`,
      },
    };
    log("To Twilio: Sending mark event", markMessage);
    this.connection.sendUTF(JSON.stringify(markMessage));
    this.repeatCount++;
    if (this.repeatCount === 5) {
      log(`Server: Repeated ${this.repeatCount} times...closing`);
      this.connection.close(1000, "Repeated 5 times");
    }
  }

  close() {
    log("Server: Closed");
  }
}

wsserver.listen(HTTP_SERVER_PORT, function () {
  console.log("Server listening on: http://localhost:%s", HTTP_SERVER_PORT);
});
