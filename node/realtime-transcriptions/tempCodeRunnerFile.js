const pugUtils = require('./utils');

const path = require('path');

const options = {
  url: 'http://mario.mui.me',
};
const filePath = path.resolve(__dirname, './templates/streamshb.pug');
pugUtils.compileFunc(filePath).then(pugToXMLFunc => {
  const xmlPath = path.resolve(__dirname, './templates/streams.xml');
  pugUtils.xmlToFile(xmlPath, pugToXMLFunc(options));
});
