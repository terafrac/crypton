
var logstep = function logstep() {
    console.log("step");
}

var generate_cb = function generate_cb() {
    console.log("generate_cb start");
};

crypton_test_result.success = false;
try {
    crypton.generateAccount(crypton_test_config.username, 
                            crypton_test_config.passphrase, 
                            logstep, 
                            generate_cb, 
                            {});
    crypton_test_result.success = true;
} catch (err) {
    console.log("client error");
    //console.log(err);
} finally {
    console.log("client finally");
}

console.log("test.js end");
