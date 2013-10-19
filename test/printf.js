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
      assert.equal(printf('%s,%s,%d', { args: ['a', 2, 3] } ), 'a,2,3');
    },
    'should print %O': function() {
      assert.equal(printf('%O', { args: [{ foo: 'bar' }] }), '{"foo":"bar"}');
    }
  }
};
