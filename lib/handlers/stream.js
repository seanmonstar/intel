/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const Handler = require('./handler');

function StreamHandler(options) {
  if (options.stream) {
    Handler.call(this, options);
    this._stream = options.stream;
  } else {
    Handler.call(this);
    this._stream = options;
  }
}

util.inherits(StreamHandler, Handler);

StreamHandler.prototype.emit = function streamEmit(record, callback) {
  this._stream.write(this.format(record) + '\n', callback);
};

module.exports = StreamHandler;
