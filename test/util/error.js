/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const intel = require('../../');

intel.handleExceptions(process.argv.indexOf('--noexit') === -1);

setTimeout(function() {
  throw new Error('catch me if you can');
}, 5);

setTimeout(function() {
  intel.info('noexit');
}, 225);
