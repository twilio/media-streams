
from flask import Flask, render_template
from flask_sockets import Sockets

from SpeechClientBridge import SpeechClientBridge
from google.cloud.speech import enums
from google.cloud.speech import types

config = types.RecognitionConfig(
    encoding=enums.RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code='en-US')
streaming_config = types.StreamingRecognitionConfig(
    config=config,
    interim_results=False)

app = Flask(__name__)
sockets = Sockets(app)

@app.route('/twiml', methods=['POST'])
def returnTwiml():
    return render_template('streams.xml')

def onResponse(response):
    if not response.results:
        return

    result = response.results[0]
    if not result.alternatives:
        return

    transcription = result.alternatives[0].transcript
    print("Transcription: " + transcription)

@sockets.route('/')
def transcript(ws):
    print("WS connection openned")
    bridge = SpeechClientBridge(streaming_config, onResponse)

    while not ws.closed:
        message = ws.receive()
        if message is None:
            bridge.terminate()
            break
        bridge.addRequest(message)

    print("WS connection closed")

if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', 8080), app, handler_class=WebSocketHandler)
    print("Server listening on: http://localhost:8080");
    server.serve_forever()
