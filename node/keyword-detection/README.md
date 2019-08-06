# Keyword Detection Demo

This demo is a server application consuming audio from Twilio Media Streams and using IBM Watson Cloud Text to Speech to perform realtime transcriptions and keyword detection.

## App sever setup

### Create a new IBM Cloud Resource

https://cloud.ibm.com/catalog/services/speech-to-text

On the **Credentials** card choose the **Download** link. Save the file ibm-credentials.env in the same folder as this file.

### Installation

**Requires Node >= v12**

Run `npm install`

#### Running the server

Start with `npm start any keywords you want to search for`

## Setup

You can setup your environment to run the demo by using the CLI (BETA) or the Console.

### Configure using the CLI

1. Find available phone number
`twilio api:core:available-phone-numbers:local:list --country-code="US" --voice-enabled --properties="phoneNumber"`

2. Purchase the phone number (where `+123456789` is a number you found)
`twilio api:core:incoming-phone-numbers:create --phone-number="+123456789"`

3. Start ngrok
`ngrok http 8080`

4. Wire up an incoming call handler to your number using a **TwiML Bin**
```
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://<Your ngrok host name here>.ngrok.io/media" />
  </Start>
  <Pause length="40" />
</Response>
```

5. Call your number `+123456789` from a phone.

6. Speak the keywords and see them get detected in realtime
