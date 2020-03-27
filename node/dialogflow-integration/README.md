# MediaStreams => DialogFlow

An express app that responds with TwiML to `<Start>` a MediaStream and connect it to DialogFlow.

## Installation

```
npm install
```

Populate your .env file from the .env.example using `configure-env`

```bash
npx configure-env
```

Wire up a Twilio number with an incoming handler to your server `/twiml`. Use ngrok for local development.

Wire up your Twilio number with your endpoint on incoming calls.

```bash
twilio api:core:incoming-phone-numbers:update --sid=PNXXXXXXXXXXXXXXXXXXXXXX --voice-url=https://<YOUR WEB URL>/twiml
```

Store your Google Credential file and in the root in a file named `google_creds.json`


#### Local development

```bash
npm start
```

#### Deploy to AppEngine

```bash
gcloud app deploy
```

## Capture Intent after End of Interaction

If you set `END_OF_INTERACTION_URL` to a Webhook that you host, you can handle events. You will receive `dialogflowJSON` as a querystring on your webhook.

The JSON will contain the Intent's information for you to code your response.

Here is an example using a Twilio Function:

```javascript
exports.handler = function(context, event, callback) {
  const twiml = new Twilio.twiml.VoiceResponse();
  const dialogflow = JSON.parse(event.dialogflowJSON);
  switch (dialogflow.intent.displayName) {
    case 'speak-to-an-agent':
      console.log(`Dialing agent number configured in environment: ${process.env.AGENT_NUMBER}`);
      twiml.dial(process.env.AGENT_NUMBER);
      break;
    default:
      console.error(`Intent: "${dialogflow.intent.displayName}" (${dialogflow.intent.name}) was not handled.`);
      twiml.hangup();
  }
  callback(null, twiml);
}; 
```