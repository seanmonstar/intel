/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter = require('events').EventEmitter;

const assert = require('insist');

const intel = require('../');
const Logger = intel.Logger;

var __counter = 1;
function unique() {
  return "u-" + __counter++;
}

function spy(cb) {
  var args = [];
  var fn = function() {
    args.push(arguments);
    if (cb) {
      return cb.apply(this, arguments);
    }
  };
  fn.getCallCount = function() { return args.length; };
  fn.getLastArgs = function() { return args[args.length - 1]; };
  return fn;
}

function aliasLog(alias, shouldCall) {
  return function() {
    var n = unique();
    var a = new Logger(n);
    a.propagte = false;
    var args;
    a[shouldCall] = function() {
      args = [].slice.call(arguments);
    };

    a[alias]('foo', 'bar');

    assert.equal(args[0], 'foo');
    assert.equal(args[1], 'bar');
  };
}

module.exports = {
  'Logger': {
    'constructor': {
      'should return the same instance for the same name': function() {
        var n = unique();
        var a = new Logger(n);
        var a2 = new Logger(n);

        assert.equal(a, a2);
      }
    },
    'removeHandler': function() {
      var n = unique();
      var a = new Logger(n);
      a.addHandler(new intel.handlers.Null());
      assert.equal(a._handlers.length, 1);
      a.removeHandler(a._handlers[0]);
      assert.equal(a._handlers.length, 0);
    },
    'removeAllHandlers': function() {
      var n = unique();
      var a = new Logger(n);
      a.addHandler(new intel.handlers.Null());
      a.addHandler(new intel.handlers.Null());
      assert.equal(a._handlers.length, 2);
      a.removeAllHandlers();
      assert.equal(a._handlers.length, 0);
    },
    'getEffectiveLevel': {
      'should have an effective level': function() {
        var n = unique();
        var a = new Logger(n);
        a.setLevel('error');

        var n2 = n + '.' + unique();
        var b = new Logger(n2);

        assert.equal(b.getEffectiveLevel(), Logger.ERROR);
      },
      'should change if parent changes': function() {
        var n = unique();
        var a = new Logger(n);
        a.setLevel('error');

        var n2 = n + '.' + unique();
        var b = new Logger(n2);
        assert.equal(b.getEffectiveLevel(), Logger.ERROR);

        a.setLevel('info');
        assert.equal(b.getEffectiveLevel(), Logger.INFO);
      }
    },
    'makeRecord': {
      'should make a record with a simple message': function() {
        var n = unique();
        var a = new Logger(n);
        var record = a.makeRecord(n, intel.DEBUG, "foo", ["foo"]);
        assert.equal(record.name, n);
        assert.equal(record.level, intel.DEBUG);
        assert.equal(record.levelname, 'DEBUG');
        assert.equal(record.message, 'foo');
        assert.equal(record.pid, process.pid);
        assert.equal(record.args.length, 1);
      },
      'should make a record without a string message': function() {
        var n = unique();
        var a = new Logger(n);
        var foo = { bar: 'baz' };
        var record = a.makeRecord(n, intel.DEBUG, foo, [foo, 'quux', true]);

        assert.equal(record.message, '{ bar: \'baz\' } quux true');
      }
    },
    'log': {
      'should output arguments': function() {
        var n = unique();
        var a = new Logger(n);
        a.propagate = false;

        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });

        a.info('foo', { bar: 'baz' }, null);

        assert.equal(spyA.getCallCount(), 1);
        assert.equal(spyA.getLastArgs()[0].message, "foo { bar: 'baz' } null");
      },
      'should be usable without alias': function() {
        var n = unique();
        var a = new Logger(n);
        a.propagate = false;

        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });
        a.addHandler({ handle: spy(), level: 0 });

        a.log('info', 'foo');

        assert.equal(spyA.getCallCount(), 1);
      },
      'should filter messages': function() {
        var n = unique();
        var a = new Logger(n);
        a.propagate = false;

        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });

        a.addFilter(new intel.Filter(/^foo/g));

        a.debug('bar');
        assert.equal(spyA.getCallCount(), 0);

        a.info('foobar');
        assert.equal(spyA.getCallCount(), 1);
      },
      'should propagate': function() {
        // C should propagate to B, but B should not propagate to A,
        // since we set propagate to false.
        var n = unique();
        var a = new Logger(n);
        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });

        var n2 = n + '.' + unique();
        var b = new Logger(n2);
        b.propagate = false;
        var spyB = spy();
        b.addHandler({ handle: spyB, level: 0 });

        var n3 = n2 + '.' + unique();
        var c = new Logger(n3);
        var spyC = spy();
        c.addHandler({ handle: spyC, level: 0 });


        c.debug('one');

        assert.equal(spyA.getCallCount(), 0);
        assert.equal(spyB.getCallCount(), 1);
        assert.equal(spyC.getCallCount(), 1);
      },
      'should trigger provided callback': function(done) {
        var n = unique();
        var a = new Logger(n);
        a.addHandler(new intel.handlers.Null());
        a.propagate = false;

        a.debug('some foo %s baz', 'bar', done);
      },
      'should return a promise': {
        'that resolves': function(done) {
          var n = unique();
          var a = new Logger(n);
          a.addHandler(new intel.handlers.Null());
          a.addHandler(new intel.handlers.Null());
          a.propagate = false;

          a.debug('some foo %s baz', 'bar').done(function() {
            done();
          }, done);
        },
        'that rejects with an error': function(done) {
          var n = unique();
          var a = new Logger(n);
          var h = new intel.Handler();
          h.emit = function(record, callback) {
            /*jshint unused:false*/
            throw new Error('foo');
          };

          a.addHandler(h);
          a.propagate = false;

          a.debug('some foo %s baz', 'bar').then(null, function(reason) {
            assert.equal(reason.message, 'foo');
          }).done(done);
        }
      },
      'should format stacktraces': function() {
        var a = new Logger(unique());
        a.propagate = false;
        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });

        var error = new Error('foo');
        a.error(error);
        var record = spyA.getLastArgs()[0];
        assert.equal(String(record.stack),
            error.stack.substr(error.stack.indexOf('\n')));
        var obj = JSON.parse(JSON.stringify(record.stack));
        assert(obj[0].fileName);
        assert.equal(record.exception, true);
      },
      'ALL should receive all levels': function() {
        var a = new Logger(unique());
        a.propagate = false;
        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });
        a.setLevel(Logger.ALL);

        a.log(0, 'hallo');
        var record = spyA.getLastArgs()[0];
        assert.equal(record.message, 'hallo');
      },
      'NONE should receive no levels': function() {
        var a = new Logger(unique());
        a.propagate = false;
        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });
        a.setLevel(Logger.NONE);

        a.error('poof');
        a.trace('nope');
        assert.equal(spyA.getCallCount(), 0);
        a.log(1000, 'hallo');
        assert.equal(spyA.getCallCount(), 0);
      },
      'warning should alias warn': aliasLog('warning', 'warn'),
      'o_O should alias warn': aliasLog('o_O', 'warn'),
      'O_O should alias error': aliasLog('O_O', 'error')
    },
    
    'trace': {
      'should include a stacktrace in message': function() {
        var a = new Logger(unique());
        a.propagate = false;
        a.setLevel(Logger.TRACE);
        var spyA = spy();
        a.addHandler({ handle: spyA, level: 0 });
        
        a.trace('intrusion');
        var record = spyA.getLastArgs()[0];
        assert.equal(record.level, Logger.TRACE);
        assert.equal(record.message, "intrusion");
        assert(record.stack);

        a.trace();
        var record = spyA.getLastArgs()[0];
        assert.equal(record.message, "Trace");
        assert(record.stack);
        
        a.trace('red %s', 'alert');
        var record = spyA.getLastArgs()[0];
        assert.equal(record.message, "red alert");
        assert(record.stack);
        
        a.trace({ a: 'b' });
        var record = spyA.getLastArgs()[0];
        assert.equal(record.message, "Trace { a: 'b' }");
        assert(record.stack);
      }
    },

    'handleExceptions': {
      'should catch uncaughtErrors': function(done) {
        var logger = new Logger(unique());
        var p = logger._process = new EventEmitter();
        p.exit = spy();

        var handlerSpy = spy();
        logger.addHandler({ handle: handlerSpy, level: 0 });
        logger.propagate = false;

        logger.handleExceptions();
        p.emit('uncaughtException', new Error("catch me if you can"));

        setTimeout(function() {
          assert.equal(handlerSpy.getCallCount(), 1);
          var record = handlerSpy.getLastArgs()[0];
          assert.equal(record.level, Logger.CRITICAL);
          assert.equal(record.message, '[Error: catch me if you can]');
          assert.equal(record.uncaughtException, true);
          assert.equal(p.exit.getCallCount(), 1);
          done();
        }, 10);
      },
      'should not exit if exitOnError is false': function(done) {
        var logger = new Logger(unique());
        var p = logger._process = new EventEmitter();
        p.exit = spy();

        var handlerSpy = spy();
        logger.addHandler({ handle: handlerSpy, level: 0 });
        logger.propagate = false;

        logger.handleExceptions(false);
        p.emit('uncaughtException', new Error("catch me if you can"));

        setTimeout(function() {
          assert.equal(p.exit.getCallCount(), 0);
          done();
        }, 10);
      }
    },
    'unhandleExceptions': {
      'should remove exception listener': function() {
        var logger = new Logger(unique());
        var p = logger._process = new EventEmitter();
        p.exit = spy();

        var handlerSpy = spy();
        logger.addHandler({ handle: handlerSpy, level: 0 });
        logger.propagate = false;

        logger.handleExceptions();
        logger.unhandleExceptions();
        p.emit('uncaughtException', new Error("catch me if you can"));

        assert.equal(handlerSpy.getCallCount(), 0);
      }
    }
  }
};

