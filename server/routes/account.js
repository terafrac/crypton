"use strict";

var app = process.app;
var db = app.datastore;
var crypto = require('crypto');
var uuid = require('node-uuid');
var util = require("util");

/*
 * Save account to server
 * Check if username is taken
 * Create session cookie
 */
app.post('/account', function (req, res) {
    // TODO sanitize
    var body = req.body;

    db.isUsernameTaken(req.body.username, function (taken) {
        if (taken) {
            util.log("dupe username " + req.body.username);
            res.send({
                success: false,
                error: 'Username taken'
            });
            return;
        }

        db.saveUser(body, function (err) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                });
                return;
            }

            // TODO set session cookie here
            res.send({
                success: true
            });
        });
    });
});

/*
* Authorize with server
*/
app.post('/account/:username', function (req, res) {
    db.getUser(req.params.username, function (err, user) {
        if (err) {
            res.send({
                success: false,
                error: err
            });
            return;
        }

        // create a challenge
        var randomString = crypto.randomBytes(32);
        var aesIv = new Buffer(crypto.createHash('sha256').update(uuid.v1()).digest().substr(0, 16), 'ascii');
        var challengeCipher = crypto.createCipheriv('aes-256-cfb', new Buffer(user.challengeKey, 'hex'), aesIv);
        var challenge = challengeCipher.update(randomString);
        var time = +new Date() + ''; // must be cast to string for cipher

        // compute the expected answer to the challenge
        var answerCipher = crypto.createCipheriv('aes-256-cfb8', randomString, aesIv);
        var expectedAnswer = answerCipher.update(time);
        var expectedAnswerDigest = crypto.createHash('sha256').update(expectedAnswer).digest();
        var expectedAnswerDigestHex = new Buffer(expectedAnswerDigest, 'binary').toString('hex');

        // XXX why 'aes-256-cfb' for challengeCipher
        // but 'aes-256-cfb8' for answerCipher?

        // store it
        db.saveChallenge(user, expectedAnswerDigestHex, function (err, challengeId) {
            if (err) {
                res.send({
                    success: false,
                    error: err
                });
                return;
            }

            res.send({
                success: true,
                challengeId: challengeId, // TODO public_id(challengeId)
                challenge: new Buffer(challenge, 'binary').toString('hex'),
                saltChallenge: user.saltChallenge,
                iv: aesIv.toString('hex'),
                time: time
            });
        });
    });
});

/*
* Authorize with server
*/
app.post('/account/:username/answer', function (req, res) {
    var challengeId = req.body.challengeId;
    var answer = req.body.answer;

    if (!challengeId || !answer) {
        res.send({
            success: false,
            error: 'Missing required fields'
        });
        return;  
    }

    db.getChallenge(challengeId, function (err, challenge) {
        if (err) {
            res.send({
                success: false,
                error: err
            });
            return;  
        }

        console.log(challenge.expectedAnswerDigest, answer,
                    challenge.expectedAnswerDigest === answer);

        res.send({
            success: true
        });
    });
});

/*
* Change the password for account
*/
app.post('/account/:username/password', function (req, res) {
});
