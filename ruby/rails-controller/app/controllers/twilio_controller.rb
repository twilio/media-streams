# frozen_string_literal: true

require 'twilio-ruby'

class TwilioController < ApplicationController

  skip_before_action :verify_authenticity_token

  def start
    response = '<?xml version="1.0" encoding="UTF-8"?>'
    response += '<Response>'
    response += '<Start>'
    response += '<Stream url="' + TwilioAPI.web_socket + '"></Stream>'
    response += '</Start>'
    response += '<Pause length="40"/>'
    response += '</Response>'

    render xml: response
  end

  def end

    $stream.stop

    $stream.wait_until_complete!

    results = $stream.results

    text_to_translate = ""

    alternatives = results.first.alternatives
    alternatives.each do |result|
      puts ""
      puts "*******************************************************************"
      puts "  Transcript: #{result.transcript}  "
      puts "*******************************************************************"
      puts ""
      text_to_translate += result.transcript
    end

    $stream = $speech.streaming_recognize $streaming_config

    render plain: 'Success'
  end

end




