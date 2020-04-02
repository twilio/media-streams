require("dotenv").config();
const express = require("express");
const hbs = require("express-handlebars");
const expressWebSocket = require("express-ws");
const websocket = require("websocket-stream");
const websocketStream = require("websocket-stream/stream");
const Twilio = require("twilio");
const { DialogflowService } = require("./dialogflow-utils");

const PORT = process.env.PORT || 3000;

// Global callSid to Audio
const responseAudio = {};

//app instance name
const GAE_URL = "http://" + process.env.GAE_INSTANCE + "." + process.env.GAE_VERSION + "." +  process.env.GOOGLE_CLOUD_PROJECT + ".appspot.com";

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

app.get("/audio/:callSid/response.mp3", (request, response) => {
  response.set("content-type", "audio/mp3");
  response.set("accept-ranges", "bytes");
  response.write(responseAudio[request.params.callSid]);
  response.end();
});

// Responds with Twilio instructions to begin the stream
app.post("/twiml", (request, response) => {
  response.setHeader("Content-Type", "application/xml");
  response.render("twiml", { host: request.hostname, layout: false });
});


app.get("/liveness_check", (request, response) => {
  response.set("content-type", "text/plain");
  response.write("200 Ok");
  response.end();
});

app.get("/readiness_check", (request, response) => {
  response.set("content-type", "text/plain");
  response.write("200 Ok");
  response.end();
});

app.ws("/media", (ws, req) => {
  try {
    const client = new Twilio();
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
  // MediaStream coming from Twilio
  const mediaStream = websocketStream(ws);
  const dialogflowService = new DialogflowService();

  // Reusable Consumer
  function callUpdater(callSid, twimlGeneratorFunction) {
    const response = new Twilio.twiml.VoiceResponse();
    twimlGeneratorFunction(response);
    const twiml = response.toString();
    return client
      .calls(callSid)
      .update({ twiml })
      .then(call =>
        console.log(`Updated Call(${callSid}) with twiml: ${twiml}`)
      )
      .catch(err => console.error(err));
  }

  mediaStream.on("data", data => {
    dialogflowService.send(data);
  });

  mediaStream.on("finish", () => {
    console.log("MediaStream has finished");
    dialogflowService.stop();
    // Remove the last audio
    delete responseAudio[callSid];
  });

  dialogflowService.on("callStarted", data => {
    callSid = data;
  });

  dialogflowService.on("audio", audio => {
    responseAudio[callSid] = audio;
    callUpdater(callSid, response => {
      // Google App Engine specifics
      if (process.env.GAE_INSTANCE) {
        response.play(`${GAE_URL}/audio/${callSid}/response.mp3`);  
      } else {
        response.play(`https://${req.hostname}/audio/${callSid}/response.mp3`);
      }

      
      if (dialogflowService.isDone) {
        const url = process.env.END_OF_INTERACTION_URL;
        if (url) {
          const queryResult = dialogflowService.getFinalQueryResult();
          const qs = JSON.stringify(queryResult);
          // In case the URL has a ?, use an ampersand
          const appendage = url.includes("?") ? "&" : "?";
          response.redirect(
            `${url}${appendage}dialogflowJSON=${encodeURIComponent(qs)}`
          );
        } else {
          response.hangup();
        }
      } else {
        response.pause({ length: "120" });
      }
    });
  });

  dialogflowService.on("interrupted", transcript => {
    console.log(`interrupted with ${transcript}`);
    
    if (!dialogflowService.isInterrupted) {
      callUpdater(callSid, response => {
        response.pause({ length: 120 });
      });
      dialogflowService.isInterrupted = true;
    }
  });
  dialogflowService.on("error", err => console.error(err));
});

const listener = app.listen(PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
