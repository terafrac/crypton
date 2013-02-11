#!/bin/bash

has_md5() {
  for PROG in md5 md5sum; do
    if which $PROG >/dev/null 2>&1; then
       MD5=$PROG
       break
    fi
  done

  if [[ -z $MD5 ]]; then
    echo "No suitable MD5 program found; install one of md5 or md5sum"
    exit 1
  fi
}

has_uglify() {
  if ! which uglifyjs >/dev/null 2>&1; then
    echo "Uglify.js not found. Please install it (probably with npm install uglify-js)"
    exit 1
  fi
}

daemon() {
  chsum1=""

  while [[ true ]]
  do
    chsum2=`find src/ -type f -exec $MD5 {} \;`
    if [[ $chsum1 != $chsum2 ]] ; then           
      compile
      chsum1=`find src/ -type f -exec $MD5 {} \;`
      echo "Watching..."
    fi
    sleep 2
  done
}

compile() {
  echo "Compiling to crypton.js..."
  mkdir -p dist
  cat \
    src/core.js \
    src/account.js \
    src/session.js \
    src/container.js \
    src/transaction.js \
    src/peer.js \
    src/message.js \
    src/request.js \
    src/diff.js \
    src/crypto/*.js \
    src/rsa/*.js \
    > dist/crypton.js
  uglifyjs dist/crypton.js > dist/crypton.min.js
}

case $1 in
  --once)
    has_uglify
    compile
    ;;
  *)
    has_md5
    has_uglify
    daemon
    ;;
esac
