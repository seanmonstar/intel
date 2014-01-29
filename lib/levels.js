/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LEVELS = module.exports = exports = {};

[
  'NOTSET',
  'TRACE',
  'VERBOSE',
  'DEBUG',
  'INFO',
  'WARNING', // also WARN
  'ERROR',
  'CRITICAL'
].forEach(function(name, index) {
  LEVELS[name] = index * 10;
});


LEVELS.WARN = LEVELS.WARNING;

const NUMBERS = {};
for (var levelname in LEVELS) {
  NUMBERS[LEVELS[levelname]] = levelname;
}

LEVELS.getLevelName = function getLevelName(number) {
  return NUMBERS[number];
};

LEVELS.getLevel = function getLevel(val) {
  var level = parseInt(val, 0);
  if (isNaN(level)) {
    level = LEVELS[String(val).toUpperCase()];
  }
  return level;
};
