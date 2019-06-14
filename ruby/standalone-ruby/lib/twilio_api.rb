# frozen_string_literal: true

require 'twilio-ruby'

class TwilioAPI

  def self.get_client
    Twilio::REST::Client.new(sid, token)
  end

  def self.sid
    Rails.application.secrets.twilio_account_sid
  end

  def self.token
    Rails.application.secrets.twilio_auth_token
  end

  def self.web_socket
    Rails.application.secrets.websocket_url
  end

end