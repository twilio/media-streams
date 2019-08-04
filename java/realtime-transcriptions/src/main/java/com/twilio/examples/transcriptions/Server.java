package com.twilio.examples.transcriptions;

import spark.ModelAndView;
import spark.template.mustache.MustacheTemplateEngine;

import static spark.Spark.*;

public class Server {

    public static void main(String[] args) {
        port(8080);
        webSocket("/voice", WebSocketHandler.class);
        post("/twiml", (req, res) -> new ModelAndView(null, "twiml.mustache"),
                new MustacheTemplateEngine());
        init();
    }
}
