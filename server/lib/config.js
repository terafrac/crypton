'use strict';

var fs = require('fs');
var path = require('path');

var configFile;
if (process.configFile) {
  configFile = path.resolve(process.env.PWD, process.configFile);
} else if (process.env.NODE_ENV &&
           process.env.NODE_ENV.toLowerCase() === 'test') {
  configFile = __dirname + '/../config.test.json';
} else {
  configFile = __dirname + '/../config.json';
}

try {
  module.exports = JSON.parse(fs.readFileSync(configFile).toString());
} catch (e) {
  console.log('Could not parse config file:');
  console.log(e);
  process.exit(1);
}
