REPORTER = dot

test:
	make test_node && make test_browser

test_node:
	./node_modules/.bin/mocha

test_browser:
	echo 'done'
	# open ./test/html/requirejs.html \
	#   && open ./test/html/script.html

.PHONY: test
