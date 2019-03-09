import asyncio
import os
import websockets
import sys
import base64

from flask import Flask, render_template
from flask_sockets import Sockets
from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types
from pyee import EventEmitter
from pdb import set_trace as bp

client = speech.SpeechClient()
config = types.RecognitionConfig(
    encoding=enums.RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code='en-US')
streaming_config = types.StreamingRecognitionConfig(config=config,interim_results=True)

app = Flask(__name__)
sockets = Sockets(app)
ee = EventEmitter()



@app.route('/twiml', methods=['POST'])
def returnTwiml():
    return render_template('streams.xml')


import queue
from threading import Thread
class RequestGenerator:
    def __init__(self):
        self._queue = queue.Queue()
        self._ended = False

    def terminate(self):
        self._ended = True

    def addRequest(self, buffer):
        self._queue.put(types.StreamingRecognizeRequest(audio_content=bytes(buffer)))

    def getRequests(self):
        while not self._ended:
            yield self._queue.get()
        return

@sockets.route('/')
def pcmu(ws):
    print("WS connection openned")
    myQueue = RequestGenerator()
    responses = client.streaming_recognize(streaming_config, myQueue.getRequests())
    thread = Thread(target=listen_print_loop, args=[responses])
    thread.start()
    print("Thread started")

    while not ws.closed:
        message = ws.receive()
        if message is None:
            myQueue.terminate()
            return

        myQueue.addRequest(message)
    print("WS connection closed")


@ee.on('response')
def process_response(responses):
    listen_print_loop(responses)




def listen_print_loop(responses):
    """Iterates through server responses and prints them.

    The responses passed is a generator that will block until a response
    is provided by the server.

    Each response may contain multiple results, and each result may contain
    multiple alternatives; for details, see https://goo.gl/tjCPAU.  Here we
    print only the transcription for the top alternative of the top result.

    In this case, responses are provided for interim results as well. If the
    response is an interim one, print a line feed at the end of it, to allow
    the next result to overwrite it, until the response is a final one. For the
    final one, print a newline to preserve the finalized transcription.
    """
    num_chars_printed = 0
    print("Before responses loop")
    for response in responses:
        #print("ANALYZING RESPONSE")
        #bp()
        if response.error:
            print(response.error)

        if not response.results:
            continue

        # The `results` list is consecutive. For streaming, we only care about
        # the first result being considered, since once it's `is_final`, it
        # moves on to considering the next utterance.
        result = response.results[0]
        if not result.alternatives:
            continue

        # Display the transcription of the top alternative.
        transcript = result.alternatives[0].transcript

        # Display interim results, but with a carriage return at the end of the
        # line, so subsequent lines will overwrite them.
        #
        # If the previous result was longer than this one, we need to print
        # some extra spaces to overwrite the previous result
        overwrite_chars = ' ' * (num_chars_printed - len(transcript))

        if not result.is_final:
            sys.stdout.write(transcript + overwrite_chars + '\r')
            sys.stdout.flush()

            num_chars_printed = len(transcript)

        else:
            print(transcript + overwrite_chars)

            # Exit recognition if any of the transcribed phrases could be
            # one of our keywords.
            #if re.search(r'\b(exit|quit)\b', transcript, re.I):
            #    print('Exiting..')
            #    break

            num_chars_printed = 0
    print("Ending responses loop")



if __name__ == '__main__':
    from gevent import pywsgi
    from geventwebsocket.handler import WebSocketHandler

    server = pywsgi.WSGIServer(('', 8080), app, handler_class=WebSocketHandler)
    server.serve_forever()
