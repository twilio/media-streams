from flask import Flask, render_template
from flask_sockets import Sockets

from SpeechClientBridge import SpeechClientBridge, TranslationClientBridge
from google.cloud.speech import enums
from google.cloud.speech import types


import json
import base64

HTTP_SERVER_PORT = 8080

config = types.RecognitionConfig(
    encoding=enums.RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code='en-US')
streaming_config = types.StreamingRecognitionConfig(
    config=config,
    interim_results=True)

app = Flask(__name__)
sockets = Sockets(app)
translator = TranslationClientBridge()


languages = {
    'italian': 'it' ,
    'spanish': 'es', 
    'chinese': 'zh-CN',       
    'german': 'de',
    'french': 'fr'
    }


@app.route('/twiml', methods=['POST'])
def returnTwiml():
    print("POST TwiML")
    return render_template('streams.xml')

def onResponse(response):
    if not response.results:
        return

    result = response.results[0]
    if not result.alternatives:
        return

    transcription = result.alternatives[0].transcript
    #print("Transcription: " + transcription)
    
    translator.add(transcription)

    for lang, code in languages.items():
        if lang in transcription.lower():
            translator.change_language(code)

@sockets.route('/')
def transcript(ws):
    print("WS connection opened")
    bridge = SpeechClientBridge(streaming_config, onResponse)

    while not ws.closed:
        message = ws.receive()
        if message is None:
            bridge.terminate()
            break

        data = json.loads(message)
        #if data["sequenceNumber"] is "1":
        #    print("Media WS: received media and metadata: " + str(data))

        buffer = base64.b64decode(data["payload"])
        bridge.addRequest(buffer)

        translator.translate()
        res = translator.get()
        if res:
            print(translator.lang.upper() + ": " + res)
    print("WS connection closed")

if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    print("Server listening on: http://localhost:" + str(HTTP_SERVER_PORT))
    server.serve_forever()
