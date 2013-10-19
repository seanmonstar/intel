/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EOL = require('os').EOL;

const SLICE = Array.prototype.slice;

const RE = /%(%|(\([^\)]+\))?([sdO]))/g;

function syntheticValue(name) {
  switch (name) {
  case 'n':
    return EOL;
  default:
    return null;
  }
}

module.exports = function(format, obj) {
  var args = SLICE.call(arguments, 1);
  var counter = 0;
  return String(format).replace(RE, function(match, kind, name, type) {
    if (kind === '%') {
      return '%';
    }

    var val;
    if (name) {
      name = name.substring(1, name.length - 1);
      val = obj[name] || syntheticValue(name);
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
    default:
      return match;
    }
  });
};
