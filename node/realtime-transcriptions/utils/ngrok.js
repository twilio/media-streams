const ngrok = require('ngrok');

const connectAndGetTunnelUrl = port => {
  return new Promise(resolve => {
    const url = ngrok.connect(port);
    resolve(url);
  });
};

module.exports = { ngrok: { connectAndGetTunnelUrl } };
