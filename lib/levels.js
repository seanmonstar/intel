/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const assert = require('assert');

const chalk = require('chalk');

const Logger = require('./logger');

var def = {
  names: Object.create(null),
  numbers: Object.create(null),
  colors: Object.create(null)
};

function constantLevel(name, val) {
  Logger[name] = Logger.prototype[name] = exports[name] = val;
}

constantLevel('ALL', -Infinity);
constantLevel('NONE', Infinity);

exports.getLevelName = function getLevelName(number) {
  return def.numbers[number];
};

exports.getLevel = function getLevel(val) {
  // 5 => 5
  // '5' => 5
  // 'five' => undefined
  // 'debug' => 20
  // 'DEBUG' = > 20
  var level = Number(val);
  if (isNaN(level)) {
    var upVal = String(val).toUpperCase();
    level = def.names[upVal] || exports[upVal];
  }
  return level;
};

var bold = chalk.bold;
exports.getColor = function getColor(num) {
  return def.colors[num] || bold;
};

function logAtLevel(level) {
  return function(msg /*, args...*/) {
    switch (arguments.length) {
    //faster cases
    case 0:
    case 1:
      return this._log(level, msg);
    case 2:
      return this._log(level, msg, arguments[1]);
    default:
      //turtles
      var args = new Array(arguments.length + 1);
      args[0] = level;
      for (var i = 1; i < args.length; i++) {
        args[i] = arguments[i - 1];
      }
      return this._log.apply(this, args);
    }
  };
}

function alias(target) {
  return function alias() {
    return this[target].apply(this, arguments);
  };
}

function defineLevel(name, level) {
  var loName = name.toLowerCase();
  var upName = name.toUpperCase();
  def.names[upName] = level.level;
  def.numbers[level.level] = upName;
  Logger.prototype[loName] = level.fn || logAtLevel(level.level);
  Logger[upName] = Logger.prototype[upName] = level.level;
  (level.aliases || []).forEach(function(a) {
    var loAlias = a.toLowerCase();
    var upAlias = a.toUpperCase();
    def.names[upAlias] = level.level;
    Logger.prototype[loAlias] = alias(loName);
    Logger[upAlias] = Logger.prototype[upAlias] = level.level;
  });
}

const CONSOLE_KEYS = [
  'trace',
  'log',
  'info',
  'warn',
  'error'
];

function validate(cfg) {
  assert(cfg.levels);
  assert(cfg.console, 'levels require a console map');

  var ret = Object.create(null);
  ret.levels = Object.create(null);
  for (var name in cfg.levels) {
    var _level = cfg.levels[name];

    var num = Number(_level);
    if (!isNaN(num)) {
      _level = {
        level: num
      };
    }
    assert(typeof _level.level === 'number', 'level value must be a number');
    if (_level.color) {
      if (typeof _level.color !== 'function') {
        _level.color = chalk[_level.color];
      }
      assert(_level.color, 'color must be a function or property of chalk');
      def.colors[_level.level] = _level.level;
    }
    ret.levels[name] = _level;

  }

  ret.console = Object.create(null);
  CONSOLE_KEYS.forEach(function(key) {
    assert(cfg.console[key], 'console map requires ' + key);
    assert(ret.levels[cfg.console[key]],
      'console key "'+ key +'" must point at valid level');
  });
  
  ret.console = cfg.console;
  
  return ret;
}

function removeLevels() {
  for (var key in def.names) {
    var loName = key.toLowerCase();
    var upName = key.toUpperCase();
    Logger._resetLevels();
    delete Logger.prototype[loName];
    delete Logger.prototype[upName];
    delete Logger[upName];
    delete def.numbers[def.names[key]];
    delete def.names[key];
  }
}

// Pass an object with properties `levels` and `console`
exports.setLevels = function setLevels(cfg) {
  cfg = validate(cfg);
  removeLevels();
  // set new levels
  var names = Object.keys(cfg.levels);
  names.forEach(function(name) {
    defineLevel(name, cfg.levels[name]);
  });
};

exports._def = def;
