/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');
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
    'log': {
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
      }
    }
  }
};

