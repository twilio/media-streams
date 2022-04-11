# Connect-Basic Demo

This is a basic server application that consumes audio from Twilio Media Streams saves it in memory and plays it back.

## App sever setup

### Installation

**Requires Java >= v1.8**

#### Running the server

`mvn compile && mvn exec:java`

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
