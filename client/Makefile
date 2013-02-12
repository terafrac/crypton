SRC = $(shell find src -type f -name "*.js")

dist/crypton.min.js: dist/crypton.js
	uglifyjs dist/crypton.js > dist/crypton.min.js

dist/crypton.js: $(SRC)
	@mkdir -p dist
	cat $(SRC) > dist/crypton.js

test: test-unit

test-unit: node_modules
	@./node_modules/.bin/mocha-phantomjs test/index.html

node_modules:
	mkdir -p node_modules
	npm install mocha-phantomjs

clean:
	-rm -rf dist

.PHONY: test test-unit clean
