#!/bin/bash

daemon() {
  chsum1=""

  while [[ true ]]
  do
    chsum2=`find src/ -type f -exec md5 {} \;`
    if [[ $chsum1 != $chsum2 ]] ; then           
      compile
      chsum1=`find src/ -type f -exec md5 {} \;`
      echo "Watching..."
    fi
    sleep 2
  done
}

compile() {
  echo "Compiling to crypton.js..."
  `mkdir -p dist`
  `cat \
    src/core.js \
    src/account.js \
    src/session.js \
    src/container.js \
    src/transaction.js \
    src/peer.js \
    src/message.js \
    src/crypto/*.js \
    src/rsa/*.js \
    > dist/crypton.js`
  `uglifyjs dist/crypton.js > dist/crypton.min.js`
}

daemon
