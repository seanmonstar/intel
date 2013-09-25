REPORTER = dots
test:
	echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@NODE_ENV=test ./node_modules/.bin/mocha -b --check-leaks --ui exports --reporter $(REPORTER)

test-coveralls:
	$(MAKE) test
	$(MAKE) test REPORTER=mocha-lcov-reporter | ./node_modules/coveralls/bin/coveralls.js --verbose
	rm -rf lib-cov

.PHONY: test
