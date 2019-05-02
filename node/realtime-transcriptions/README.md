# RealTimeTranscription Demo

This demo is a server application consuming audio from Twilio Programmable Media Streams and using Google Cloud Speech to perform realtime transcriptions.

## App sever setup

### Enable Google Cloud Speech API

https://console.cloud.google.com/launcher/details/google/speech.googleapis.com

* Select a Project
* Enable or Manage
* Choose Credentials
  * Create a new Credential or make sure you have the JSON
  * Copy JSON and save as `google_creds.json` in the root of this project

### Installation

Run `npm install`

#### npm dependencies (defined in the `package.json`):

* dotenv
* httpdispatcher
* websocket
* @google-cloud/speech

#### Running the server

Start with `node ./server.js`

#### Useful pointers

https://cloud.google.com/nodejs/docs/reference/speech/2.2.x/v1.SpeechClient#properties

https://google-cloud-python.readthedocs.io/en/0.32.0/speech/gapic/api.html

https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/speech/cloud-client/transcribe_streaming_mic.py

## Making the demo work

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening in 8080 port)
3. Use ngrok to make the server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`