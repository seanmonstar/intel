/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const Handler = require('./handler');

function NullHandler() {
  Handler.apply(this, arguments);
}
util.inherits(NullHandler, Handler);

NullHandler.prototype.emit = function nullEmit(){};

module.exports = NullHandler;
