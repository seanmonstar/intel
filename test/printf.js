/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const printf = require('../lib/utils/printf');

module.exports = {
  'printf': {
    'should format named args': function() {
      assert.equal(printf('%(foo)s:%(bar)s', { foo: 'a', bar: 'b' }), 'a:b');
    },
    'should print args': function() {
      assert.equal(printf('%s,%s,%d', 'a', 2, 3), 'a,2,3');
      assert.equal(printf('%%s', 'a'), '%s');
      assert.equal(printf('%Z', 'a'), '%Z');
    },
    'should print %O': function() {
      assert.equal(printf('%O', { foo: 'bar' }), '{"foo":"bar"}');
    },
    'should pad if value less then padding': function() {
      assert.equal(printf('%5s', 'abc'), '  abc');
      assert.equal(printf('%-5s', 'abc'), 'abc  ');
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
    },
    'should first truncate and them pad': function() {
      assert.equal(printf('%5.2s', 'abc'), '   bc');
    }
  }
};
