#!/bin/bash

set -e
set -x

CLIENT_SRC_DIR="../client"
SERVER_SRC_DIR="../server"

# create crypton test database user if it doesn't exist
echo "select * from pg_user where usename = 'crypton_test_user';" \
    | sudo -u postgres psql template1 | grep -q crypton_test_user || {
    sudo -u postgres psql template1 <<EOF
create user crypton_test_user with encrypted password 'crypton_test_user_password';
EOF
}

# create a .pgpass file if not present
[ -e ~/.pgpass ] || {
    touch ~/.pgpass
    chmod 600 ~/.pgpass
}

# add entry to pgpass for test user to make it easy to use psql, etc.
grep -q crypton_test_user ~/.pgpass || {
    cat >> ~/.pgpass <<EOF
localhost:*:crypton_test:crypton_test_user:crypton_test_user_password
EOF
}

# create crypton_test db if it doesn't exist
sudo -u postgres psql -l | grep -q crypton_test || {
    sudo -u postgres createdb -O crypton_test_user crypton_test
}

# add the schema if nothing is there
echo "select * from pg_tables" \
    | psql -h localhost -U crypton_test_user crypton_test \
    | grep -q account || {
        psql -h localhost -U crypton_test_user crypton_test < \
            $SERVER_SRC_DIR/lib/stores/postgres/setup.sql
      }

# add crypton-dev.local to /etc/hosts
grep -q crypton-dev.local /etc/hosts || {
    sudo bash -c 'echo -e "127.0.0.1\tcrypton-dev.local\n" >> /etc/hosts'
}
