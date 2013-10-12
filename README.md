# intel

[![Build Status](https://travis-ci.org/seanmonstar/intel.png?branch=master)](https://travis-ci.org/seanmonstar/intel)
[![NPM version](https://badge.fury.io/js/intel.png)](http://badge.fury.io/js/intel)

An abbreviation of intelligence. In this case, the acquirement of information.

> I'm ganna need more intel.

## Motivation

Really? Another logger? Well, yes. But here's why:


- hierarchial named loggers
- powerful config
- console injection works with all libraries 


## Table of Contents

- [Logging](#logging)
  - [Using Default Logger](#using-default-logger)
  - [String Interpolation](#string-interpolation)
  - [Setting the Log Level](#setting-the-log-level)
  - [Adding a Handler](#adding-a-handler)
  - [Getting Named Loggers](#getting-a-named-logger)
  - [Async Logging](#async-logging)
- [Handlers](#handlers)
  - [ConsoleHandler](#consolehandler)
  - [StreamHandler](#streamhandler)
  - [FileHandler](#filehandler)
  - [RotatingFileHandler](#rotatingfilehandler)
  - [NullHandler](#nullhandler)
  - [Creating a Custom Handler](#creating-a-custom-handler)
- [Filters](#filters)
- [Formatters](#formatters)
  - [LogRecord Formatting](#logrecord)
- [config](#config)
  - [basicConfig](#basicconfig)
  - [Full Configuration](#full-configuration)
- [console](#console)

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

### Adding a Handler

The default logger will use a [ConsoleHandler](#consolehandler) if you don't specify anything else. You can add handlers to any logger:

```js
var intel = require('intel');
intel.addHandler(new intel.handlers.File('/path/to/file.log'));

intel.info('going to a file!');
```

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

### Async logging

With Nodejs' async nature, many handlers will be dealing with asynchronous APIs. In most cases, that shouldn't be your concern, and you can ignore this. However, if you need to execute code after a log message has been completely handled, every log method returns a promise. The promise only gets resolved after all handlers have finished handling that message.

```js
require('intel').warn('report in').then(rogerThat);
```

## Handlers

Loggers build a message and try to pass the message to all of it's handlers and to it's parent. Handlers determine exactly what to do with that message, whether it's sending it to console, to a file, over a socket, or nothing at all.

All Handlers have a `level`, `timeout`, and a [`Formatter`](#formatters). The `timeout` will cause the promise returned by `log` to be rejected if the handler doesn't complete within the time frame.

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

### RotatingFileHandler

```js
new intel.handlers.Rotating(options);
```

The Rotating handler extends the [File](#filehandler) handler, making sure log files don't go over a specified size.

- **maxSize** - A number of bytes to restrict the size of log files.
- **maxFiles** - A number of log files to create after the size restriction is met.

As files reach the max size, the files will get moved to a the same name, with a number attached to the end. So, `intel.log` will become `intel.log.1`, and `intel.log.1` would move to `intel.log.2`, up to the maxFiles number.

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

CustomHandler.prototype.emit = function customEmit(record, callback) {
  // do whatever you need to with the log record
  // this could be storing it in a db, or sending an email, or sending an HTTP request...
  // if you want the message formatted:
  // str = this.format(record);

  // The callback should be called indicating whether there was an error or not.
  callback(err);
}
```

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
- **datefmt**: A string to be used to format the date. Will replace instances of `%(date)s` in the `format` string. Default: `%Y-%m-%d %H:%M-%S`
- **colorize**: A boolean for whether to colorize the `levelname`. Default: `false`

### LogRecord

The record that is created by loggers is passed to each handler, and handlers pass it to formatters to do their formatting.

```js
{
  name: "foo.bar",
  level: 20,
  levelname: "DEBUG",
  timestamp: new Date(),
  message: "all clear",
  args: []
}
```

You can output the values from these properties using the [Formatter](#formatters) and a string with `%(property)s`. Some example format strings:

- `%(name)s.%(levelname)s: %(message)s`: foo.bar.DEBUG: all clear
- `[%(date)s] %(name)s:: %(message)s`: \[2013-09-18 11:29:32\] foo.bar:: all clear

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
      'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s'
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

```js
// file: patrol/index.js
require('intel').console(); // root is '/path/to/patrol'
```

If you override the console in a file deep inside some directories, you can manually set the root as an option:

```js
// file: patrol/lib/utils/log.js
require('intel').console({ root: '/path/to/patrol' });
```

