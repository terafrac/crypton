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

var connect = require('connect');
var express = require('express');
var util = require('./lib/util');

var app = process.app = module.exports = express();
app.config = require('./lib/config');
app.datastore = require('./lib/storage');
/*jslint camelcase: false*/
app.id_translator = require("id_translator")
    .load_id_translator(app.config.id_translator.key_file);
/*jslint camelcase: true*/

var allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods',
             'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers',
             'x-requested-with,content-type,session-identifier');
  next();
};

app.use(express.logger('dev'));
app.use(connect.cookieParser());
app.use(allowCrossDomain);
app.use(express.bodyParser());
app.use(connect.session({
  secret: util.readFileSync(
    // TODO: 'binary' encoding is deprecated
    app.config.cookieSecretFile, 'binary',
    app.config.defaultKeySize
  ),
  store: connect.MemoryStore,
  key: 'crypton.sid',
  cookie: {
    secure: false // TODO true when we add SSL
  }
}));

if (process.env.NODE_ENV === 'test') {
  app.use('/examples', express.static(__dirname + '/../client/examples'));
  app.use('/dist', express.static(__dirname + '/../client/dist'));
}


app.options('/*', function (req, res) {
  res.send('');
});

require('./routes');
