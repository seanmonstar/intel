/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const Promise = require('bluebird');


module.exports = function timeout(promise, ms) {
  if (ms) {
    var def = Promise.defer();
    var timer = setTimeout(function() {
      def.reject(new Error("Timed out after " + ms + " ms"));
    }, ms);

    promise.then(function(value) {
      clearTimeout(timer);
      def.fulfill(value);
    }, function(reason) {
      clearTimeout(timer);
      def.reject(reason);
    });

    return def.promise;
  } else {
    return promise;
  }
};
