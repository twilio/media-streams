require 'googleauth'


GOOGLE_SERVICE_ACCOUNT_CREDENTIALS =
    Google::Auth::ServiceAccountCredentials.make_creds(
        json_key_io: File.open('lib/google/google_application_credentials.json')
    )

ENV['GOOGLE_APPLICATION_CREDENTIALS'] = 'lib/google/google_application_credentials.json'


$speech = Google::Cloud::Speech.new

$streaming_config = {config: {encoding:                :MULAW,
                              sample_rate_hertz:       8000,
                              language_code:           "en-US",
                              enable_word_time_offsets: true     },
                     interim_results: true}

$stream = $speech.streaming_recognize $streaming_config