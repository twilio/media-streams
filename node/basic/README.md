# Basic Demo

This is a basic server application that consumes audio from Twilio Programmable Media Streams.

It's a good starting point to develop your own application logic.

## App sever setup

### Installation

Run `npm install`

npm dependencies (contained in the `package.json`):
* httpdispatcher
* websocket

#### Running the server

Start with `node ./server.js`

## Making the demo work

1. Access the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening on port 8080)
3. Use ngrok to make your server publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`
