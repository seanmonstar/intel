/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const SLICE = Array.prototype.slice;

const RE = /%(-?\d+)?(\.-?\d+)?(%|(\([^\)]+\))?([sdO]))/g;

function pad(str, value) {
  var isRight = false;

  if(value < 0) {
    isRight = true;
    value = -value;
  }

  if(str.length < value) {
    var padding = new Array(value - str.length + 1).join(' ');
    return isRight ? str + padding : padding + str;
  } else{
    return str;
  }
}

function truncate(str, value) {
  if(value > 0) {// truncate from begining
    return str.slice(-value);
  } else {// truncate from end
    return str.slice(0, -value);
  }
}

module.exports = function(format, obj) {
  var args = SLICE.call(arguments, 1);
  var counter = 0;
  return String(format).replace(RE,
    function(match, padding, trunc, kind, name, type) {

      if (kind === '%') {
        return '%';
      }

      var val;
      if (name) {
        val = obj[name.substring(1, name.length - 1)];
      } else {
        val = args[counter++];
      }

      if (trunc !== undefined) {
        val = truncate(val, trunc.slice(1));
      }

      if (padding !== undefined) {
        val = pad(val, padding);
      }

      switch (type) {
      case 's':
        return String(val);
      case 'd':
        return Number(val);
      case 'O':
        return JSON.stringify(val);
      }
    });
};
