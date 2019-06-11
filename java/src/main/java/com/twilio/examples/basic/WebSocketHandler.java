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

    @OnWebSocketConnect
    public void connected(Session session) {
        logger.info("Media WS: Connection Accepted");
    }

    @OnWebSocketMessage
    public void message(Session session, String message) throws IOException {
        try {
            JSONObject jo = new JSONObject(message);
            String sequenceNumber = jo.getString("sequenceNumber");
            if (sequenceNumber.equals("1")) {
                logger.info("Media WS: received media and metadata: {}", message);
                logger.warn("Media WS: Additional messages from WebSocket are now being suppressed");
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
