# RealTimeTranscription Demo

This demo is just a server application consuming audio from Twilio Programmable Media Streams and using Google Cloud Speech to perform realtime transcriptions.

## App sever setup

### Enable Google Cloud Speech API
https://console.cloud.google.com/launcher/details/google/speech.googleapis.com

### Installation
npm dependencies (contained in the `package.json`):
* dotenv
* httpdispatcher
* websocket
* @google-cloud/speech

Save Google Cloud credentials (JSON) as `google_creds.json` in this project.

### Running
Start with `node ./server.js`

## Making the demo work

1. Run the node server (listening in 8080 port)
2. Use ngrok to make it public available:
   `ngrok http 8080`
3. Edit the next TwiML bin to add your ngrok URL:
  `http://twimlbin.com/02df533fa5642981080cf7fbd2d4e1af`
4. Run the next curl command in order to make the proper call
`curl -XPOST https://api.dev.twilio.com/2010-04-01/Accounts/ACd0250b337a5a1912f6dce8f752195daa/Calls.json -d "Url=http://twimlbin.com/02df533fa5642981080cf7fbd2d4e1af" -d "To=<NUMBER-PHONE>" -d "From=+16028837400" -u ACd0250b337a5a1912f6dce8f752195daa:23ff7ff6f88da448e469908b86f61ae7`
