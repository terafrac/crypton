# apparently the order of these files matters
SRC = src/core.js src/account.js src/session.js src/container.js \
	src/transaction.js src/peer.js src/message.js src/request.js src/diff.js \
	src/crypto/*.js src/rsa/*.js src/vendor/*.js

dist/crypton.min.js: dist/crypton.js
	uglifyjs dist/crypton.js > dist/crypton.min.js

dist/crypton.js: $(SRC)
	@mkdir -p dist
	cat $(SRC) > dist/crypton.js

test: test-unit

test-unit: node_modules dist/crypton.js
	@./node_modules/.bin/mocha-phantomjs test/index.html

node_modules:
	mkdir -p node_modules
	npm install mocha-phantomjs

clean:
	-rm -rf dist

.PHONY: test test-unit clean
