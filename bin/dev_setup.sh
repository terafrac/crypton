#!/bin/bash

set -e
set -x

BIN_DIR=$(cd $(dirname $0) ; readlink -f $(pwd))
SRC_DIR=$(cd $BIN_DIR ; cd .. ; pwd)
CLIENT_SRC_DIR=$(cd $SRC_DIR/../crypton-client ; pwd)

if [[ ! -d $CLIENT_SRC_DIR ]]; then
    echo "Did not find crypton-client src in $CLIENT_SRC_DIR"
    exit 1
fi

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
if [[ "$REPLACE_EXISTING_DB" = "1" ]]; then
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

# add crypton-dev.local to /etc/hosts
grep crypton-dev.local /etc/hosts || {
    sudo bash -c 'echo -e "127.0.0.1\tcrypton-dev.local\n" >> /etc/hosts'
}

# compile client if it needs it
pushd $CLIENT_SRC_DIR
compile=0
for src_file in $(find src -type f)
do
    if [[ $src_file -nt dist/crypton.js ]]; then
        compile=1
        break
    fi
done
if [[ $compile = "1" ]]; then
    ./compile.sh --once
fi
popd

# symlink client source into our static dir
if [[ ! -d $SRC_DIR/public ]]; then mkdir -v $SRC_DIR/public ; fi
if [[ ! -L public/crypton.js ]]; then
    ln -vsf $CLIENT_SRC_DIR/dist/crypton.js $SRC_DIR/public/crypton.js
fi
ls -lh public/crypton.js

#client_src_target=$BIN_DIR/../client
#if [[ ! -d $CLIENT_SRC_DIR ]]; then
#    echo "$CLIENT_SRC_DIR does not exist"
#    exit 1
#fi
#rm -vrf $client_src_target
#if [[ ! -d $client_src_target ]]; then mkdir $client_src_target ; fi
#for f in $CLIENT_SRC_DIR/* ; do
#    if [[ ! -f $f ]]; then
#        continue
#    fi
#    f_basename="$(basename $f)"
#    f_target="$client_src_target/$f_basename"
#    if [[ ! -e $f_target || $f -nt $f_target ]]; then
#        if [[ -e $f_target ]]; then rm -v $f_target; fi
#        head $f | grep "^var crypton" || { 
#            echo -e "var crypton = {};\n" >> $f_target 
#        }
#        echo -e "var CryptoJS = require(\"cryptojs\");\n" >> $f_target 
#        cat $f >> $f_target
#        echo -e "\n\nmodule.exports = crypton;" >> $f_target
#    fi
#done

#client_core_file=$BIN_DIR/../../crypton-client/dist/crypton.js
#client_lib_file=$BIN_DIR/../lib/client.js
#if [[ ! -e $client_core_file ]]; then
#    echo "Could not find client core file"
#    exit 1
#fi
#if [[ ! -e $client_lib_file || $client_core_file -nt $client_lib_file ]]; then
#    cp -v $client_core_file $client_lib_file
#    echo -e "\n\nmodule.exports = crypton;" >> $client_lib_file
#fi
#
#
