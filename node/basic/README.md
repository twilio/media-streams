# Basic Demo

This is a basic server application that consumes audio from Twilio Media Streams.

It's a good starting point to develop your own application logic.

## App sever setup

### Installation

**Requires Node >= v12.1.0**

Run `npm install`

npm dependencies (contained in the `package.json`):
* httpdispatcher
* websocket

#### Running the server

Start with `node ./server.js`

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:core:available-phone-numbers:local:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:core:incoming-phone-numbers:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Edit the `templates/streams` file to replace `<ngrok url>` with your ngrok host (found under `Forwarding`). Double check the url only contains `wss://`, not `wss://http://` from adding in your ngrok url.

5. Make the call where `+123456789` is the Twilio number you bought and `+198765432` is your phone number and `abcdef.ngrok.io` is your ngrok host.
`twilio api:core:calls:create --from="+123456789" --to="+198765432" --url="https://abcdef.ngrok.io/twiml"`

### Configure using the Console

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening on port 8080)
3. Use ngrok to make your server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`

### What to expect

Once your server is running and ngrok is setup, when the call is successfully made with Twilio CLI, the console should log a successful connection, with data about the connection, as well as log when the connection ends.

An example log would look like this:

Fri May 03 2019 13:15:14 GMT-0700 (Pacific Daylight Time)Media WS: Connection accepted

Fri May 03 2019 13:15:14 GMT-0700 (Pacific Daylight Time)Media WS: received media and metadata: 
    `{"accountSid":"AC66ece449463a2b0f9e79a0f5f1d17de2","streamSid":"SRce14c5058c2aefe56fb6976d3d3a204d","callSid":"CA0c82d0588098a5ec2f5ef2cd22d683ea","mediaFormat":{"encoding":"audio/x-mulaw","sampleRate":8000,"channels":1},"sequenceNumber":"1","timestamp":"160","payload":"fn5+fv9+/35+fn5+/37/fv9+fv9+fn5+fn7/fv9+fn5+fn5+/35+fn5+fn5+fn5+//9+fn5+fn5+fn5+/35+/35+/35+fn5+fv9+fv9+fn5+/35+fn5+fn5+fn7/fv9+fv9+/37/fn7/fn5+fn5+fn7/fv//fn5+fn7/fn5+fn5+//9+/35+fn5+fv9+fv9+/35+fn5+fn7/fv9+fv9+/w=="}`

Fri May 03 2019 13:15:32 GMT-0700 (Pacific Daylight Time)Media WS: closed
