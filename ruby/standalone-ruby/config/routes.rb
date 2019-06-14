Rails.application.routes.draw do
  get 'twilio/start'
  post 'twilio/end'

end
