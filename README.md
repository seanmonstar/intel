# intel [![Build Status](https://travis-ci.org/seanmonstar/intel.png?branch=master)](https://travis-ci.org/seanmonstar/intel)

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
  - [NullHandler](#nullhandler)
  - [Creating a Custom Handler](#creating-a-custom-handler)
- [Formatters](#formatters)
  - [LogRecord Formatting](#logrecord)
- [config](#config)
  - [basicConfig](#basicconfig)
  - [dictConfig](#dictconfig)
- [console](#console)

## Logging

### Using Default Logger

To get started right away, intel provides a default logger. The module itself is an instance of a `Logger`.

    require('intel').info('Hello intel');

### String interpolation

You can log messages using interpolation just as you can when using the `console.log` API:

    require('intel').info('Situation %s!', 'NORMAL');

### Setting the Log Level

Loggers have a log level that is compared against log messages. All messages that are of a lower level than the Logger are ignored. This is useful to reduce less important messages in production deployments.

    var intel = require('intel');
    intel.setLevel(intel.WARN);
    intel.warn('i made it!');
    intel.debug('nobody loves me');

### Adding a Handler

The default logger will use a [ConsoleHandler](#consolehandler) if you don't specify anything else. You can add handlers to any logger:

    var intel = require('intel');
    intel.addHandler(new intel.handlers.File('/path/to/file.log'));

    intel.info('going to a file!');

### Getting a Named Logger

Using named loggers gives you a lot of power in `intel`. First, the logger name can be included in the log message, so you can more easily understand where log messages are happening inside your application.

    var log = require('intel').getLogger('foo.bar.baz');
    log.setLevel(log.INFO).warn('baz reporting in');

The names are used to build an hierarchy of loggers. Child loggers can inherit their parents' handlers and log level.

    var intel = require('intel');
    var aLog = intel.getLogger('alpha');
    aLog.setLevel(intel.WARN).addHandler(new intel.handlers.File('alpha.log'));

    var bLog = intel.getLogger('alpha.bravo');
    bLog.verbose('hungry') // ignored, since alpha has level of WARN
    bLog.warn('enemy spotted'); // logged to alpha.log

The power of logger hierarchies can seen more when using [intel.config](#config).

### Async logging

With Nodejs' async nature, many handlers will be dealing with asynchronous APIs. In most cases, that shouldn't be your concern, and you can ignore this. However, if you need to execute code after a log message has been completely handled, every log method returns a promise. The promise only gets resolved after all handlers have finished handling that message.

    require('intel').warn('report in').then(rogerThat);

## Handlers

Loggers build a message and try to pass the message to all of it's handlers and to it's parent. Handlers determine exactly what to do with that message, whether it's sending it to console, to a file, over a socket, or nothing at all.

All Handlers have a `level` and a [`Formatter`](#formatters).

    new intel.Handler({
      level: intel.WARN, // default is NOTSET
      formatter: new intel.Formatter() // default formatter
    });

Just like Loggers, if a message's level is not equal to or greater than the Handler's level, the Handler won't even be given the message.

### ConsoleHandler

    new intel.handlers.Console(options);

The Console handler outputs messages to the `stdio`, just like `console.log()` would.

### StreamHandler

    new intel.handlers.Stream(streamOrOptions);

The Stream handler can take any writable stream, and will write messages to the stream. The [Console](#consolehandler) handler essentially uses 2 Stream handlers internally pointed at `process.stdout` and `process.stdin`.

- **stream**: Any [WritableStream](http://nodejs.org/api/stream.html#stream_class_stream_writable)
- Plus options from [Handler](#handlers)

As a shortcut, you can pass the `stream` directly to the constructor, and all other options will just use default values.

### FileHandler

    new intel.handlers.File(filenameOrOptions);

The File handler will write messages to a file on disk. It extends the [Stream](#streamhandler) handler, by using the `WritableStream` created from the filename.

- **file**: A string of a filename to write messages to.
- Plus options from [Handler](#handlers)

As a shortcut, you can pass the `file` String directly to the constructor, and all other options will just use default values.

### NullHandler

    new intel.handlers.Null();

The Null handler will do nothing with received messages. This can useful if there's instances where you wish to quiet certain loggers when in production (or enemy territory).

### Creating Custom Handlers

Adding a new custom handler that isn't included in intel is a snap. Just make a subclass of [Handler](#handlers), and implement the `emit` method.

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

## Formatters

  new intel.Formatter(formatOrOptions);

A `Formatter` is used by a [`Handler`](#handlers) to format the message before being sent out. An useful example is wanting logs that go to the [Console](#consolehandler) to be terse and easy to read, but messages sent to a [File](#filehandler) to include a lot more detail.

- **format**: A format string that will be used with `printf`. Default: `%(message)s`
- **datefmt**: A string to be used to format the date. Will replace instances of `%(date)s` in the `format` string. Default: `%Y-%m-%d %H:%M-%S`
- **colorize**: A boolean for whether to colorize the `levelname`. Default: `false`

### LogRecord

The record that is created by loggers is passed to each handler, and handlers pass it to formatters to do their formatting.

    {
      name: "foo.bar",
      level: 20,
      levelname: "DEBUG",
      timestamp: new Date(),
      message: "all clear",
      args: []
    }

You can output the values from these properties using the [Formatter](#formatters) and a string with `%(property)s`. Some example format strings:

- `%(name)s.%(levelname)s: %(message)s`: foo.bar.DEBUG: all clear
- `[%(date)s] %(name)s:: %(message)s`: \[2013-09-18 11:29:32\] foo.bar:: all clear

## config

Once you understand the power of intel's [named loggers](#getting-a-named-logger), you'll appreciate being able to quickly configure logging in your application.

### basicConfig

The basicConfig is useful if you don't wish to do any complicated configuration (no way, really?). It's a quick way to setup the root default logger in one function call. Note that if you don't setup any handlers before logging, `basicConfig` will be called to setup the default logger.

    intel.basicConfig({
      'file': '/path/to/file.log', // file and stream are exclusive. only pass 1
      'stream': stream,
      'format': '%(message)s',
      'level': intel.INFO
    });

The options passed to basicConfig can include:
- **file** - filename to log
- **stream** - any WritableStream
- **format** - a format string
- **level** - the log level

You cannot pass a `file` and `stream` to basicConfig. If you don't provide either, a [Console](#consolehandler) handler will be used. If you wish to specify multiple or different handlers, take a look at the more comprehensive [dictConfig](#dictconfig).

### dictConfig

    config({
      formatters: {
        'simple': {
          'format': '[%(levelname)s] %(message)s',
          'colorize': true
        },
        'details': {
          'format': '[%(date)s] %(name)s.%(levelname)s: %(message)s'
        }
      }
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
          'formatter': 'details'
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

We set up 2 handlers, one [Console](#consolehandler) with a level of `VERBOSE` and a simple format, and one [File](#filehandler) with a level of `WARN` and a detailed format. We then set up a few options on loggers. Not all loggers need to be defined here, as child loggers will inherit from their parents. So, the root logger that we'll use in this application is `patrol`. It will send all messages that are `INFO` and greater to the the terminal. We also specifically want database errors to be logged to the our log file. And, there's a logger for express? What's that all about? See the [intel.console](#console) section.

## console

  require('intel').console();

So, a problem with logging libraries is trying to get them to work with 3rd party modules.

...


