REPORTER = dot

test:
	mocha

server:
	node test/server/server.js

show:
	open http://localhost:3000

.PHONY: test
