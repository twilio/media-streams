class WebsocketController < ApplicationController
  include Tubesock::Hijack
  skip_before_action :verify_authenticity_token


  def receive
    puts "params = #{params.inspect}"
    hijack do |tubesock|
      tubesock.onopen do
        tubesock.send_data "Hello, friend"
      end

      tubesock.onmessage do |data|
        json_msg = JSON.parse(data)
        puts "Payload = #{json_msg['payload']}"

        $stream.send Base64.decode64(json_msg['payload'])
        tubesock.send_data "Ack: #{json_msg['sequenceNumber']}"
      end
    end
  end

end
