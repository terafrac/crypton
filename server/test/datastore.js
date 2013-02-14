"use strict";
/*jslint expr: true*/

require('should');
var util = require("util");
util.log("database tests");

var db = require("../lib/storage");

describe("datastore", function () {

  it("makes a connection", function (done) {
    db.connect(function () {
      done();
    });
  });

  it("selects the time", function (done) {
    db.connect(function (client) {
      client.query("select current_timestamp", function (err, result) {
        if (err) { return done(err); }

        // util.log(util.inspect(result));
        var time = result.rows[0].now;
        time.should.be.ok;
        // util.log("time is " + result.rows[0].now );
        done();
      });
    });
  });

  it("finds our tables", function (done) {
    db.listTables(function (err, tables) {
      if (err) { return done(err); }
      //util.log(util.inspect(tables));
      tables.should.include("account");
      tables.should.include("container");
      tables.should.include("message");
      done();
    });
  });

  it("gets a new ID number", function (done) {
    db.connect(function (client) {
      client.query(
        "select nextval('version_identifier')",
        function (err, result) {
          if (err) { return done(err); }
          var idNum = result.rows[0].nextval;
          idNum.should.be.ok;
          done();
        }
      );
    });
  });

  it("receives events for all rows as they stream", function (done) {
    db.connect(function (client) {
      var query = client.query("select * from generate_series(1, 100)");
      var rows = [];
      query.on('row', function (row) { rows.push(row); });
      query.on('error', function (err) { done(err); });
      query.on('end', function () {
        rows.should.have.length(100);
        /*jslint camelcase: false*/
        rows[0].generate_series.should.equal(1);
        /*jslint camelcase: true*/
        done();
      });
    });
  });
});
