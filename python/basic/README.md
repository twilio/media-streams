# Basic Demo

This is a basic server application that consumes audio from Twilio Programmable Media Streams.

It's a good starting point to develop your own application logic.

## App sever setup

### Running the server

1. Create your virtualenv `virtualenv -p python3 env`
2. Run `source env/bin/activate`
3. Run `pip install -r requirements.txt`
4. Run `python ./server.py`

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:core:available-phone-numbers:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:core:calls:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Edit the `templates/streams` file to replace `<ngrok url>` with your ngrok host.

5. Make the call where `+123456789` is the Twilio number you bought and `+198765432` is your phone number and `abcdef.ngrok.io` is your ngrok host.
`twilio api:v2010:accounts:calls:create --from="+123456789" --to="+198765432" --url="https://abcdef.ngrok.io/twiml"`

### Configure using the Console

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening on port 8080)
3. Use ngrok to make your server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`