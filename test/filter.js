/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const intel = require('../');

module.exports = {
  'Filter': {
    'with regexp': {
      'should filter records based on message': function() {
        var f = new intel.Filter(/^foo/g);

        assert(!f.filter({
          name: 'foo',
          message: 'bar baz boom'
        }));

        assert(!f.filter({
          name: 'bar',
          message: 'not foobar'
        }));

        assert(f.filter({
          name: 'bar',
          message: 'foobar'
        }));
      }
    },
    'with string': {
      'should filter records based on logger name': function() {
        var f = new intel.Filter('foo.bar');

        assert(f.filter({
          name: 'foo.bar'
        }));

        assert(f.filter({
          name: 'foo.bar.baz'
        }));

        assert(!f.filter({
          name: 'food.bar',
        }));
      }
    },
    'with function': {
      'should filter records': function() {
        var f = new intel.Filter(function(record) {
          return record.name === 'foo' && record.message.indexOf('bar') !== -1;
        });

        assert(f.filter({
          name: 'foo',
          message: 'bar baz boom'
        }));

        assert(!f.filter({
          name: 'foo',
          message: 'boom'
        }));
      }
    }
  }
};
