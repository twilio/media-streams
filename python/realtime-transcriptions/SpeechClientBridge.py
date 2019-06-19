import queue
from threading import Thread
from google.cloud import speech
from google.cloud.speech import types
from google.cloud import translate

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


class TranslationClientBridge:
    def __init__(self):
        self._input = queue.Queue()
        self._output = queue.Queue()
        self.lang = 'it'

        self.translate_client = translate.Client()

    def change_language(self, lang):
        self.lang = lang

    def google_translate(self):
        self._output.put(self.translate_client.translate(self._input.get(), target_language=self.lang)['translatedText'])

    def translate(self):
        while not self._input.empty():
            thread = Thread(target=self.google_translate)
            thread.start()
 
        
    def add(self, sentence):
        self._input.put(sentence)

    def get(self):
        while not self._output.empty():
            res = self._output.get()
            if res != None:
                return res

