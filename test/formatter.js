/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const intel = require('../');

module.exports = {
  'Formatter': {

    'constructor': {
      'should accept a format string': function() {
        var formatter = new intel.Formatter('%(level)s');
        assert.equal(formatter._format, '%(level)s');
        assert.equal(formatter._datefmt, intel.Formatter.prototype._datefmt);
        assert.equal(formatter._colorize, false);
      },
      'should accept options': function() {
        var formatter = new intel.Formatter({
          format: '%(levelname)s',
          datefmt: '%Y',
          colorize: true
        });

        assert.equal(formatter._format, '%(levelname)s');
        assert.equal(formatter._datefmt, '%Y');
        assert.equal(formatter._colorize, true);
      }
    },


    'format': {
      'datefmt': {
        'should format the date': function() {
          var formatter = new intel.Formatter({
            format: '%(date)s',
            datefmt: '%Y-%m'
          });

          var d = new Date();
          var record = {
            timestamp: d
          };

          function pad(val) {
            if (val > 9) {
              return val;
            }
            return '0' + val;
          }
          var expected = d.getFullYear() + '-' + pad(d.getMonth() + 1);
          assert.equal(formatter.format(record), expected);
        }
      },
      
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
  }
};
