package com.twilio.examples.basic;

import static spark.Spark.*;

public class Server {

    public static void main(String[] args) {
        webSocket("/voice", WebSocketHandler.class);
        staticFileLocation("/public");
        init();
    }
}
