var datastore = require('./');
var connect = datastore.connect;

exports.getContainerRecords = function (containerNameHmac, accountId, callback) {
  connect(function (client, done) {
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
      done();

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
