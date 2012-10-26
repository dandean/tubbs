REPORTER = dot

test:
	mocha

debug:
	mocha debug

server:
	node test/server/server.js

show:
	open http://localhost:3000

.PHONY: test
