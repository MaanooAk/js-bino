

default: test-all

test-all:
	cat js-bino.js dev/debug*.js dev/test*.js | node

test:
	cat js-bino.js dev/debug.js dev/test.js | node
