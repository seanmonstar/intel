/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const printf = require('../lib/utils/printf');

module.exports = {
  'printf': {
    'should format named args': function() {
      assert.equal(printf('%-3(foo)s:%3(bar)s', { foo: 'a', bar: 'b' }),
        'a  :  b');
    },
    'should print args': function() {
      assert.equal(printf('%s,%s,%d', 'a', 2, 3), 'a,2,3');
      assert.equal(printf('%%s', 'a'), '%s a');
      assert.equal(printf('%Z', 'a'), '%Z a');
    },
    'should print %O': function() {
      assert.equal(printf('%O', { foo: 'bar' }), '{"foo":"bar"}');
    },
    'should alias %j to %O': function() {
      assert.equal(printf('%j', { foo: 'bar' }), '{"foo":"bar"}');
    },
    'should allow pretty printing JSON': function() {
      var obj = { foo: 'bar' };
      assert.equal(printf('%:4j', obj), JSON.stringify(obj, null, 4));
    },
    'should print default with %?': function() {
      assert.equal(
        printf('%?: %? %?', 'foo', new Error('bar'), { a: 'b'}),
        'foo: Error: bar {"a":"b"}'
      );
    },
    'should pad if value less then padding': function() {
      assert.equal(printf('%5s', 'abc'), '  abc');
      assert.equal(printf('%-5s', 'abc'), 'abc  ');
      assert.equal(printf('%5s', 123), '  123');
      assert.equal(printf('%-5s', 123), '123  ');
    },
    'should not pad if value more or equal padding': function() {
      assert.equal(printf('%3s', 'abc'), 'abc');
      assert.equal(printf('%-3s', 'abc'), 'abc');
    },
    'should not truncate if value more or equal trunc value': function() {
      assert.equal(printf('%.3s', 'abc'), 'abc');
      assert.equal(printf('%.-3s', 'abc'), 'abc');
    },
    'should truncate if value less then trunc value': function() {
      assert.equal(printf('%.2s', 'abc'), 'bc');
      assert.equal(printf('%.-2s', 'abc'), 'ab');
      assert.equal(printf('%.2s', 123), '23');
      assert.equal(printf('%.-2s', 123), '12');
    },
    'should first truncate and them pad': function() {
      assert.equal(printf('%5.2s', 'abc'), '   bc');
    },
    'should default print extra args without placeholders': function() {
      assert.equal(printf('foo', 'bar'), 'foo bar');
      assert.equal(
        printf('%s =', 'abc', 3, false, { foo: 'bar' }),
        'abc = 3 false {"foo":"bar"}'
      );
    }
  }
};
