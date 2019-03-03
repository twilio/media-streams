import asyncio
import signal
import websockets

from google.cloud import speech
from google.cloud.speech import enums
from google.cloud.speech import types

client = speech.SpeechClient()
config = types.RecognitionConfig(
    encoding=enums.RecognitionConfig.AudioEncoding.MULAW,
    sample_rate_hertz=8000,
    language_code='en-US')
streaming_config = types.StreamingRecognitionConfig(config=config)



async def pcmu(websocket, path):
    while True:
        try:
            audio = await websocket.recv()
            request = types.StreamingRecognizeRequest(audio_content=audio)
            requests = [request]
            responses = client.streaming_recognize(streaming_config, requests)
            process_response(responses)
        except websockets.ConnectionClosed:
            break
        else:
            pass
        

def process_response(responses):
    for response in responses:
        for result in response.results:
            print('Finished: {}'.format(result.is_final))
            print('Stability: {}'.format(result.stability))
            for alternative in result.alternatives:
                print('=' * 20)
                print(u'transcript: {}'.format(alternative.transcript))
                print('confidence: {}'.format(str(alternative.confidence)))

loop = asyncio.get_event_loop()

start_server = websockets.serve(pcmu, 'localhost', 8080)

server = loop.run_until_complete(start_server)

# Run the server until receiving SIGTERM.
stop = asyncio.Future()
loop.add_signal_handler(signal.SIGTERM, stop.set_result, None)
loop.run_until_complete(stop)

# Shut down the server.
server.close()
loop.run_until_complete(server.wait_closed())