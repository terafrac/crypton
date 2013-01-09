# Client

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
