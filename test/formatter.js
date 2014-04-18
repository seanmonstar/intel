/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('insist');

const intel = require('../');


module.exports = {
  'Formatter': {

    'constructor': {
      'should accept a format string': function() {
        var formatter = new intel.Formatter('%(level)s');
        assert.equal(formatter._format, '%(level)s');
        assert.equal(formatter._datefmt, intel.Formatter.prototype._datefmt);
        assert.equal(formatter._colorize, false);
        assert.equal(formatter._strip, false);
      },
      'should accept options': function() {
        var formatter = new intel.Formatter({
          format: '%(levelname)s',
          datefmt: '%Y',
          colorize: true,
          strip: false
        });

        assert.equal(formatter._format, '%(levelname)s');
        assert.equal(formatter._datefmt, '%Y');
        assert.equal(formatter._colorize, true);
        assert.equal(formatter._strip, false);
      },
      'should disable colorize when strip is enabled': function() {
        var formatter = new intel.Formatter({
          colorize: true,
          strip: true
        });

        assert.equal(formatter._strip, true);
        assert.equal(formatter._colorize, false);
      }
    },


    'format': {
      'should use printf': function() {
        var formatter = new intel.Formatter('%(name)s: %(message)s');
        assert.equal(formatter.format({ name: 'foo', message: 'bar' }),
            'foo: bar');
      },
      'should be able to output record args': function() {
        var formatter = new intel.Formatter('%(name)s: %(message)s [%(args)s]');
        var record = {
          name: 'foo',
          message: 'bar',
          args: ['baz', 3, new Error('quux')]
        };
        assert.equal(formatter.format(record), 'foo: bar [baz,3,Error: quux]');
      },
      'should output as JSON with %O': function() {
        var formatter = new intel.Formatter('%O');
        var record = new intel.Record('foo', intel.INFO, ['bar', { a: 'b' }]);

        var out = formatter.format(record);
        assert.equal(out, JSON.stringify(record));
        var obj = JSON.parse(out);
        assert.equal(obj.message[0], 'bar');
        assert.equal(obj.message[1].a, 'b');
      },
      'should handle circular references  in JSON with %O': function() {
        var formatter = new intel.Formatter('%O');
        var foo = {
          bar: 'bar'
        };
        var baz = {
          quux: 'quux',
          foo: foo
        };
        foo.baz = baz;
        var record = {
          name: 'foo',
          message: 'oh noes:',
          args: ['oh noes:', foo]
        };

        assert.equal(JSON.parse(formatter.format(record)).args[1].baz.foo,
          '[Circular]');
      },
      'should output an Error stack': function() {
        var formatter = new intel.Formatter('%(name)s: %(message)s');
        var e = new Error('boom');
        var trace = e.stack.substr(e.stack.indexOf('\n'));
        var record = {
          name: 'foo',
          message: 'oh noes: ',
          args: ['oh noes:', e],
          stack: trace
        };

        assert.equal(formatter.format(record), 'foo: oh noes: ' + trace);
      },
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
              '\u001b[31m\u001b[1mERROR\u001b[22m\u001b[39m: foo');
        }
      },
      'strip': {
        'should strip ANSI escape codes from the output': function() {
          var formatter = new intel.Formatter({
            format: '%(levelname)s: %(message)s [%(args)s]',
            strip: true
          });

          var record = {
            levelname: 'INFO',
            message: '\u001b[36mHello World\u001b[39m',
            args: [
              '\u001b[31mFoo\u001b[39m',
              '\u001b[35mBar\u001b[39m',
              '\u001b[33mBaz\u001b[39m'
            ]
          };

          assert.equal(formatter.format(record),
              'INFO: Hello World [Foo,Bar,Baz]');
        }
      }
    }
  }
};
