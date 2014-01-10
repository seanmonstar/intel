/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');

fs.readdirSync(__dirname).forEach(function(file) {
  if (file === 'index.js' || file === 'handler.js') {
    return;
  }

  var handler = file.replace('.js', '');
  var capital = handler[0].toUpperCase() + handler.substring(1);

  Object.defineProperty(exports, capital, {
    get: function() {
      return require('./' + handler);
    }
  });
});
