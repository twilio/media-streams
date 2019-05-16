import queue
from threading import Thread
from google.cloud import speech
from google.cloud.speech import types

class SpeechClientBridge:
    def __init__(self, streaming_config, onResponse):
        self._onResponse = onResponse
        self._queue = queue.Queue()
        self._ended = False

        client = speech.SpeechClient()
        responses = client.streaming_recognize(streaming_config, self.getRequests())
        self.processResponses(responses)

    def terminate(self):
        self._ended = True

    def addRequest(self, buffer):
        self._queue.put(types.StreamingRecognizeRequest(audio_content=bytes(buffer)))

    def getRequests(self):
        while not self._ended:
            yield self._queue.get()

    def processResponses(self, responses):
        thread = Thread(target=self.processResponsesLoop, args=[responses])
        thread.start()

    def processResponsesLoop(self, responses):
        for response in responses:
            self._onResponse(response)

            if self._ended:
              break;
