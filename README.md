# intel

[![Build Status](https://travis-ci.org/seanmonstar/intel.png?branch=master)](https://travis-ci.org/seanmonstar/intel)
![Coverage Status](./coverage.png)
[![NPM version](https://badge.fury.io/js/intel.png)](http://badge.fury.io/js/intel)

An abbreviation of intelligence. In this case, the acquirement of information.

> I'm ganna need more intel.

## Motivation

- hierarchial named loggers
- powerful config
- console injection works with all libraries
- fast where possible

## Table of Contents

- [Logging](#logging)
  - [Using Default Logger](#using-default-logger)
  - [String Interpolation](#string-interpolation)
  - [Setting the Log Level](#setting-the-log-level)
  - [Adding a Handler](#adding-a-handler)
  - [Getting Named Loggers](#getting-a-named-logger)
  - [Logging Exceptions](#logging-exceptions)
- [Handlers](#handlers)
  - [ConsoleHandler](#consolehandler)
  - [StreamHandler](#streamhandler)
  - [FileHandler](#filehandler)
  - [NullHandler](#nullhandler)
  - [Creating a Custom Handler](#creating-a-custom-handler)
- [Filters](#filters)
- [Formatters](#formatters)
  - [LogRecord Formatting](#logrecord)
- [config](#config)
  - [basicConfig](#basicconfig)
  - [Full Configuration](#full-configuration)
- [console](#console)
  - [debug()](#console.debug)

## Logging

### Using Default Logger

To get started right away, intel provides a default logger. The module itself is an instance of a `Logger`.

```js
require('intel').info('Hello intel');
```

### String interpolation

You can log messages using interpolation just as you can when using the `console.log` API:

```js
require('intel').info('Situation %s!', 'NORMAL');
```

### Setting the Log Level

Loggers have a log level that is compared against log messages. All messages that are of a lower level than the Logger are ignored. This is useful to reduce less important messages in production deployments.

```js
var intel = require('intel');
intel.setLevel(intel.WARN);
intel.warn('i made it!');
intel.debug('nobody loves me');
```

All levels by order: (each level has a corresponding method on a Logger)

```js
intel.TRACE // intel.trace()
intel.VERBOSE // intel.verbose()
intel.DEBUG // intel.debug()
intel.INFO // intel.info()
intel.WARN // intel.warn()
intel.ERROR // intel.error()
intel.CRITICAL // intel.critical()
```

Useful levels that don't have accompanying logger methods are `intel.NONE` and `intel.ALL`.

### Adding a Handler

The default logger will use a [ConsoleHandler](#consolehandler) if you don't specify anything else. You can add handlers to any logger:

```js
var intel = require('intel');
intel.addHandler(new intel.handlers.File('/path/to/file.log'));

intel.info('going to a file!');
```

You can remove all handlers from a particular logger with `logger.removeAllHandlers()`.

### Getting a Named Logger

Using named loggers gives you a lot of power in `intel`. First, the logger name can be included in the log message, so you can more easily understand where log messages are happening inside your application.

```js
var log = require('intel').getLogger('foo.bar.baz');
log.setLevel(log.INFO).warn('baz reporting in');
```

The names are used to build an hierarchy of loggers. Child loggers can inherit their parents' handlers and log level.

```js
var intel = require('intel');
var alpha = intel.getLogger('alpha');
alpha.setLevel(intel.WARN).addHandler(new intel.handlers.File('alpha.log'));

var bravo = intel.getLogger('alpha.bravo');
bravo.verbose('hungry') // ignored, since alpha has level of WARN
bravo.warn('enemy spotted'); // logged to alpha.log
```

The power of logger hierarchies can seen more when using [intel.config](#config).

### Logging Exceptions

Any time you pass an exception (an `Error`!) to a log method, the stack
will be included in the output. In most cases, it will be appended at
the end of the message. If the format is `%O`, meaning JSON output, a
stack property will be included.

```js
intel.error('ermahgawd', new Error('boom'));
```

Loggers can also handle `uncaughtException`, passing it to its handlers,
and optionally exiting afterwards.

```js
var logger = intel.getLogger('medbay');
logger.handleExceptions(exitOnError);
```

Pass a boolean for `exitOnError`. Default is `true` if no value is passed.

## Handlers

Loggers build a message and try to pass the message to all of it's handlers and to it's parent. Handlers determine exactly what to do with that message, whether it's sending it to console, to a file, over a socket, or nothing at all.

All Handlers have a `level` and a [`Formatter`](#formatters).

```js
new intel.Handler({
  level: intel.WARN, // default is NOTSET
  formatter: new intel.Formatter(), // default formatter
  timeout: 5000 // default is 5seconds
});
```

Just like Loggers, if a message's level is not equal to or greater than the Handler's level, the Handler won't even be given the message.

### ConsoleHandler

```js
new intel.handlers.Console(options);
```

The Console handler outputs messages to the `stdio`, just like `console.log()` would.

### StreamHandler

```js
new intel.handlers.Stream(streamOrOptions);
```

The Stream handler can take any writable stream, and will write messages to the stream. The [Console](#consolehandler) handler essentially uses 2 Stream handlers internally pointed at `process.stdout` and `process.stdin`.

- **stream**: Any [WritableStream](http://nodejs.org/api/stream.html#stream_class_stream_writable)
- Plus options from [Handler](#handlers)

As a shortcut, you can pass the `stream` directly to the constructor, and all other options will just use default values.

### FileHandler

```js
new intel.handlers.File(filenameOrOptions);
```

The File handler will write messages to a file on disk. It extends the [Stream](#streamhandler) handler, by using the `WritableStream` created from the filename.

- **file**: A string of a filename to write messages to.
- Plus options from [Handler](#handlers)

As a shortcut, you can pass the `file` String directly to the constructor, and all other options will just use default values.

### NullHandler

```js
new intel.handlers.Null();
```

The Null handler will do nothing with received messages. This can useful if there's instances where you wish to quiet certain loggers when in production (or enemy territory).

### Creating Custom Handlers

Adding a new custom handler that isn't included in intel is a snap. Just make a subclass of [Handler](#handlers), and implement the `emit` method.

```js
const util = require('util');
const intel = require('intel');

function CustomHandler(options) {
  intel.Handler.call(this, options);
  // whatever setup you need
}
// don't forget to inhert from Handler (or a subclass, like Stream)
util.inherits(CustomHandler, intel.Handler);

CustomHandler.prototype.emit = function customEmit(record) {
  // do whatever you need to with the log record
  // this could be storing it in a db, or sending an email, or sending an HTTP request...
  // if you want the message formatted:
  // str = this.format(record);
}
```

A list of known Handlers is kept on the [wiki](https://github.com/seanmonstar/intel/wiki/Custom-Handlers).

## Filters

You can already plug together handlers and loggers, with varying levels, to get powerful filtering of messages. However, sometimes you really need to filter on a specific detail on a message. You can add these filters to a [Handler](#handlers) or [Logger](#logging).

```js
intel.addFilter(new intel.Filter(/^foo/g));
intel.addFilter(new intel.Filter('patrol.db'));
intel.addFilter(new intel.Filter(filterFunction));
```

Filters come in 3 forms:

- **string** - pass a string to filter based on Logger name. So, `Filter('foo.bar')` will allow messages from `foo.bar`, `foo.bar.baz`, but not `foo.barstool`.
- **regexp** - pass a RegExp to filter based on the text content of the log message. So, `Filter(/^foo/g)` will allow messages like `log.info('foo bar')` but not `log.info('bar baz foo')`;
- **function** - pass a function that receives a [LogRecord](#logrecord) object, and returns true if the record meets the filter.

## Formatters

```js
new intel.Formatter(formatOrOptions);
```

A `Formatter` is used by a [`Handler`](#handlers) to format the message before being sent out. An useful example is wanting logs that go to the [Console](#consolehandler) to be terse and easy to read, but messages sent to a [File](#filehandler) to include a lot more detail.

- **format**: A format string that will be used with `printf`. Default: `%(message)s`
- **datefmt**: A string to be used to format the date. Will replace instances of `%(date)s` in the `format` string. Default: `%Y-%m-%d %H:%M-%S`. See [samsonjs/strftime](https://github.com/samsonjs/strftime#supported-specifiers) for supported specifiers.
- **strip**: A boolean for whether to strip [ANSI escape codes](http://en.wikipedia.org/wiki/ANSI_escape_code#Colors_and_Styles) from the `message` and `args`. Default: `false`
- **colorize**: A boolean for whether to colorize the `levelname`. Disabled when `strip` is used. Default: `false`

### LogRecord

The record that is created by loggers is passed to each handler, and handlers pass it to formatters to do their formatting.

```js
{
  name: "foo.bar",
  level: 30,
  levelname: "DEBUG",
  timestamp: new Date(),
  message: "all clear",
  args: [],
  stack: undefined, // if an Error was passed, or trace()
  exception: false, // if an Error was passed
  uncaughtException: false // if passed Error was from process.on('uncaughtException')
}
```

You can output the values from these properties using the [Formatter](#formatters) and a string with `%(property)s`. Some example format strings:

- `%(name)s.%(levelname)s: %(message)s`: foo.bar.DEBUG: all clear
- `[%(date)s] %(name)s:: %(message)s`: \[2013-09-18 11:29:32\] foo.bar:: all clear

#### printf

The `printf` bundled in intel does basic string interpolation. It can
get named properties from an argument, or output several arguments. It
can truncate, pad, or indent, and convert values.

Conversion types:

- `s` - String. Example: `printf('%s', new Error('foo'))` creates `Error: foo`
- `d` - Number.
- `j` and `O` - JSON. `JSON.stringify` the value.
- `?` - Default. Will output a sane default conversion based on argument type.

Conversion flags:

- `:1` - Indent a JSON format with spaces based on number after colon.
  Example: `printf('%:2j', { a: 'b' })` would indent the `"a": "b"` by 2
  spaces. Ignored on other conversion types.
- `3` - A number will pad the output. Example: `printf('%5s', 'abc')`
  returns `'  abc'`.
- `-3` - Pads on the right side. Example: `printf('%-5s', 'abc')`
  returns `'abc  '`.
- `.2` - Truncates to specified length. Example: `printf('%.3s', 12345)`
  returns `'345'`.
- `.-2` - Truncates on the right side. Example: `printf('%.-3s', 12345)`
  returns `'123'`.

## config

Once you understand the power of intel's [named loggers](#getting-a-named-logger), you'll appreciate being able to quickly configure logging in your application.

### basicConfig

The basicConfig is useful if you don't wish to do any complicated configuration (no way, really?). It's a quick way to setup the root default logger in one function call. Note that if you don't setup any handlers before logging, `basicConfig` will be called to setup the default logger.

```js
intel.basicConfig({
  'file': '/path/to/file.log', // file and stream are exclusive. only pass 1
  'stream': stream,
  'format': '%(message)s',
  'level': intel.INFO
});
```

The options passed to basicConfig can include:
- **file** - filename to log
- **stream** - any WritableStream
- **format** - a format string
- **level** - the log level

You cannot pass a `file` and `stream` to basicConfig. If you don't provide either, a [Console](#consolehandler) handler will be used. If you wish to specify multiple or different handlers, take a look at the more comprehensive [config](#full-configuration).

### Full Configuration

```js
intel.config({
  formatters: {
    'simple': {
      'format': '[%(levelname)s] %(message)s',
      'colorize': true
    },
    'details': {
      'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s',
      'strip': true
    }
  },
  filters: {
    'db': 'patrol.db'
  },
  handlers: {
    'terminal': {
      'class': intel.handlers.Console,
      'formatter': 'simple',
      'level': intel.VERBOSE
    },
    'logfile': {
      'class': intel.handlers.File,
      'level': intel.WARN,
      'file': '/var/log/report.log',
      'formatter': 'details',
      'filters': ['db']
    }
  },
  loggers: {
    'patrol': {
      'handlers': ['terminal'],
      'level': 'INFO',
      'handleExceptions': true,
      'exitOnError': false,
      'propagate': false
    },
    'patrol.db': {
      'handlers': ['logfile'],
      'level': intel.ERROR
    },
    'patrol.node_modules.express': { // huh what? see below :)
      'handlers': ['logfile'],
      'level': 'WARN'
    }
  }
});
```

We set up 2 handlers, one [Console](#consolehandler) with a level of `VERBOSE` and a simple format, and one [File](#filehandler) with a level of `WARN` and a detailed format. We then set up a few options on loggers. Not all loggers need to be defined here, as child loggers will inherit from their parents. So, the root logger that we'll use in this application is `patrol`. It will send all messages that are `INFO` and greater to the the terminal. We also specifically want database errors to be logged to the our log file. And, there's a logger for express? What's that all about? See the [intel.console](#console) section.

Config also accepts JSON, simply put a require path in any `class` properties.

```js
// logging.json
{
  "handlers": {
    "foo": {
      "class": "intel/handlers/console"
    }
  }
  // ...
}
```

```js
intel.config(require('./logging.json'));
```

Passing a `handlers` option to `intel.config` will remove the default ROOT console handler, unless you've previously manually assigned handlers to `intel`.

## console

```js
require('intel').console();
```

So, a problem with logging libraries is trying to get them to work with 3rd party modules. Many libraries may benefit from logging when certain things occur, but can't really pick a logging library, since that sort of choice should be up to the app developer. The only real options they have are to not log anything, or to use `console.log`. So really, they should [console.log() all the the things](http://seanmonstar.com/post/56448644049/console-log-all-the-things), and `intel` can work just fine with that.

Intel has the ability to override the global `console`, such that calling any of it's methods will send it through a [Logger](#logging). This means that messages from other libraries can be sent to your log files, or through an email, or whatever. Even better, `intel` will automatically derive a name for the each module that access `console.log` (or `info`, `warn`, `dir`, `trace`, etc). In the [config](#full-configuration) example, we set up rules for `patrol.node_modules.express`. If `express` were to log things as it handled requests, they would all derive a name that was a child of our logger. So, in case it's chatty, we're only interesting in `WARN` or greater messages, and send those to a log file.

It tries its darndest to best guess a name, by comparing the relative paths from the `root` and the module accessing `console`. By default, the `root` is equal to the `dirname` of the module where you call `intel.console()`.

Options:

- **root** - String to define root logger, defaults to calling module's filename
- **ignore** - Array of strings of log names that should be ignored and use standard `console` methods. Ex: `['intel.node_modules.mocha']`
- **debug** - boolean or String. `true` will set `process.env.DEBUG='*'`. Otherwise, String is used, ex: `'request,express'`

```js
// file: patrol/index.js
require('intel').console(); // root is '/path/to/patrol'
```

If you override the console in a file deep inside some directories, you can manually set the root as an option:

```js
// file: patrol/lib/utils/log.js
require('intel').console({ root: '/path/to/patrol' });
```
### console.debug

The `debug` option for `intel.console()`, huh? Yea, so many libraries use the `debug()` library to handle their internal logging needs. It works by not outputing any logs unless you opt-in with an environment variable. In many case, it would make sense to just leave this off, to keep the noise down. However, you can use this option to turn on a libraries logging, and route it into properly named loggers. Since the `debug` module checks `process.env` at require time, you will need to use this option firstmost, before requiring anything else that may require `debug`.

Example

```js
// file: patrol/index.js
require('intel').console({ debug: 'request,express' });
var request = require('request');

request.get('http://example.domain');
// log messages will appear from "patrol.node_modules.request"
```

