# Basic Demo

This demo is just a basic server application consuming audio from Twilio Programmable Media Streams.
It is a good start point to develop your own application logic.

## App sever setup

### Node Example

#### Installation
Run `npm install`

npm dependencies (contained in the `package.json`):
* httpdispatcher
* websocket

#### Running the server
Start with `node ./server.js`

### Python Example

#### Running the server

1. Create your virtualenv `python3.6 -m venv --without-pip test`
2. Run `source env/bin/activate`
3. Run `pip3.6 install -r requirements.txt`
5. Run `python3.6 ./server.py`

## Making the demo work

1. Acces the [Twilio console](https://www.twilio.com/console/voice/numbers) to get a `<TWILIO-PHONE-NUMBER>`.
2. Run the server (listening in 8080 port)
3. Use ngrok to make it publicly available: `ngrok http 8080`
4. Edit the streams.xml file in the `templates` directory and add your ngrok URL as `wss://<ngrok url>`
5. Run the curl command in order to make the proper call
`curl -XPOST https://api.twilio.com/2010-04-01/Accounts/<ACCOUNT-SID>/Calls.json -d "Url=http://<ngrok url>/twiml" -d "To=<PHONE-NUMBER>" -d "From=<TWILIO-PHONE-NUMBER>" -u <ACCOUNT-SID>:<AUTH-TOKEN>`
