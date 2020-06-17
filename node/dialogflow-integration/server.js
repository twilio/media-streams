require("dotenv").config();
const express = require("express");
const hbs = require("express-handlebars");
const expressWebSocket = require("express-ws");
const websocket = require("websocket-stream");
const websocketStream = require("websocket-stream/stream");
const Twilio = require("twilio");
const { DialogflowService } = require("./dialogflow-utils");

const PORT = process.env.PORT || 3000;

const app = express();
// extend express app with app.ws()
expressWebSocket(app, null, {
  perMessageDeflate: false
});

app.engine("hbs", hbs());
app.set("view engine", "hbs");

// make all the files in 'public' available
app.use(express.static("public"));
app.get("/", (request, response) => {
  response.render("home", { layout: false });
});

// Responds with Twilio instructions to begin the stream
app.post("/twiml", (request, response) => {
  response.setHeader("Content-Type", "application/xml");
  // ngrok sets x-original-host header
  const host = request.headers['x-original-host'] || request.hostname;
  response.render("twiml", { host, layout: false });
});

app.ws("/media", (ws, req) => {
  let client;
  try {
    client = new Twilio();
  } catch(err) {
    if (process.env.TWILIO_ACCOUNT_SID === undefined) {
      console.error('Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console');
      console.log('Exiting');
      return;
    }
    console.error(err);
  }
  // This will get populated on callStarted
  let callSid;
  let streamSid;
  // MediaStream coming from Twilio
  const mediaStream = websocketStream(ws, {
    binary: false
  });
  const dialogflowService = new DialogflowService();

  mediaStream.on("data", data => {
    dialogflowService.send(data);
  });

  mediaStream.on("finish", () => {
    console.log("MediaStream has finished");
    dialogflowService.finish();
  });

  dialogflowService.on("callStarted", data => {
    callSid = data.callSid;
    streamSid = data.streamSid;
  });

  dialogflowService.on("audio", audio => {
    const mediaMessage = {
      streamSid,
      event: "media",
      media: {
        payload: audio
      }
    };
    const mediaJSON = JSON.stringify(mediaMessage);
    console.log(`Sending audio (${audio.length} characters)`);
    mediaStream.write(mediaJSON);
    // If this is the last message
    if (dialogflowService.isStopped) {
      const markMessage = {
        streamSid,
        event: "mark",
        mark: {
          name: "endOfInteraction"
        }
      };
      const markJSON = JSON.stringify(markMessage);
      console.log("Sending end of interaction mark", markJSON);
      mediaStream.write(markJSON);
    }
  });

  dialogflowService.on("interrupted", transcript => {
    console.log(`Interrupted with "${transcript}"`);
    if (!dialogflowService.isInterrupted) {
      console.log("Clearing...");
      const clearMessage = {
        event: "clear",
        streamSid
      };
      mediaStream.write(JSON.stringify(clearMessage));
      dialogflowService.isInterrupted = true;
    }
  });

  dialogflowService.on("endOfInteraction", (queryResult) => {
    const response = new Twilio.twiml.VoiceResponse();
    const url = process.env.END_OF_INTERACTION_URL;
    if (url) {
      const qs = JSON.stringify(queryResult);
      // In case the URL has a ?, use an ampersand
      const appendage = url.includes("?") ? "&" : "?";
      response.redirect(
        `${url}${appendage}dialogflowJSON=${encodeURIComponent(qs)}`
      );
    } else {
      response.hangup();
    }
    const twiml = response.toString();
    return client
      .calls(callSid)
      .update({ twiml })
      .then(call =>
        console.log(`Updated Call(${callSid}) with twiml: ${twiml}`)
      )
      .catch(err => console.error(err));
  });


});

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
