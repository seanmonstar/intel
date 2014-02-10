/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const fs = require('fs');
const util = require('util');

const Promise = require('bluebird');
const dbug = require('dbug')('intel:handlers:rotating');

const FileHandler = require('./file');

const rename = Promise.promisify(fs.rename);
const stat = Promise.promisify(fs.stat);
const unlink = Promise.promisify(fs.unlink);


function RotatingFileHandler(options) {
  FileHandler.call(this, options);
  this._maxSize = options.maxSize;
  this._maxFiles = options.maxFiles;
  this._buffer = [];
}
util.inherits(RotatingFileHandler, FileHandler);

RotatingFileHandler.prototype.emit = function fileEmit(record, callback) {
  // compare size of message vs available size in file
  // if message fits, emit as normal
  // else create a new file, then emit

  // +1 for newline character
  var that = this;
  var msgSize = Buffer.byteLength(that.format(record)) + 1;
  this._buf([msgSize, function() {
    that._size += msgSize;
    FileHandler.prototype.emit.call(that, record, callback);
    that._writing = false;
    that._write();
  }]);
};

RotatingFileHandler.prototype._buf = function buf(tuple) {
  this._buffer.push(tuple);
  if (!this._writing) {
    this._write();
  }
};

RotatingFileHandler.prototype._write = function write() {
  this._writing = true;
  if (this._buffer.length) {
    var tuple = this._buffer.shift();
    this._withSize(tuple[0], tuple[1]);
  } else {
    this._writing = false;
  }
};

RotatingFileHandler.prototype._withSize = function withSize(size, callback) {
  var that = this;

  function next() {
    that._withSize(size, callback);
  }

  if (!this._maxSize) {
    callback();
  } else if (this._size === undefined) {
    this._getSize().then(next);
  } else if (this._size + size > this._maxSize) {
    this._rotate().then(next).done();
  } else {
    callback();
  }
};

RotatingFileHandler.prototype._rotate = function _rotate() {
  dbug('rotating', this._file);
  var that = this;
  // intel.log
  // intel.log.1
  // intel.log.2
  this._stream.end();
  return this._rename().then(function() {
    return that._opened().then(function() {
      that._size = 0;
    });
  });
};

RotatingFileHandler.prototype._rename = function _rename(num) {
  var name = this._file;
  num = num || 0;
  var newName = name + '.' + (num + 1);
  if (num) {
    name += '.' + num;
  }
  if (this._maxFiles && num + 1 >= this._maxFiles) {
    return unlink(name);
  }
  var that = this;
  var def = Promise.pending();
  fs.exists(newName, def.fulfill.bind(def));
  return def.promise.then(function(exists) {
    if (exists) {
      return that._rename(num + 1);
    }
  }).then(function() {
    return rename(name, newName);
  });
};

RotatingFileHandler.prototype._getSize = function _getSize() {
  var that = this;
  return stat(this._file).then(function(stats) {
    return that._size = stats.size;
  });
};

module.exports = RotatingFileHandler;
