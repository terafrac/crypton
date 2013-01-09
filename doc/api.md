# Client

# Server

## POST /account

Creates a new account with client-generated data.

Required body:

````javascript
{

}
````

Sets session_identifier cookie (logs you in immediately) upon successful request.

## POST /account/:username

Logs into account and sets session_identifier cookie.

Required body:

````javascript
{

}
````

## POST /account/:username/password

Changes the password for an account.

Required body:

````javascript
{
  password: String
}
````

## GET /session

(ping to server to verify that the session is still valid).
Pings the server to verify that the session is still valid. Must send session_identifier cookie.

Returns either

````javascript
{
  success: true
}
````

or

````javascript
{
  success: false,
  error: "error message"
}
````

## POST /transaction

Generates and sets transaction_token cookie.

Requires session_identifier cookie.

````javascript
{
  success: true
}
````

or

````javascript
{
  success: false,
  error: "Not logged in"
}
````

## POST /transaction/:token/commit

Commit (finalize) the transaction.

Requires session_identifier cookie.

Returns one of the following:

````javascript
{
  success: true
}
````

or

````javascript
{
  success: false,
  error: "Not logged in"
}
````

or

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

## DELETE /transaction/:token

Cancel a transaction without committing it to the server.

Requires session_identifier cookie.

Returns one of the following:

````javascript
{
  success: true
}
````

or

````javascript
{
  success: false,
  error: "Not logged in"
}
````

or

````javascript
{
  success: false,
  error: "Transaction token invalid"
}
````

## GET /container/:container_name_ciphertext

all the headers of the records in the container

## GET /container/:container_name_ciphertext?after=:record_version_identifier
all the headers of the records in the container since some version identifier

## POST /container/:container_name_ciphertext
(fails if there is no transaction_token cookie set)
multipart/form-upload of json + payload for this modification // TODO fail early if the transaction is borked

## GET /container/:container_name_ciphertext/:record_version_identifier
returns binary data of the ciphertext from the container's record.

## GET /inbox
returns list of message headers as json objects

## GET /inbox?from=:username , since=:time , ....
filter list of message headers as json objects by various things

## GET /inbox/:message_identifier
returns ciphtertext of payload of the message

## DELETE /inbox/:message_identifier
(fails if there is no transaction_token cookie set)
returns ciphtertext of payload of the message

## POST /outbox
(fails if there is no transaction_token cookie set)
multipart/form-upload of json + payload for this message // TODO fail early if the transaction is borked

