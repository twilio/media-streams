package com.twilio.examples.wav;

import static spark.Spark.*;
import spark.ModelAndView;
import spark.template.mustache.MustacheTemplateEngine;

public class Server {

    public static void main(String[] args) {
        port(8080);
        webSocket("/voice", WebSocketHandler.class);
        post("/twiml", (req, res) -> new ModelAndView(null, "twiml.mustache"),
                new MustacheTemplateEngine());
        init();
    }
}
