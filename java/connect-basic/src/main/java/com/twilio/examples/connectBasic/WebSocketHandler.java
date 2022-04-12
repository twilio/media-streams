package com.twilio.examples.connectBasic;

import java.util.*;  
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
    final static Integer repeatThreshold = 10;
    ArrayList<String> mediaMessages = new ArrayList<String>();
    
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
                mediaMessages.add(message);
                if (mediaMessages.size() >= repeatThreshold){
                    logger.info("Accumulated {} messages", mediaMessages.size());
                    repeat(session);
                }   
            }
            if (event.equals("mark")) {
                logger.info("Media WS: Mark event received: {}", message);
            }
            if (event.equals("close")) {
                logger.info("Media WS: Close event received: {}", message);
            }
            messageCounts.merge(session, 1, Integer::sum);
            
            
        } catch (JSONException e) {
            logger.error("Unrecognized JSON: {}", e);
        }
    }

    public void repeat(Session session){
        // ArrayList<String> playMessages = new ArrayList<String>();
        ArrayList<String> playMessages = (ArrayList<String>)mediaMessages.clone();
        mediaMessages.clear();

        JSONObject msg = new JSONObject(playMessages.get(0));

        String streamSid = msg.getString("streamSid");
        logger.info("StreamSid: {}", streamSid);

        String payloadsCombined="";

        for (int i=0; i<playMessages.size(); i++){
            msg = new JSONObject(playMessages.get(i));
            JSONObject mediaJSON = msg.getJSONObject("media");
            byte[] decoded = Base64.getDecoder().decode(mediaJSON.getString("payload"));
            try{
                payloadsCombined = payloadsCombined.concat(new String(decoded, "UTF-8"));
            } catch (IOException e) {
                logger.error("encoding/decoding error: {}", e);
            }
        }
        //logger.info("Final payload: {}", payloadsCombined);

        byte[] encodedBytes = Base64.getEncoder().encode(payloadsCombined.getBytes());

        String response;
        JSONObject jsonResponse = new JSONObject();
        jsonResponse.put("event", "media");
        jsonResponse.put("streamSid",streamSid);

        JSONObject jsonMedia = new JSONObject();
        jsonMedia.put("payload", new String(encodedBytes));
        jsonResponse.put("media", jsonMedia);
        // expected format:
        // {
        //     event: "media",
        //     streamSid,
        //     media: {
        //       payload,
        //     },
        //   };


        // send the data
        //logger.info("Sending {}", jsonResponse.toString());
        try{
            session.getRemote().sendString(jsonResponse.toString());
        } catch (IOException e) {
            logger.error("sending error: {}", e);
        }

        // TODO: send mark event

        logger.info("cleared count: {}", mediaMessages.size());

    }
    
    
    
    @OnWebSocketClose
    public void closed(Session session, int statusCode, String reason) {
        Integer count = messageCounts.remove(session);
        logger.info("Media WS: Closed. Total of {} messages were sent.", count);
    }
}