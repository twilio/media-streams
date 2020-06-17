# Google Dialogflow Integration

An Express app that responds with TwiML to `<Connect>` to a MediaStream and connect it with a specified [Dialogflow](https://dialogflow.com/).

## Prerequisites

* Setup a [Dialogflow Agent](https://cloud.google.com/dialogflow/docs/agents-overview) and make note of the Google Project ID
* Download your [Google Credentials](https://cloud.google.com/docs/authentication/getting-started) (that has access to your Dialogflow project) to a file named `google_creds.json` store that in the root of this folder.
* Optional: Setup and Configure the **gcloud** command line tool so that you can deploy to [Google AppEngine](https://cloud.google.com/sdk/gcloud/reference/app)

## Installation

```
npm install
```

Populate your `.env` file from the `.env.example` file using `configure-env`

```bash
npx configure-env
```

Install the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart)

Optional: Purchase a Twilio number (or use an existing one)

Optional: Search for available numbers in the **650** area code in the US

```bash
twilio api:core:available-phone-numbers:local:list  --area-code="650" --country-code=US --voice-enabled
```

Optional: Buy a number

```bash
twilio api:core:incoming-phone-numbers:create --phone-number="+16505551234"
```

### Develop locally

Start the server locally

```bash
npm start
```

Wire up your Twilio number with your endpoint on incoming calls. This will automatically start an [ngrok](https://ngrok.com) tunnel to your machine.

```bash
twilio phone-numbers:update +15552223333 --voice-url=http://localhost:3000/twiml
```

### Deploy to AppEngine

```bash
gcloud app deploy
```

Point your Incoming Webhook to your AppEngine instance.

```bash
twilio phone-numbers:update +15552223333 --voice-url=https://YOUR-APPENGINE-INSTANCE.appspot.com/twiml
```

## Capture Intent after End of Interaction

If you set `END_OF_INTERACTION_URL` in your `.env` file to a Webhook that you host, you can handle events. You will receive `dialogflowJSON` as a querystring on your Webhook.

The JSON will contain the Intent's information for you to code your response.

Here is an example using a [Twilio Function](https://www.twilio.com/docs/runtime/functions):

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
}
```
