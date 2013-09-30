/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const util = require('util');

const Q = require('q');

const FileHandler = require('./file');

// ERMAHGAWD! I DUN WERK YET!
function RotatingFileHandler(options) {
  FileHandler.call(this, options);
  this._maxSize = options.maxSize;
  this._maxFiles = options.maxFiles;
  throw new Error('I DUN WERK YET!');
}
util.inherits(RotatingFileHandler, FileHandler);

RotatingFileHandler.prototype._maxSize = null;
RotatingFileHandler.prototype._maxFiles = null;

RotatingFileHandler.prototype.emit = function fileEmit(record, callback) {
  this._ensureSize(Buffer.byteLength(this.format(record))).then(function() {
    FileHandler.prototype.emit.call(this, record, callback);
  }, callback);
};

RotatingFileHandler.prototype._ensureSize = function ensureSize(sizeNeeded) {
  if (this._maxSize) {
    if (this._size === undefined) {
      // we don't know how much is in the file, need to get Stats
      return this._getSize().then(this._rotateIfNeeded.bind(this));
    } else {
      return this._rotateIfNeeded(sizeNeeded);
    }
  } else {
    return Q.resolve();
  }

};

RotatingFileHandler.prototype._rotateIfNeeded =
function rotateIfNeeded(sizeNeeded) {
  if (this._size + sizeNeeded > this._maxSize) {
    
  } else {
    return Q.resolve();
  }
};

RotatingFileHandler.prototype._getSize = function getSize() {
  // make sure we only have 1 fs.stats() going at a time
  if (this._sizePromise) {
    return this._sizePromise;
  }
  var that = this;
  return this._sizePromise = Q.nfcall(fs.stat, this._file)
    .then(function(stats) {
      return that._size = stats.size;
    }).finally(function() {
      // once we have stats, we can clean up this promise reference
      delete that._sizePromise;
    });
};

module.exports = RotatingFileHandler;
