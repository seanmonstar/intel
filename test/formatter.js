/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const intel = require('../');

module.exports = {
  'Formatter': {
    
    'colorize': {
      'should colorize the output': function() {
        var formatter = new intel.Formatter({
          format: '%(levelname)s: %(message)s',
          colorize: true
        });


        var record = {
          levelname: 'ERROR',
          message: 'foo'
        };
        assert.equal(formatter.format(record),
            '\u001b[31mERROR\u001b[39m: foo');
      }
    }
  }
};
