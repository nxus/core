<style>#toc .h5 { color: #1184CE; font-weight: normal; text-transform: none; letter-spacing: 0; }</style>

[![Build Status](https://travis-ci.org/nxus/core.svg?branch=master)](https://travis-ci.org/nxus/core)

The Nxus Core package includes the basic Application framework for building a Nxus app.

## Introduction

You'll probably find the following resources useful background and help in building Nxus applcations.

-   [Getting Started](<>) (TODO)
-   [Design Patterns](<>) (TODO)
-   [Nxus Modules](<>) (TODO)
-   [Recipes](<>) (TODO)
-   [Developing a ](<>) (TODO)

## Documentation

The full set of Nxus docs is available at [http://docs.gonxus.org](http://docs.gonxus.org).

## Installation

    > npm install nxus-core --save

## Usage

In your root application, create a new Application instance:

    import {Application} from 'nxus-core'

    let app = new Application(options)

    app.start()

    export default app

### Events

Nxus is built around the concept of a boot cycle.  The application dispatches events in the following order:

| Boot Stage | Description |
| --- | --- |
| `init` | indicates the application is starting up and initializing modules.  Other modules are not gauranteed to be available at this phase. |
| `load` | modules are initialized and loading. This is the place to do any internal setup (outside of the constructor). Other modules are not gauranteed to be available at this phase. |
| `startup` | all modules have been loaded and are available. This is the place to do any setup that requires data/input from other modules (like Storage) |
| `launch` | the application is launching and all services have been started. Routes are accessible. Use onceAfter('launch') to guarantee execution after the application has completely launched |

### Module Loading

By default the Application will look for other Nxus modules in the following order:

1.  @nxus namespaced npm modules in your `package.json` file.
2.  Any packages that match the 'namespace-' pattern passed in the `namespace` application config option.
3.  folders in the ./modules folder in the root of your project
4.  any modules specified in the _modules_ option passed into Application on instantiation.

### Module Access

In order to access module commands, use the Application.get() method.

    let router = Application.get('router')

### Application Configuration

The Application exposes a core `config` object that contains application and module specific configuration values.

Nxus uses the [rc](https://www.npmjs.com/package/rc) library to provide application configuration.

The application configuration can usually be found in a `.nxusrc` file in the root folder.

You can override specific confirguation values using command line environment variables, which supports nesting.

```
nxus_myconfig__value__first=true npm start
```

will translate into an application config of

```
console.log(app.config.myconfig) // {value: {first: true}}
```

You can also pass partial config objects (for run-time override of specific keys) in two ways. An options argument to `application.start()`:

```
application.start({module: {key: value}})
```

Or as a response to the `config` event:

```
application.on('config', () => {
  return {module: {key: value}}
})
```

`start` options take precendence over `config` event options take precendence over rc or command-line options.

### Mocha Test Configuration

As a convenience, the Nxus Core package provides a
`/lib/test/support/node.js` module that supplies a standard set of
definitions for the Mocha test environment. It includes the Chai
assertion library with ChaiAsPromised extensions, exposes `chai` and
`expect` as global variables, and initializes Chai's `should` assertions.

You can refer to it with Mocha's `--require` option, or include it in a
`mocha.opts` configuration file:
```
  --require nxus-core/lib/test/support/node

```
