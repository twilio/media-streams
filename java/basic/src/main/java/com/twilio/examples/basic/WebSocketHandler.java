package com.twilio.examples.basic;


import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketClose;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketConnect;
import org.eclipse.jetty.websocket.api.annotations.OnWebSocketMessage;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;


@WebSocket
public class WebSocketHandler {
    final static Logger logger = LoggerFactory.getLogger(WebSocketHandler.class);
    final static Map<Session, Integer> messageCounts = new ConcurrentHashMap<>();
    final static Map<Session, Boolean> hasSessionSeenMedia = new ConcurrentHashMap<>();

    @OnWebSocketConnect
    public void connected(Session session) {
        logger.info("Media WS: Connection Accepted");
    }

    @OnWebSocketMessage
    public void message(Session session, String message) throws IOException {
        try {
            JSONObject jo = new JSONObject(message);
            String event = jo.getString("event");
            Boolean hasSeenMedia = hasSessionSeenMedia.getOrDefault(session, false);
            if (event.equals("connected")) {
                logger.info("Media WS: Connected message received: {}", message);
            }
            if (event.equals("start")) {
                logger.info("Media WS: Start message received: {}", message);
            }
            if (event.equals("media")) {
                if (!hasSeenMedia) {
                    logger.info("Media WS: Media message received: {}", message);
                    logger.warn("Media WS: Additional messages from WebSocket are now being suppressed");
                    hasSessionSeenMedia.put(session, true);
                }

            }
            messageCounts.merge(session, 1, Integer::sum);

        } catch (JSONException e) {
            logger.error("Unrecognized JSON: {}", e);
        }
    }

    @OnWebSocketClose
    public void closed(Session session, int statusCode, String reason) {
        Integer count = messageCounts.remove(session);
        logger.info("Media WS: Closed. Total of {} messages were sent.", count);
    }
}