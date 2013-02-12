test: test-unit test-integration

test-unit: test-unit-server test-unit-client

test-unit-server:
	$(MAKE) -C server test

test-unit-client:
	$(MAKE) -C client test

test-integration:
	$(MAKE) -C integration_tests test

.PHONY: test test-unit test-unit-server test-unit-client test-integration
