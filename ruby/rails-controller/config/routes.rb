Rails.application.routes.draw do
  get 'twilio/start'
  post 'twilio/end'

  match 'websocket/receive', via: [:get, :post]

end
