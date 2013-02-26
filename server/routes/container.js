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

var app = process.app;
var db = app.datastore;
var middleware = require('../lib/middleware');
var verifySession = middleware.verifySession;

app.get('/container/:containerNameHmac', verifySession, function (req, res) {
  var containerNameHmac = req.params.containerNameHmac;
  var accountId = req.session.accountId;

  // TODO verify user has access to container
  /*
  db.getContainer(containerName, function (err, container) {
    db.getAccount(accountId, function () {
    });
  });
  */

  db.getContainerRecords(containerNameHmac, accountId, function (err, records) {
    if (err) {
      console.log(err);
      res.send({
        success: false,
        error: 'Database error'
      });
      return;
    }

    if (!records.length) {
      res.send({
        success: false,
        error: 'Container does not exist'
      });
      return;
    }

    res.send({
      success: true,
      records: records
    });
  });
});

app.post('/container/:containerNameHmac', verifySession, function (req, res) {
  res.send('');
});

app.get('/container/:containerNameHmac/:recordVersionIdentifier', verifySession, function (req, res) {
  var containerName = req.params.containerNameHmac;
  var versionIdentifier = req.params.recordVersionIdentifier;

  db.getContainerRecord(containerName, versionIdentifier, function (err, records) {
    if (err) {
      res.send({
        success: false,
        error: err
      });
      return;
    }

    res.send({
      success: true,
      records: records
    });
  });
});
