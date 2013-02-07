var fs = require('fs');
var path = require('path');

module.exports = function (filename) {
  if (!filename) {
    filename = __dirname + '/../config.json';
  } else {
    filename = path.resolve(process.env.PWD, filename);
  }


  try {
    var config = fs.readFileSync(filename);
    config = JSON.parse(config.toString());
  } catch (e) {
    console.log('Could not parse config file:');
    console.log(e);
    process.exit(1);
  }

  return config;
};
