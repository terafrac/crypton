#!/bin/bash

set -e
set -x

BIN_DIR=$(cd $(dirname $0) ; readlink -f $(pwd))

# create crypton test database user if it doesn't exist
echo "select * from pg_user where usename ~ 'crypton';" \
    | sudo -u postgres psql template1 | grep 'crypton_test_user' || {
    sudo -u postgres psql template1 <<EOF
    create user crypton_test_user with encrypted password 'crypton_test_user_password';
EOF
}

# create a .pgpass file if not present
if [[ ! -e ~/.pgpass ]]; then
    touch ~/.pgpass
    chmod 600 ~/.pgpass
fi

# add entry to pgpass for test user to make it easy to use psql, etc.
grep crypton_test_user ~/.pgpass || {
    echo \
    "localhost:*:crypton_test:crypton_test_user:crypton_test_user_password" \
    >> ~/.pgpass
}

# replace the database if desired
if [[ ! -z "$REPLACE_EXISTING_DB" ]]; then
    echo "Dropping any exsiting crypton_test db"
    sudo -u postgres dropdb crypton_test || true
fi

# create crypton_test db if it doesn't exist
sudo -u postgres psql -l | grep crypton_test || {
    sudo -u postgres createdb -O crypton_test_user crypton_test
}

# add the schema if nothing is there
echo "select * from pg_tables" \
    | psql -h localhost -U crypton_test_user crypton_test \
    | grep "account" || {
        psql -h localhost -U crypton_test_user crypton_test < \
            $BIN_DIR/../lib/stores/postgres/setup.sql
      }


