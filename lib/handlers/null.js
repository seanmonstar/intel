const util = require('util');

const Handler = require('./handler');

function NullHandler() {

}

util.inherits(NullHandler, Handler);

NullHandler.prototype.emit = function nullEmit(record, callback){
  callback();
};

module.exports = NullHandler;
