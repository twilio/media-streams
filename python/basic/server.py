from flask import Flask, render_template
from flask_sockets import Sockets

import json
import base64

HTTP_SERVER_PORT = 8080

app = Flask(__name__)
sockets = Sockets(app)

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
    print("Transcription: " + transcription)

@sockets.route('/')
def transcript(ws):
    print("WS connection openned")

    while not ws.closed:
        message = ws.receive()
        if message is None:
            bridge.terminate()
            break

        data = json.loads(message)
        if data["sequenceNumber"] is "1":
            print("Media WS: received media and metadata: " + str(data))

    print("WS connection closed")

if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    print("Server listening on: http://localhost:" + str(HTTP_SERVER_PORT))
    server.serve_forever()
