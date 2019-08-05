# Realtime Transcriptions Demo

This demo is a server application consuming audio from Twilio Media Streams and using Google Cloud Speech to perform real-time transcriptions.

## App sever setup

### Enable Google Cloud Speech API

https://console.cloud.google.com/launcher/details/google/speech.googleapis.com

* Select a Project
* Enable or Manage
* Choose Credentials
  * Create a new Credential or make sure you have the JSON
  * Copy JSON and save as `google_creds.json` in the root of this project


### Installation

**Requires Java >= v1.8**

#### Running the server

`mvn compile && GOOGLE_APPLICATION_CREDENTIALS=./google_creds.json mvn exec:java`

#### Useful pointers
https://cloud.google.com/speech-to-text/docs/streaming-recognize#speech-streaming-recognize-java

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:core:available-phone-numbers:local:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:core:incoming-phone-numbers:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Edit the `src/main/resources/templates/twiml.mustache` file to replace `<ngrok url>` with your ngrok host.

5. Make the call where `+123456789` is the Twilio number you bought and `+198765432` is your phone number and `abcdef.ngrok.io` is your ngrok host.
`twilio api:core:calls:create --from="+123456789" --to="+198765432" --url="https://abcdef.ngrok.io/twiml"`

### Configure using the Console

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening on port 8080)
3. Use ngrok to make your server publicly available: `ngrok http 8080`
4. Edit the twiml.mustache file in the `/src/main/resources/templates/` directory and add your ngrok URL as `wss://<ngrok url>/voice`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`
