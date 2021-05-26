package com.example.twilio.mediastreamsazuretranscription;

import com.example.twilio.mediastreamsazuretranscription.azure.AzureSpeechToTextService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.AbstractWebSocketHandler;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TwilioMediaStreamsHandler extends AbstractWebSocketHandler {

    private final Map<WebSocketSession, AzureSpeechToTextService> sessions = new ConcurrentHashMap<>();

    private final ObjectMapper jsonMapper = new ObjectMapper();
    private final Base64.Decoder base64Decoder = Base64.getDecoder();;

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        System.out.println("Connection Established");
        sessions.put(session, new AzureSpeechToTextService(System.out::println));
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws JsonProcessingException {

        JsonNode messageNode = jsonMapper.readTree(message.getPayload());

        String base64EncodedAudio = messageNode.path("media").path("payload").asText();

        if (base64EncodedAudio.length() > 0){
            // not every message contains audio data
            byte[] data = base64Decoder.decode(base64EncodedAudio);
            sessions.get(session).accept(data);
        }

    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        System.out.println("Connection Closed");
        sessions.get(session).close();
        sessions.remove(session);
    }
}
