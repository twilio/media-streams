package com.example.twilio.mediastreamsazuretranscription;

import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Pause;
import com.twilio.twiml.voice.Say;
import com.twilio.twiml.voice.Start;
import com.twilio.twiml.voice.Stream;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class TwimlRestController {

    @PostMapping(value = "/twiml", produces = "application/xml")
    @ResponseBody
    public String getStreamsTwiml(@RequestHeader(value = "Host") String hostHeader,
                                  @RequestHeader(value = "X-Original-Host", required = false) String originalHostname) {

        String wssUrl = createWebsocketUrl(hostHeader, originalHostname);
        
        return new VoiceResponse.Builder()
            .say(new Say.Builder("Hello! Start talking and the live audio will be streamed to your app").build())
            .start(new Start.Builder().stream(new Stream.Builder().url(wssUrl).build()).build())
            .pause(new Pause.Builder().length(30).build())
            .build().toXml();
    }


    private String createWebsocketUrl(String hostHeader, String originalHostHeader) {
        // We need to know the public-facing hostname to generate the wss:// URL
        // for media-streams. If there is an X-Original-Host header (ie we are
        // behind a header-rewriting proxy) then use that. Otherwise use the
        // value from the host header
        String publicHostname = originalHostHeader;
        if (publicHostname == null) {
            publicHostname = hostHeader;
        }

        return "wss://" + publicHostname + "/messages";
    }

}
