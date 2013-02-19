test: test-unit test-integration

test-unit: test-unit-server test-unit-client

test-unit-server:
	$(MAKE) -C server test

test-unit-client:
	$(MAKE) -C client test

test-integration:
	$(MAKE) -C integration_tests test

node_modules:
	npm install phantomjs node-phantom q should

clean:
	$(MAKE) -C client clean
	$(MAKE) -C integration_tests clean-test-db

setup-test-environment:
	$(MAKE) -C integration_tests setup-test-environment

.PHONY: test test-unit test-unit-server test-unit-client test-integration clean setup-test-environment
