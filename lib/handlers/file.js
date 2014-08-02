/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const util = require('util');

const StreamHandler = require('./stream');

function FileHandler(options) {
  if (typeof options === 'string') {
    options = { file: options };
  }
  this._file = options.file;

  options.stream = this._open();
  StreamHandler.call(this, options);
}
util.inherits(FileHandler, StreamHandler);

FileHandler.prototype._open = function open() {
  return fs.createWriteStream(this._file, { flags: 'a' });
};

module.exports = FileHandler;
