/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const util = require('util');

const Q = require('q');

const StreamHandler = require('./stream');

function FileHandler(options) {
  if (typeof options === 'string') {
    options = { file: options };
  }
  this._file = options.file;

  options.stream = fs.createWriteStream(this._file, { flags: 'a' });
  StreamHandler.call(this, options);
}

util.inherits(FileHandler, StreamHandler);


FileHandler.prototype.close = function close() {

};

module.exports = FileHandler;
