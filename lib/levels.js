/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const LEVELS = module.exports = exports = {
  'NOTSET': 0,
  'VERBOSE': 10,
  'DEBUG': 20,
  'INFO': 30,
  'WARNING': 40,
  'ERROR': 50,
  'CRITICAL': 60
};

LEVELS.WARN = LEVELS.WARNING;

const NUMBERS = {};
for (var levelname in LEVELS) {
  NUMBERS[LEVELS[levelname]] = levelname;
}

LEVELS.getLevelName = function getLevelName(number) {
  return NUMBERS[number];
};

exports.getLevel = function getLevel(val) {
  var level = parseInt(val, 0);
  if (isNaN(level)) {
    level = LEVELS[String(val).toUpperCase()];
  }
  return level;
};
