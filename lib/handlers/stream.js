/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const util = require('util');

const Handler = require('./handler');

function StreamHandler(options) {
  options = options || {};
  if (!options.stream) {
    options = { stream: options };
  }
  Handler.call(this, options);
  this._stream = options.stream;
}

util.inherits(StreamHandler, Handler);

StreamHandler.prototype.emit = function streamEmit(record) {
  this._stream.write(this.format(record) + '\n');
};

module.exports = StreamHandler;
