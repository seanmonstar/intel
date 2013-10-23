/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const util = require('util');

const Promise = require('bluebird');

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

FileHandler.prototype._opened = function opened() {
  var def = Promise.pending();
  this._stream = this._open();
  this._stream.once('open', def.fulfill.bind(def));
  return def.promise;
};

module.exports = FileHandler;
