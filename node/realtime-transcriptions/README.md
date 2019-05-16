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

**Requires Node >= v12.1.0**

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

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:core:available-phone-numbers:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:core:incoming-phone-numbers:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Edit the `templates/streams` file to replace `<ngrok url>` with your ngrok host.

5. Make the call where `+123456789` is the Twilio number you bought and `+198765432` is your phone number and `abcdef.ngrok.io` is your ngrok host.
`twilio api:core:calls:create --from="+123456789" --to="+198765432" --url="https://abcdef.ngrok.io/twiml"`

### Configure using the Console

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening in 8080 port)
3. Use ngrok to make the server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`
