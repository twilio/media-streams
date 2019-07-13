const pug = require('pug');
const fs = require('fs');

const compileFunc = location => {
  return new Promise(resolve => {
    resolve(pug.compileFile(location));
  });
};

const xmlToFile = (xmlPath, data) => {
  const overwrite = { flags: 'w' };

  const writeStream = fs.createWriteStream(xmlPath, overwrite);

  writeStream.write(data, function(err) {
    if (err) {
      console.log(err);
    }
  });
  writeStream.on('finish', function() {
    console.log('Writing finished');
  });
};

module.exports = { compileFunc, xmlToFile };
