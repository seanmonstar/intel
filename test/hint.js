/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const path = require('path');
const util = require('util');

const jshint = require('jshint').JSHINT;
const P = require('bluebird');
const walk = require('walk');

// read jshintrc
var jshintrc = JSON.parse(fs.readFileSync(path.join(__dirname, '../.jshintrc'))
    .toString());
var filesToLint = [];

var options = {
  listeners: {
    file: function(root, fStat, next) {
      var f = path.join(root, fStat.name);
      if (/\.js$/.test(f)) {
        filesToLint.push(f);
      }
      next();
    }
  }
};

module.exports = {



  'jshint': {

    'before': function() {
      walk.walkSync(path.join(__dirname, '../lib'), options);
      walk.walkSync(__dirname, options);
    },

    'should yield no errors': function(done) {
      this.slow(2000); // can be slow reading all the files :(
      var errors = [];

      var read = P.promisify(fs.readFile);
      P.all(filesToLint.map(function(fileName) {
        return read(String(fileName)).then(function(data) {
          var f = path.relative(process.cwd(), fileName);
          if (!jshint(String(data), jshintrc)) {
            jshint.errors.forEach(function(e) {
              errors.push(
                util.format("%s %s:%d - %s", e.id, f, e.line, e.reason));
            });
          }
        });
      })).done(function() {
        if (errors.length) {
          var buf = util.format("\n        %d errors:\n        * ",
                                errors.length);
          buf += errors.join("\n        * ");
          done(buf);
        } else {
          done(null);
        }
      });
    }

  }
};

