test: test-unit

test-unit: node_modules
	@NODE_ENV=test ./node_modules/.bin/mocha

node_modules:
	npm install

.PHONY: test test-unit
