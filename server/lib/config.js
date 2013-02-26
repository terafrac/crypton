/* Crypton Server, Copyright 2013 SpiderOak, Inc.
 *
 * This file is part of Crypton Server.
 *
 * Crypton Server is free software: you can redistribute it and/or modify it
 * under the terms of the Affero GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * Crypton Server is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE.  See the Affero GNU General Public
 * License for more details.
 *
 * You should have received a copy of the Affero GNU General Public License
 * along with Crypton Server.  If not, see <http://www.gnu.org/licenses/>.
*/

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
