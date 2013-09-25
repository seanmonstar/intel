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
