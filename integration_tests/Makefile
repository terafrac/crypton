test: test-integration

test-integration: ../node_modules node_modules setup-test-environment crypton-client
	@NODE_ENV=test ./node_modules/.bin/mocha

node_modules:
	$(MAKE) -C ../server node_modules
	ln -s ../server/node_modules node_modules

../node_modules:
	$(MAKE) -C .. node_modules

setup-test-environment:
	./bin/setup_test_environment.sh

clean-test-db:
	-sudo -u postgres dropdb crypton_test

crypton-client:
	$(MAKE) -C ../client

.PHONY: test test-integration setup-test-environment clean-test-db crypton-client
