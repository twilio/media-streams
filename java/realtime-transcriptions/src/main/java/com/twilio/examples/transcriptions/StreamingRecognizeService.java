package com.twilio.examples.transcriptions;


import com.google.api.gax.rpc.ClientStream;
import com.google.api.gax.rpc.ResponseObserver;
import com.google.api.gax.rpc.StreamController;
import com.google.cloud.speech.v1.*;
import com.google.protobuf.ByteString;

import java.io.IOException;
import java.util.Base64;
import java.util.function.Consumer;

import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


public class StreamingRecognizeService {
    // Heavily based on: https://cloud.google.com/speech-to-text/docs/streaming-recognize#speech-streaming-recognize-java
    final static Logger logger = LoggerFactory.getLogger(StreamingRecognizeService.class);
    ClientStream<StreamingRecognizeRequest> clientStream;
    ResponseObserver<StreamingRecognizeResponse> responseObserver;

    public StreamingRecognizeService(Consumer<String> onTranscription, boolean includeInterimResults) throws IOException {
        SpeechClient client = SpeechClient.create();
        responseObserver = new ResponseObserver<StreamingRecognizeResponse>() {
            @Override
            public void onStart(StreamController streamController) {
                logger.info("Started");
            }

            @Override
            public void onResponse(StreamingRecognizeResponse streamingRecognizeResponse) {
                StreamingRecognitionResult result = streamingRecognizeResponse.getResultsList().get(0);
                SpeechRecognitionAlternative alternative = result.getAlternativesList().get(0);
                onTranscription.accept(alternative.getTranscript());
            }

            @Override
            public void onError(Throwable throwable) {
                logger.error("Error on recognize request: {}", throwable);
            }

            @Override
            public void onComplete() {
                logger.info("Completed");
            }
        };

        clientStream = client.streamingRecognizeCallable().splitCall(responseObserver);

        RecognitionConfig recognitionConfig =
                RecognitionConfig.newBuilder()
                        .setEncoding(RecognitionConfig.AudioEncoding.MULAW)
                        .setLanguageCode("en-US")
                        .setSampleRateHertz(8000)
                        .build();
        StreamingRecognitionConfig streamingRecognitionConfig =
                StreamingRecognitionConfig.newBuilder()
                        .setConfig(recognitionConfig)
                        .setInterimResults(includeInterimResults)
                        .build();

        StreamingRecognizeRequest request =
                StreamingRecognizeRequest.newBuilder()
                        .setStreamingConfig(streamingRecognitionConfig)
                        .build(); // The first request in a streaming call has to be a config

        clientStream.send(request);
    }

    public void send(String message) {
        try {
            JSONObject jo = new JSONObject(message);
            String payload = jo.getString("payload");
            byte[] data = Base64.getDecoder().decode(payload);
            StreamingRecognizeRequest request =
                    StreamingRecognizeRequest.newBuilder()
                            .setAudioContent(ByteString.copyFrom(data))
                            .build();
            clientStream.send(request);

        } catch (JSONException e) {
            logger.error("Unrecognized JSON");
            e.printStackTrace();
        }

    }

    public void close() {
        logger.info("Closed");
        responseObserver.onComplete();
    }

}

