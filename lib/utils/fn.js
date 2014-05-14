/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


module.exports = function fn(args) {
  /*jshint evil: true*/
  console.log(args, [].slice.call(arguments, 1).join('\n'));
  return new Function(args, [].slice.call(arguments, 1).join('\n'));
};
