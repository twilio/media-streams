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

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:v2010:accounts:available-phone-numbers:local:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:v2010:accounts:incoming-phone-numbers:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Edit the `templates/streams` file to replace `<ngrok url>` with your ngrok host (found under `Forwarding`). Double check the url only contains `wss://`, not `wss://http://` from adding in your ngrok url.

5. Make the call where `+123456789` is the Twilio number you bought and `+198765432` is your phone number and `abcdef.ngrok.io` is your ngrok host.
`twilio api:v2010:accounts:calls:create --from="+123456789" --to="+198765432" --url="https://abcdef.ngrok.io/twiml"`

### Configure using the Console

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening in 8080 port)
3. Use ngrok to make the server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`

### What to expect

Once your server is running and ngrok is setup, when the call is successfully made with Twilio CLI, the console should log a successful connection, with data about the connection, as well as log when the connection ends.

After the connection data is logged, a transcription of the caller's speech will show in the log. If you are troubleshooting or want to see the real time transcription, change `interimResults: false` to `interimResults: true` on line 124 of the server.js file.

An example log would look like this:

Fri May 03 2019 13:15:14 GMT-0700 (Pacific Daylight Time)Media WS: Connection accepted

Fri May 03 2019 13:15:14 GMT-0700 (Pacific Daylight Time)Media WS: received media and metadata: 
    `{"accountSid":"AC66ece449463a2b0f9e79a0f5f1d17de2","streamSid":"SRce14c5058c2aefe56fb6976d3d3a204d","callSid":"CA0c82d0588098a5ec2f5ef2cd22d683ea","mediaFormat":{"encoding":"audio/x-mulaw","sampleRate":8000,"channels":1},"sequenceNumber":"1","timestamp":"160","payload":"fn5+fv9+/35+fn5+/37/fv9+fv9+fn5+fn7/fv9+fn5+fn5+/35+fn5+fn5+fn5+//9+fn5+fn5+fn5+/35+/35+/35+fn5+fv9+fv9+fn5+/35+fn5+fn5+fn7/fv9+fv9+/37/fn7/fn5+fn5+fn7/fv//fn5+fn7/fn5+fn5+//9+/35+fn5+fv9+fv9+/35+fn5+fn7/fv9+fv9+/w=="}`

Fri May 03 2019 13:15:17 GMT-0700 (Pacific Daylight Time)Transcription: Hello.
Fri May 03 2019 13:15:18 GMT-0700 (Pacific Daylight Time)Transcription: Hello.
Fri May 03 2019 13:15:18 GMT-0700 (Pacific Daylight Time)Transcription: Okay.
Fri May 03 2019 13:15:19 GMT-0700 (Pacific Daylight Time)Transcription: Okay, we
Fri May 03 2019 13:15:20 GMT-0700 (Pacific Daylight Time)Transcription: Okay, we 're
Fri May 03 2019 13:15:20 GMT-0700 (Pacific Daylight Time)Transcription: Okay we were.
Fri May 03 2019 13:15:22 GMT-0700 (Pacific Daylight Time)Transcription: Okay we receive

Fri May 03 2019 13:15:32 GMT-0700 (Pacific Daylight Time)Media WS: closed
