/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// util to protect us from circular references when stringifying

'use strict';

function stringify(obj, indent) {
  var seen = [];
  return JSON.stringify(obj, function filter(key, val) {
    if (!val || typeof val !== 'object') {
      return val;
    } else if (seen.indexOf(val) !== -1) {
      return '[Circular]';
    }
    seen.push(val);
    return val;
  }, indent || 0);
}

function nativeJson(obj, indent) {
  return indent ? JSON.stringify(obj, null, indent) : JSON.stringify(obj);
}

module.exports = function json(obj, indent) {
  try {
    return nativeJson(obj, indent);
  } catch (e) {
    return stringify(obj, indent);
  }
};
