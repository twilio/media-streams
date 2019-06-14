# Ruby/Rails Demo using standalone EventMachine based server

### Some batteries required
In order for this to work you need to first setup two bits of configuration

Firstly, in the `config/secrets.yml` file you will need to add your Twilio Account SID and Auth Token rom your Twilio account. You will also need to set the Websocket server URL that we will get passed to the `<Stream></Stream>` block in the TwiML.  **ProTip** this URL should be the URL you setup in your ngrok tunnel for the websockets. 
```
  twilio_account_sid:
  twilio_auth_token:
  websocket_url:
```

Next to get the speech to text engine to work you will need to add your Google App Credentials in json format to `/lib/google/google_application_credentials.json`

### Installation

**Requires Ruby 2.4 or higher**

Run `bundle install`

### Running

Run `rails s` to boot the server and the EventMachine service in a thread.

### ngrok
In order to get ngrok to work correctly it is best to use the tunnels in your ngrok.yml file to route one url to the web port and another to route to the EventMachine Websocket server.

```
tunnels:
   rails:
     proto: http
     addr: 3000
     hostname: myname.ngrok.io
   websockets:
     proto: http
     addr: 3001
     hostname: ws.myname.ngrok.io
``` 

### Helpful Hints
1. This is not threadsafe. I repeat this is not threadsafe. It uses Global variables, so this demo only supports one concurrent call. Perhaps I will write a blog about how to make this threadsafe in the future.
