package com.twilio.examples.transcriptions;

import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@WebSocket
public class WebSocketHandler {
    final static Logger logger = LoggerFactory.getLogger(WebSocketHandler.class);
    final static Map<Session, StreamingRecognizeService> recognizers = new ConcurrentHashMap<>();

    @OnWebSocketConnect
    public void connected(Session session) {
        logger.info("Connected");

        StreamingRecognizeService recognizer = null;
        try {
            recognizer = new StreamingRecognizeService(transcription -> {
                logger.info("Transcription: {}", transcription);
            }, true);
        } catch (IOException e) {
            String message = "Unable to connect to StreamingRecognizeService";
            logger.error(message);
            e.printStackTrace();
            // Close the WebSocket for this session
            // TODO: Are these defined?
            session.close(-1, message);
            System.exit(0);
            return;
        }
        recognizers.put(session, recognizer);
    }

    @OnWebSocketMessage
    public void message(Session session, String message) {
        recognizers.get(session).send(message);
    }

    @OnWebSocketClose
    public void closed(Session session, int statusCode, String reason) {
        logger.info("Closed. {}: {}", statusCode, reason);
        StreamingRecognizeService recognizer = recognizers.remove(session);
        recognizer.close();
    }
}
