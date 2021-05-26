package com.example.twilio.mediastreamsazuretranscription.azure;

import com.microsoft.cognitiveservices.speech.SpeechConfig;
import com.microsoft.cognitiveservices.speech.SpeechRecognitionResult;
import com.microsoft.cognitiveservices.speech.SpeechRecognizer;
import com.microsoft.cognitiveservices.speech.audio.AudioConfig;
import com.microsoft.cognitiveservices.speech.audio.AudioInputStream;
import com.microsoft.cognitiveservices.speech.audio.AudioStreamFormat;
import com.microsoft.cognitiveservices.speech.audio.PushAudioInputStream;

import java.util.function.Consumer;

public class AzureSpeechToTextService {

    // The values for these environment variables are available on the Azure Portal
    // If they are not set correctly you will see:
    // NullPointerException: at com.microsoft.cognitiveservices.speech.util.Contracts.throwIfNullOrWhitespace(Contracts.java:44)
    private static final String SPEECH_SUBSCRIPTION_KEY = System.getenv("AZURE_SPEECH_SUBSCRIPTION_KEY");
    private static final String SERVICE_REGION = System.getenv("AZURE_SERVICE_REGION");

    private final PushAudioInputStream azurePusher;

    public AzureSpeechToTextService(Consumer<String> transcriptionHandler) {

        azurePusher = AudioInputStream.createPushStream(AudioStreamFormat.getWaveFormatPCM(8000L, (short) 16, (short) 1));

        SpeechRecognizer speechRecognizer = new SpeechRecognizer(
            SpeechConfig.fromSubscription(SPEECH_SUBSCRIPTION_KEY, SERVICE_REGION),
            AudioConfig.fromStreamInput(azurePusher));

        speechRecognizer.recognizing.addEventListener((o, speechRecognitionEventArgs) -> {
            SpeechRecognitionResult result = speechRecognitionEventArgs.getResult();
            transcriptionHandler.accept("recognizing: " + result.getText());
        });

        speechRecognizer.recognized.addEventListener((o, speechRecognitionEventArgs) -> {
            SpeechRecognitionResult result = speechRecognitionEventArgs.getResult();
            transcriptionHandler.accept("recognized: " + result.getText());
        });

        speechRecognizer.startContinuousRecognitionAsync();
    }

    public void accept(byte[] mulawData) {
        azurePusher.write(MulawToPcm.transcode(mulawData));
    }

    public void close() {
        System.out.println("Closing");
        azurePusher.close();
    }
}
