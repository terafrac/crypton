util = require("util");
util.log("database tests");
should = require("should");

app = require("../server");
db = require("../lib/storage");

describe("basic database functionality", function () {
    it("make a connection", function (done) {
        db.connect(function (client) {
            done();        
        });
    });
    it("select the time", function (done) {
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
    it("find our tables", function (done) {
        db.list_tables(function (err, tables) {
            if (err) { return done(err); }
            //util.log(util.inspect(tables));
            tables.should.include("account");
            tables.should.include("container");
            tables.should.include("message");
            done();
        });
    });
    it("get a new ID number");
    it("receive events for all the rows in a long result as they stream");
});
