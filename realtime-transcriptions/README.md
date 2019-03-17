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

### Node Example

#### Installation
npm dependencies (contained in the `package.json`):
* dotenv
* httpdispatcher
* websocket
* @google-cloud/speech

#### Running the server
Start with `node ./server.js`

#### Useful pointers
https://cloud.google.com/nodejs/docs/reference/speech/2.2.x/v1.SpeechClient#properties

### Python Example

#### Running the server

1. Create your virtualenv `python3.6 -m venv --without-pip test`
2. Run `source env/bin/activate`
3. Run `pip3.6 install -r requirements.txt`
4. Set the Google App Credentials from above for your env.
    `export GOOGLE_APPLICATION_CREDENTIALS="./google_creds.json"`
5. Run `python3.6 ./server.py`

#### Useful pointers
https://google-cloud-python.readthedocs.io/en/0.32.0/speech/gapic/api.html
https://github.com/GoogleCloudPlatform/python-docs-samples/blob/master/speech/cloud-client/transcribe_streaming_mic.py

## Making the demo work

1. Run the server (listening in 8080 port)
2. Use ngrok to make it publicly available:
   `ngrok http 8080`
3. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
4. Run the curl command in order to make the proper call
`curl -XPOST https://api.dev.twilio.com/2010-04-01/Accounts/ACd0250b337a5a1912f6dce8f752195daa/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<NUMBER-PHONE>" -d "From=+16028837400" -u ACd0250b337a5a1912f6dce8f752195daa:23ff7ff6f88da448e469908b86f61ae7`
