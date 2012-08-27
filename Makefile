REPORTER = dot

test:
	make test_node

test_node:
	./node_modules/.bin/mocha

.PHONY: test
