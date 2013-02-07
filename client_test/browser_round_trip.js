(function () {
    var signal_complete = function signal_complete() {
        console.log("signal_complete start");
        var request = window.superagent;
        // console.log("request is");
        // console.log(request);
        console.log("signal_complete start 1");
        try {
            request.get("/client_test/COMPLETE").end(function (res) {
                console.log("request for COMPLETE complete");
                crypton_test_result.success = true;
                crypton_test_result.complete = 'finished';
            });
        } catch (err) {
            console.log("signal_complete request error");
            console.log(err);
        }
        console.log("requset for COMPLETE starting");
        crypton_test_result.complete = 'starting';
    };
    window.setTimeout(signal_complete, 100);
    crypton_test_result.success = null;
    crypton_test_result.complete = 'scheduled';
    console.log("test.js signal_complete scheduled");
}());

console.log("test.js end");
