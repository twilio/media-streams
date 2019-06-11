from flask import Flask, render_template
from flask_sockets import Sockets

import json
import base64

HTTP_SERVER_PORT = 8080

app = Flask(__name__)
sockets = Sockets(app)

@app.route('/twiml', methods=['POST'])
def return_twiml():
    print("POST TwiML")
    return render_template('streams.xml')

@sockets.route('/')
def echo(ws):
    print("Media WS: Connection accepted")
    count = 0
    while not ws.closed:
        message = ws.receive()
        if message is None:
            print('No message')
            break

        data = json.loads(message)
        if data["sequenceNumber"] == "1":
            print("Media WS: Received media and metadata: " + str(data))
            print("Media WS: Additional messages from WebSocket are being suppressed.")
        count += 1

    print("Media WS: Connection closed. Received a total of {} messages".format(count))

if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', HTTP_SERVER_PORT), app, handler_class=WebSocketHandler)
    print("Server listening on: http://localhost:" + str(HTTP_SERVER_PORT))
    server.serve_forever()
