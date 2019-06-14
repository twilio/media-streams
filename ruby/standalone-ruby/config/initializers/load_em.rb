#require '../../lib/websocket_server.rb'
#
require 'em-websocket'
require 'json'

$debug_websockets = false

Thread.new {
  EM.run {
    puts "Setup EM Server"
    EventMachine::WebSocket.start(:host => "0.0.0.0", :port => 3001, :debug => $debug_websockets) do |ws|
      ws.onopen    { ws.send "Hello Client!"}
      ws.onmessage { |msg|
        json_msg = JSON.parse(msg)
        puts "Payload = #{json_msg['payload']}"

        $stream.send Base64.decode64(json_msg['payload'])
        ws.send "Ack: #{json_msg['sequenceNumber']}"
      }
      ws.onclose   { puts "WebSocket closed" }
      ws.onerror { |error|
        puts error
      }
    end
    puts "Done Setup EM Server"
  }
}