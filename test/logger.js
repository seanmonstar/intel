/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
const cp = require('child_process');
const path = require('path');
const util = require('util');

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

function spawn(exitOnError, done) {
  var exec = 'node ' + path.join(__dirname, 'util', 'error.js');
  if (exitOnError) {
    exec += ' --noexit';
  }
  cp.exec(exec, done);
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
    'getEffectiveLevel': {
      'should have an effective level': function() {
        var n = unique();
        var a = new Logger(n);
        a.setLevel('error');

        var n2 = n + '.' + unique();
        var b = new Logger(n2);

        assert.equal(b.getEffectiveLevel(), Logger.ERROR);
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

        a.debug('some foo %s baz', 'bar', function(err, record) {
          assert.ifError(err);
          assert.equal(record.message, 'some foo bar baz');
          done();
        });
      },
      'should return a promise': {
        'that resolves with a record': function(done) {
          var n = unique();
          var a = new Logger(n);
          a.addHandler(new intel.handlers.Null());
          a.propagate = false;

          a.debug('some foo %s baz', 'bar').then(function(record) {
            assert.equal(record.message, 'some foo bar baz');
          }).done(done);
        },
        'that rejects with an error': function(done) {
          var n = unique();
          var a = new Logger(n);
          var h = new intel.handlers.Null();
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
      'warning should alias warn': aliasLog('warning', 'warn'),
      'o_O should alias warn': aliasLog('o_O', 'warn'),
      'O_O should alias error': aliasLog('O_O', 'error')
    },

    'handleExceptions': {
      'should catch uncaughtErrors': function(done) {
        this.slow(300);

        spawn(false, function(err, stdout, stderr) {
          stderr = stderr.substring(0, stderr.indexOf('\n'));
          assert.equal(stderr, 'root.ERROR: [Error: catch me if you can]');
          assert(!stdout);
          done();
        });
      },
      'should not exit if exitOnError is false': function(done) {
        this.slow(300);

        spawn(true, function(err, stdout, stderr) {
          stderr = stderr.substring(0, stderr.indexOf('\n'));
          assert.equal(stderr, 'root.ERROR: [Error: catch me if you can]');
          assert.equal(stdout, 'root.INFO: noexit\n');
          done();
        });
      }
    }
  }
};

