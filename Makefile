REPORTER = dot
test:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/mocha -b --check-leaks --ui exports --require blanket --reporter $(REPORTER)

test-coveralls:
	$(MAKE) test
	-@INTEL_COVERAGE=1 $(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js
.PHONY: test
