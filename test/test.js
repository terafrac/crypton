assert = require("assert");
should = require("should");
mocha = require("mocha");
util = require("util");

app = require("../server");

describe("app", function () {
    it("should have basic properties", function () {
        app.should.be.ok;
        app.config.should.be.a('object');
        app.datastore.should.be.a('object');
        app.id_translator.should.be.a('object');
        app.id_translator.public_id.should.be.a('function');
        app.id_translator.internal_id.should.be.a('function');
        app.listen.should.be.a('function');
    })
});

