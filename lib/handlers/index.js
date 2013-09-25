const fs = require('fs');
const path = require('path');

fs.readdirSync(__dirname).forEach(function(file) {
  if (file === 'index.js' || file === 'handler.js') {
    return;
  }

  var handler = file.replace('.js', '');
  var capital = handler[0].toUpperCase() + handler.substring(1);

  Object.defineProperty(exports, capital, {
    get: function() {
      return require('./' + handler);
    }
  });
});
