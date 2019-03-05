# RealTimeTranscription Demo

This demo is just a server application consuming audio from Twilio Programmable Media Streams and using Google Cloud Speech to perform realtime transcriptions.

## App sever setup

### Enable Google Cloud Speech API
https://console.cloud.google.com/launcher/details/google/speech.googleapis.com

* Select a Project
* Enable or Manage
* Choose Credentials
    * Create a new Credential or make sure you have the JSON
    * Copy JSON and save as `google_creds.json` in the root of this project

### Installation
npm dependencies (contained in the `package.json`):
* dotenv
* httpdispatcher
* websocket
* @google-cloud/speech


### Running
Start with `node ./server.js`

## Making the demo work

1. Run the node server (listening in 8080 port)
2. Use ngrok to make it public available:
   `ngrok http 8080`
3. Edit the next TwiML bin to add your ngrok URL as `wss://<ngrok url>`:
  `templates/streams.xml`
4. Run the next curl command in order to make the proper call
`curl -XPOST https://api.dev.twilio.com/2010-04-01/Accounts/ACd0250b337a5a1912f6dce8f752195daa/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<NUMBER-PHONE>" -d "From=+16028837400" -u ACd0250b337a5a1912f6dce8f752195daa:23ff7ff6f88da448e469908b86f61ae7`
