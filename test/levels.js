/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('insist');

const intel = require('../');

module.exports = {

  'LEVELS': {
    'setLevels': {
      'afterEach': function() {
        intel.setLevels(intel.levels.defaults);
      },
      'validation': {
        'should require a "console" property': function() {
          assert.throws(function() {
            intel.setLevels({
              levels: {
                foo: 1
              }
            });
          }, /levels require a console map/);
        },
        'should require level to be a number': function() {
          assert.throws(function() {
            intel.setLevels({
              levels: {
                foo: 'baz'
              },
              console: intel.defaults.console
            });
          }, /level value must be a number/);
        }
      },
      'should remove old levels': function() {
        intel.setLevels({
          levels: {
            foo: 1,
            bar: 2
          },
          console: {
            trace: 'foo',
            log: 'foo',
            info: 'foo',
            warn: 'foo',
            error: 'bar'
          }
        });
        assert(!intel.info);
        assert(!intel.INFO);
        assert(!intel.WARNING);
        assert(!intel.fatal);
      },
      'colors': {
        'should set colors': function() {
          assert(false);
        },
        'should take color as a string or array of strings': function() {
          assert(false);
        }
      }
    }
  }

};
