/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('insist');

const intel = require('../');
const consoleUtil = require('./util/console');
const dbugUtil = require('./util/debarg');

var spy = new intel.handlers.Null();
spy.emit = function(record) {
  this._lastRecord = record;
};

var __log = require('dbug').__log;
var prevLog = console.log;
var lastMock;
function mockLog() {
  lastMock = arguments;
}

function clearDebug() {
  Object.keys(require.cache).filter(function(key) {
    return key.indexOf('debug') !== -1;
  }).forEach(function(key) {
    delete require.cache[key];
  });
}

module.exports = {

  'console': {
    'before': function() {
      intel.addHandler(spy);
      intel.setLevel(intel.TRACE);
      console.log = mockLog;
    },
    'beforeEach': function() {
      delete spy._lastRecord;
      // not passing root means this file becomes root.
      // which means dirname.basename, or test.console
      intel.console();
    },
    'can inject into global scope': function() {
      console.warn('test');
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'test');
    },
    'can generate a name': function() {
      console.log('foo');
      assert.equal(spy._lastRecord.name, 'test.console');

      consoleUtil('bar');
      assert.equal(spy._lastRecord.name, 'test.util.console');
    },
    'can ignore paths': function() {
      intel.console({ ignore: 'test.util' });

      console.log('quux');
      assert.equal(spy._lastRecord.message, 'quux');

      consoleUtil('baz');
      assert.notEqual(spy._lastRecord.message, 'baz');
      assert.equal(lastMock[0], 'baz');

      intel.console();
    },
    'can specify a parent logger': function() {
      intel.console({ logger: 'foo.bar' });

      console.log('baz');
      assert.equal(spy._lastRecord.name, 'foo.bar.test.console');
    },
    'overrides console.dir()': function() {
      var obj = { foo: 'bar' };
      console.dir(obj);
      assert.equal(spy._lastRecord.message, "{ foo: 'bar' }");
    },
    'overrides console.trace()': function() {
      console.trace("foo");
      assert.equal(spy._lastRecord.message, "foo");
      assert(spy._lastRecord.stack);
    },
    'afterEach': function() {
      intel.console.restore();
    },
    'after': function() {
      intel.console.restore();
      assert.equal(console.log, mockLog);
      console.log = prevLog;
      intel._handlers = [];
    }
  },

  'console.debug': {
    'before': function() {
      intel.addHandler(spy);
    },
    'beforeEach': function() {
      delete spy._lastRecord;
    },
    'with true sets debug to star': function() {
      intel.console({ debug: true });
      assert.equal(process.env.DEBUG, '*');
    },
    'with string adds to DEBUG': function() {
      process.env.DEBUG = 'quux';
      intel.console({ debug: 'foo:bar,baz'});
      assert.equal(process.env.DEBUG, 'quux,foo:bar,baz');
    },
    'with string sets DEBUG if empty': function() {
      delete process.env.DEBUG;
      intel.console({ debug: 'foo:bar,baz'});
      assert.equal(process.env.DEBUG, 'foo:bar,baz');
    },
    'with false sets DEBUG to empty': function() {
      process.env.DEBUG = 'fooz';
      intel.console({ debug: false });
      assert(!process.env.DEBUG);
    },
    'intercepts dbug() messages': function() {
      intel.console({ debug: 'platoon' });

      var dbug = require('dbug')('platoon:sarge:squad');
      dbug('oscar mike');

      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'oscar mike');
      assert.equal(spy._lastRecord.name, 'test.console.platoon.sarge.squad');
      assert.equal(spy._lastRecord.level, intel.DEBUG);

      dbug.warn('boom');
      assert.equal(spy._lastRecord.message, 'boom');
      assert.equal(spy._lastRecord.level, intel.WARN);

    },
    'intercepts dbug() colorless messages': function() {
      intel.console({ debug: 'company' });

      var _dbug = require('dbug');
      _dbug.__log = __log;
      var dbug = _dbug('company:bravo');
      dbug.colored = false;
      dbug('oscar mike');

      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'oscar mike');
      assert.equal(spy._lastRecord.name, 'test.console.company.bravo');
      assert.equal(spy._lastRecord.level, intel.DEBUG);
    },
    'removes duplicate parts of dbug names': function() {
      intel.console({ debug: 'test' });

      dbugUtil('hut');
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.name, 'test.util.debarg');
    },
    'removes lib from name if matches': function() {
      intel.console({ debug: 'test' });

      var deboog = require('./util/lib/deboog');
      deboog('hat');
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.name, 'test.util.deboog');
    },
    'removes index from names': function() {
      intel.console({ debug: 'test' });

      var deboog = require('./util/lib/index.js');
      deboog('hat');
      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.name, 'test.util');
    },
    'intercepts debug() messages': function() {
      intel.console({ debug: 'recon' });
      clearDebug();

      var debug = require('debug')('recon');
      assert(debug.enabled);
      debug('report');

      assert(spy._lastRecord);
      assert.equal(spy._lastRecord.message, 'report +0ms');
      assert.equal(spy._lastRecord.name, 'test.console.recon');
      assert.equal(spy._lastRecord.level, intel.DEBUG);

    },
    'afterEach': function() {
      process.env.DEBUG_COLORS = "";
      intel.console.restore();
    },
    'after': function() {
      intel.setLevel(intel.DEBUG);
      console.log = prevLog;
      intel._handlers = [];
    }
  }

};
