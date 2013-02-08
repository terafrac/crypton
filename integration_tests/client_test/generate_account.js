(function () {

    var logstep = function logstep() {
        console.log("step");
    };

    var signal_complete = function signal_complete() {
        console.log("signal_complete start");
        var request = window.superagent;
        try {
            request.get("/client_test/COMPLETE").end(function (res) {
                console.log("request for COMPLETE complete");
                crypton_test_result.complete = 'finished';
            });
        } catch (err) {
            console.log("signal_complete request error");
            console.log(err);
        }
        console.log("request for COMPLETE starting");
        crypton_test_result.complete = 'starting';
    };

    var complete_cb = function complete_cb(err, account) {
        console.log("complete_cb start");

        if (err) { 
            crypton_test_result.success = false;
            console.log("error given to complete_cb");
            console.log(err); 
        } else {
            crypton_test_result.success = true;
        }
        signal_complete();
    };

    try {
        crypton_test_result.success = null;
        crypton.generateAccount(crypton_test_config.username, 
                                crypton_test_config.passphrase, 
                                logstep, 
                                complete_cb, 
                                {});
    } catch (err) {
        console.log("client error");
        //console.log(err);
    } finally {
        console.log("client finally");
    }

}());

console.log("test.js end");
