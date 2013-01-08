# Crypton

A zero-knowledge application framework

## Introduction

Crypton allows the creation of cryptographically secure web applications where the server is blind to the data being stored. This giving the user peace of mind that their data is their's alone to see.

## Client side

### Concepts

### Account

Each user has an account with an arbitrary amount of plaintext data.

````javascript
var handle = 'inputFromUser';
var passPhrase = 'moreInputFromUser';

crypton.generateAccount(handle, passPhrase, function (err, account) {
  if (err) {
    
    return;
  }

  account.save(function (err) {
    if (err) {
      
      return;
    }
  
  });
});
````

#### account#save(callback)

Send account to the server for storage

TODO rate limiting or some other form of not getting pwned?

### Session

A session is necessary for requesting and receiving data.

````javascript
crypton.authorize(handle, passPhrase, function (err, session) {
  if (err) {

    return;
  }

  
});
````

#### session.serialize(callback)
#### session.ping(callback)

### Container

### Object

### Inbox

### Group

## Server side

## License

?
