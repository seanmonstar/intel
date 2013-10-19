/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const SLICE = Array.prototype.slice;

const RE = /%(%|(\([^\)]+\))?([esdO]))/g;

module.exports = function(format, obj) {
  var args = obj.args;
  var counter = 0;
  return String(format).replace(RE, function(match, kind, name, type) {
    if (kind === '%') {
      return '%';
    }

    var val;
    if (name) {
      val = obj[name.substring(1, name.length - 1)];
    } else {
      val = args[counter++];
    }

    switch (type) {
    case 's':
      return String(val);
    case 'd':
      return Number(val);
    case 'O':
      return JSON.stringify(val);
    case 'e':
      return val instanceof Error ? val.stack : '';
    default:
      return match;
    }
  });
};
