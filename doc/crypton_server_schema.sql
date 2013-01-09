create sequence version_identifier;
create table account (
    account_id int8 not null default nextval('version_identifier'),
    creation_time timestamp not null default current_timestamp,
    username text,
    key_data bytea,
    challenge_data bytea,
    deletion_time timestamp
);
create table container (
    container_id int8 not null default nextval('version_identifier'),
    account_id int8 not null references account,
    name_ciphertext bytea not null unique,
    creation_time timestamp not null default current_timestamp,
    modified_time timestamp not null default current_timestamp,
    latest_record_id int8 not null references container_record,
    deletion_time timestamp
);

/* how does latest_record_id work for transactions that create multiple records? */

create table container_record (
    record_id int8 not null default nextval('version_identifier'),
    account_id int8 not null references account,
    container_id int8 not null references container,
    creation_time timestamp not null default current_timestamp,
    header bytea not null,
    payload bytea not null,
    check length(header) >= 64 /* TODO figure out min header size */
);

/*
Header is a json object and describes:
    record_format_version=1
    payload_size=N (length of ciphertext, multiple of AES segment width (16 bytes))
    aes_iv=...
    aes_key_id=uuid
    hmac=hmac(ciphertext)
    optional:
        container_version_identifier=identifier of container at the point
            this record is created
    added by server:
        record_version_identifier (the encrypted form of
            container_record.record_id on the server, so you can easily retrieve
            the payload.)
Payload is ciphertext.
    Record type specific enciphered content using above AES key and IV.

types of records:
    set-keys one or more of:
        generate AES256 key (32 bytes of random data)
        make a uuid for the key (to include in future header records encrypted
            w/ this key)
        for each account who should be able to read the container (including self):
            AES256 key enciphered to:
                the public key for the account
                signed by the private key of the author
    change-data:
        one or more of:
            add new top level object
                record for set('my key', {})
            delete top level object
                record for remove('my key')
            modify top level object
                // update by json text diff
                record for update({
                    path = 'diary',
                    method = "json_text_diff",
                    diff_text = ...
                })

                // discarded ideas:
                    // update a deep property
                    container.update('diary', {
                        path: "drafts.january",
                        method: "replace",
                        data: [{ title: "this was fun..." }])
                    // get rid of deep property (january)
                    container.update('diary', {
                        path: "drafts.january",
                        method: "remove" })


Client / Server Communication:
    Creating An Account
    Authentication to Account
    Posting a Transaction
    Retrieving Data
    POST /account (to create new account)
        sets session_identifier cookie (logs you in immediately)
    POST /account/:username (to auth into an account)
        sets session_identifier cookie
    POST /account/:username/password (to change the password for an account)
    GET /session (ping to server to verify that the session is still valid).
        returns { success: true } or { success: false, error: "you suck" }
    POST /transaction
        set transaction_token cookie
    POST /transaction/:token/commit
        commit the transaction, returns { success: true } or { success: false, error: "you suck" }
    DELETE /transaction/:token
        rollback the transaction
    GET /container/:container_name_ciphertext
        all the headers of the records in the container
    GET /container/:container_name_ciphertext?after=:record_version_identifier
        all the headers of the records in the container since some version identifier
    POST /container/:container_name_ciphertext
        (fails if there is no transaction_token cookie set)
        multipart/form-upload of json + payload for this modification // TODO fail early if the transaction is borked
    GET /container/:container_name_ciphertext/:record_version_identifier
        returns binary data of the ciphertext from the container's record.
    GET /inbox
        returns list of message headers as json objects
    GET /inbox?from=:username , since=:time , ....
        filter list of message headers as json objects by various things
    GET /inbox/:message_identifier
        returns ciphtertext of payload of the message
    DELETE /inbox/:message_identifier
        (fails if there is no transaction_token cookie set)
        returns ciphtertext of payload of the message
    POST /outbox
        (fails if there is no transaction_token cookie set)
        multipart/form-upload of json + payload for this message // TODO fail early if the transaction is borked


*/

create table container_acl (
    acl_id int8 not null default nextval('version_identifier'),
    account_id int8 not null references account,
    container_id int8 not null references container,
    creation_time timestamp not null default current_timestamp,
    record_ids int8[],
    revoking_account_id references account (account_id),
    revoke_time timestamp,
);
create table message (
    message_id int8 not null default nextval('version_identifier'),
    creation_time timestamp not null default current_timestamp,
    end_time timestamp,
    from_account_id int8 not null references account (account_id),
    to_account_id int8 not null references account (account_id),
    header bytea not null,
    payload bytea not null,
    deletion_time timestamp
    check (length(headers) < 4096)
);


create table "group" (
);
