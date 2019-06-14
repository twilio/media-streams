# Ruby/Rails Demo using a Rails Controller

### Some batteries required
In order for this to work you need to first setup two bits of configuration

Firstly, in the `config/secrets.yml` file you will need to add your Twilio Account SID and Auth Token rom your Twilio account. You will also need to set the Websocket server URL that we will get passed to the `<Stream></Stream>` block in the TwiML. **ProTip** this url should be URL you are using with your app via ngrok with the path `/websocket/process` appended.
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

Run `rails s` to boot the server.

### Helpful Hints
1. This is not threadsafe. I repeat this is not threadsafe. It uses Global variables, so this demo only supports one concurrent call. Perhaps I will write a blog about how to make this threadsafe in the future.
