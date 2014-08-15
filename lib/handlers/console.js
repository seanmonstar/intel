/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const StreamHandler = require('./stream');

function ConsoleHandler(options) {
  options = options || {};
  options.stream = process.stderr;
  StreamHandler.call(this, options);
}

util.inherits(ConsoleHandler, StreamHandler);

module.exports = ConsoleHandler;
