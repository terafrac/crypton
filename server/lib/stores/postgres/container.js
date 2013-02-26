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

var datastore = require('./');
var connect = datastore.connect;

exports.getContainerRecords = function (containerNameHmac, accountId, callback) {
  connect(function (client) {
    var query = {
      // TODO limit to to_account_id
      /*jslint multistr: true*/
      text: '\
        select * from readable_container_records_by_account \
          where container_id=( \
            select container_id from container where name_hmac=$1 \
          ) order by container_record_id',
       /*jslint multistr: false*/
      values: [
        containerNameHmac
      ]
    };

    client.query(query, function (err, result) {
      if (err) {
        callback(err);
        return;
      }

      // massage
      var records = [];
      result.rows.forEach(function (row) {
        Object.keys(row).forEach(function (key) {
          if (Buffer.isBuffer(row[key])) {
            row[key] = row[key].toString('hex');
          }
        });

        row = datastore.util.camelizeObject(row);
        records.push(row);
      });

      callback(null, records);
    });
  });
};
