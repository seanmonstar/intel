const assert = require('assert');

const printf = require('../lib/utils/printf');

module.exports = {
  'printf': {
    'should format named args': function() {
      assert.equal(printf('%(foo)s:%(bar)s', { foo: 'a', bar: 'b' }), 'a:b');
    },
    'should print args': function() {
      assert.equal(printf('%s,%s,%d', 'a', 2, 3), 'a,2,3');
    },
    'should print %O': function() {
      assert.equal(printf('%O', { foo: 'bar' }), '{"foo":"bar"}');
    }
  }
};
