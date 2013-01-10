# Client

## Global

### crypton.host and crypton.port

Defaults to `localhost:2013`. You should override these before any other calls are made. Note that cross-domain requests may be enabled in the server configuration.

### crypton.on(eventName, callback)

### crypton.generateAcount(username, passphrase, callback)

_crypto_

Creates an account object and generates the appropriate salts and keys. 

Checks with the server to validate the username, and calls back with a potentially empty `error` argument and a conditional `account` argument which must still be `save()`d.

### crypton.authorize(username, passphrase, callback)

_crypto_

Performs the necessary handshakes with the server, and calls back with a potentiall empty `error` object and a conditional `session` argument.

### crypton.resurrect(sessionString, callback)

Reconstructs a serialized session and pings the server to check its validity.

## Sessions

### session.serialize(callback)

Stringifies said session object for later use, and calls back with a potentially empty `error` argument and a conditional `session` string argument.

### session.ping(callback)

Hits the appropriate route on the server to check for the validity of said session. Calls back with a potentially empty `error` argument. If the argument is empty, the session is still valid.

### session.load(containerName, callback)

_crypto_

Checks for a cached `container` that is available to said session. If the `container` is not cached or a more current version is available, the latest version is retreived from the server and cached.

### session.create(containerName, callback)

_crypto_

Attempts to create a container, checking with the server to see if the namespace is available for the current session. Calls back with a potentially empty `error` argument.

Container names are encrypted and their plaintext is unknown to the server.

## Accounts

### session.account

An object containing a representation of the account associated with said session.

Example structure:

````javascript
{
  username: String,
  passphrase: String,
  keys: { },
  save: Function,
  refresh: Function,
  version: Function
}
````

### session.account.save(callback)

_crypto_
_diff_

Determines the differences between the previous version of the account of said session and saves it with the server. Calls back with a potentially empty `error` argument.

### session.account.refresh(callback)

_crypto?_

Checks with the server for new account versions from other devices. Calls back with a potentially empty `error` argument. If the argument is empty, the account has been updated.

### session.account.version

Holds the current version hash of the session.

## Containers

### container.get(objectName, callback)

_crypto_
_undiff_

### container.save(callback)

_crypto_
_diff_

Determines the differences with the previously saved version of the container. Calls back with a potentially empty `error` argument. If the argument is empty, the container has been committed to the server.

### container.add(key, value)

Adds a magic key to said container.

### container.version

Holds the current version hash of the container.

# Server

The server is a simple REST server running on node. The default all bodies are sent and received with JSON. The default success response is:

````javascript
{
  success: true
}
````

## Account

### POST /account

Creates a new account with client-generated data.

Required body:

````javascript
{

}
````

Sets session_identifier cookie (logs you in immediately) upon successful request.

### POST /account/:username

Logs into account and sets `session_identifier` cookie.

Required body:

````javascript
{

}
````

### POST /account/:username/password

Changes the password for an account.

Required body:

````javascript
{
  password: String
}
````

## Session

### GET /session

Pings the server to verify that the session is still valid. Must send `session_identifier` cookie.

If the session is invalid when an authentication-requiring route is requested, the default response will be:

````javascript
{
  success: false,
  error: "Not logged in"
}
````

## Transaction

### POST /transaction

Generates and sets `transaction_token` cookie.

Requires `session_identifier` cookie.

### POST /transaction/:token/commit

Commit (finalize) the transaction.

Requires `session_identifier` cookie.

May return the following:

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

### DELETE /transaction/:token

Cancel a transaction without committing it to the server.

Requires `session_identifier` cookie.

May return the following:

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

## Container

### GET /container/:container_name_ciphertext

Returns all headers of the records in the container.

Requires `session_identifier` cookie.

Optional parameter `?after=record_version_identifier` will only return the headers for records occuring after said `record_version_identifier`

Example:

````javascript
{

}
````

### POST /container/:container_name_ciphertext

`multipart/form-upload` of json + payload for this modification
// TODO fail early if the transaction is borked

Requires `session_identifier` cookie.

A valid transaction token is required or the route will return the following:

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

### GET /container/:container_name_ciphertext/:record_version_identifier

Returns binary data of the ciphertext from the given `record_version_identifier` of the enciphered `container_name`.

Requires `session_identifier` cookie.

## Messages

### GET /inbox

Returns list of message headers as JSON objects.

Requires `session_identifier` cookie.

Optional parameters of `from=username` and `since=timestamp` may be used to filter.

Example response:

````javascript
{

}
````

### GET /inbox/:message_identifier

Returns headers and ciphtertext of payload of message with matching `message_identifier`

Requires `session_identifier` cookie.

Example response:

````javascript
{

}
````

### DELETE /inbox/:message_identifier

Deletes a given message by `message_identifier`

Requires `session_identifier` cookie.

May return the following:

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

### POST /outbox

Send a message by `multipart/form-upload` of json + payload
// TODO fail early if the transaction is borked

Requires `session_identifier` cookie.

Example post data:

````javascript
// TODO decide on format
````

Requires session_identifier cookie.

May return the following:

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````
