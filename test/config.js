/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const os = require('os');
const path = require('path');
const util = require('util');

const assert = require('insist');

const intel = require('../');

const NOW = Date.now();
var counter = 1;
function tmp() {
  return path.join(os.tmpDir(),
      'intel-' + NOW + '-' + process.pid + '-' + (counter++));
}

function spy() {
  var args = [];
  var fn = function() {
    args.push(arguments);
  };
  fn.getCallCount = function() { return args.length; };
  fn.getLastArgs = function() { return args[args.length - 1]; };
  return fn;
}

function SpyHandler() {
  intel.Handler.apply(this, arguments);
  this.spy = spy();
}
util.inherits(SpyHandler, intel.Handler);
SpyHandler.prototype.emit = function spyEmit(record, callback) {
  this.spy(record, callback);
  callback();
};

var oldBasic;
var oldLevel;
module.exports = {
  'basicConfig': {
    'before': function() {
      oldBasic = intel.basicConfig;
      oldLevel = intel._level;
    },
    'root logger calls basicConfig': function(done) {
      var val;
      var stream = {
        write: function(out, cb) {
          val = out;
          cb();
        }
      };

      intel.basicConfig = function() {
        oldBasic({ stream: stream });
      };

      intel.info('danger').then(function() {
        assert.equal(val, 'root.INFO: danger\n');
        assert.equal(intel._level, oldLevel);
      }).done(done);

    },
    'only works once': function() {
      intel.basicConfig();
      assert.equal(intel._level, oldLevel);

      intel.basicConfig({ level: 'critical' });
      assert.equal(intel._handlers.length, 1);
      assert.equal(intel._level, oldLevel);
    },
    'works with file option': function() {
      var name = tmp();
      intel.basicConfig({ file: name });
      assert.equal(intel._handlers.length, 1);
      assert.equal(intel._handlers[0]._file, name);
    },
    'works with level': function() {
      intel.basicConfig({ level: 'error' });
      assert.equal(intel._level, intel.ERROR);
    },
    'works with format': function() {
      intel.basicConfig({ format: '%(foo)s'});
      assert.equal(intel._handlers[0]._formatter._format, '%(foo)s');
    },
    'afterEach': function() {
      intel.basicConfig = oldBasic;
      intel.setLevel(oldLevel);
      intel._handlers = [];
    }
  },
  'config': {
    'should be able to configure logging': function(done) {
      intel.config({
        formatters: {
          'basic': {
            'format': '%(message)s'
          },
          'foo': {
            'format': 'foo! %(levelname)s: %(message)s'
          },
          'fn': {
            'formatFn': function() {}
          }
        },
        filters: {
          'user': /\buser\b/g
        },
        handlers: {
          'null': {
            'class': SpyHandler,
            'formatter': 'foo',
            'filters': ['user']
          }
        },
        loggers: {
          'qqq.zzz': {
            'level': 'INFO',
            'propagate': false,
            'handlers': ['null']
          },
          'qqq.ww.zzz': {
            'level': 'INFO',
            'propagate': false,
            'handleExceptions': true,
            'exitOnError': false,
            'filters': ['user'],
            'handlers': ['null']
          }
        },
        console: true
      });
      intel.console.restore();

      var excepts = intel.getLogger('qqq.ww.zzz');
      assert(excepts._uncaughtException);
      assert(!excepts._exitOnError);
      assert.equal(excepts._filters.length, 1);
      excepts.unhandleExceptions();

      var log = intel.getLogger('qqq.zzz');
      var handler = log._handlers[0];
      assert.equal(log._handlers.length, 1);
      assert(!log.propagate);

      var msg = handler.format({ message: 'hi', levelname: 'BAR'});
      assert.equal(msg, 'foo! BAR: hi');

      log.debug('user').then(function() {
        assert.equal(handler.spy.getCallCount(), 0);

        return log.info('user foo');
      }).then(function() {
        assert.equal(handler.spy.getCallCount(), 1);
        assert.equal(handler.spy.getLastArgs()[0].message, 'user foo');

        return log.info('ignore me');
      }).then(function() {
        assert.equal(handler.spy.getCallCount(), 1);
      }).done(done);
    },
    'should be able to config with just JSON': function() {
      intel.config(require('./util/config.json'));

      var log = intel.getLogger('test.config.json');
      assert.equal(log._handlers.length, 2);

      var s = log._handlers[0]._filters[0];
      var r = log._handlers[0]._filters[1];
      var f = log._handlers[0]._filters[2];

      assert(s.filter({ name: 'foo.bar' }));
      assert(!s.filter({ name: 'food' }));

      assert(r.filter({ message: 'FOO' }));
      assert(!r.filter({ message: '' }));

      assert(f.filter({ args: [1, 2, 3] }));
      assert(!f.filter({ args: [1] }));

      var custom = log._handlers[0]._formatter;
      assert.equal(custom.format({ message: 'foo' }), 'FOO');
    },
    'should error if formatFn is not a function': function() {
      assert.throws(function() {
        intel.config({
          formatters: {
            'foo': {
              formatFn: 'this'
            }
          }
        });
      }, /function parameter did not parse as a function$/);
    },
    'should assign a NullHandler to ROOT if handlers object': function() {
      intel._handlers = [];
      intel.config({
        handlers: {},
        loggers: {
          'port': {},
        }
      });
      assert(intel._handlers[0] instanceof intel.handlers.Null);
    }
  }
};
