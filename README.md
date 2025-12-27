# nxus-core

Nxus Core is the runtime foundation for Nxus applications: a small event-driven `Application` with a boot lifecycle, a promisified `Dispatcher`, and a module proxy layer (`ModuleProxy`) that allows modules to communicate without tight coupling.

## Why Nxus

- **Composable async events**: events return promises and support `before`/`after` hooks.
- **Module boundaries without pain**: modules talk through `ModuleProxy` so you can avoid tight cross-imports.
- **Deterministic startup**: a fixed boot lifecycle gives a stable place to initialize, wire dependencies, and launch services.

## Requirements

- Node.js **>= 22**

## Installation

```bash
npm install nxus-core
```

## Quickstart

The simplest pattern is to use the shared singleton `application`:

```js
const {application} = require('nxus-core')

application.start()

module.exports = application
```

If you need a separate app instance (e.g. tests), create your own:

```js
const {Application} = require('nxus-core')

const app = new Application({silent: true})
app.start()
```

## Boot lifecycle

Nxus is built around a boot cycle. The application dispatches events in the following order:

| Boot Stage | Description |
| ---------- | ----------- |
| `init`     | App is starting up and initializing modules. Other modules may not be available yet. |
| `load`     | Modules are loading. Do internal setup here (outside of constructors). Other modules may not be available yet. |
| `startup`  | All modules have been loaded and are available. Do setup that depends on other modules here. |
| `launch`   | App is launching and services have started. Use `onceAfter('launch')` to guarantee execution after launch completes. |

## Module loading

By default, Nxus loads modules in this order:

1. `@nxus/*` modules installed in `node_modules`
2. Any packages matching the `namespace` config patterns (e.g. `nxus-*`, excluding `nxus-core`)
3. Folders in the project `./modules` directory (or `modulesDir`)
4. Explicit modules passed via `modules` config

## Accessing modules

To access module commands, use `application.get(name)`:

```js
const {application} = require('nxus-core')

const router = application.get('router')
router.provide('route', 'GET', '/', () => 'ok')
```

The proxy also supports calling events as methods:

```js
router.route('GET', '/', () => 'ok')
```

## Configuration

Nxus uses [`rc`](https://www.npmjs.com/package/rc) to compose configuration:

- `.nxusrc` (and other rc sources)
- environment variables (supports nested keys)
- values provided via the `config` event
- values passed to `application.start(opts)`

Example nested environment override:

```bash
nxus_myconfig__value__first=true npm start
```

Which becomes:

```js
console.log(application.config.myconfig) // { value: { first: true } }
```

## Upgrading from Nxus Core v4 → v5

- **Node upgrade**: v5 requires Node **>=22**.
- **No Babel**: v5 ships compiled JavaScript and types; you should no longer need Babel just to run Nxus Core.
- **Native Promises**: v5 no longer forces `global.Promise` to Bluebird. If your app depended on Bluebird-specific APIs (e.g. `Promise.mapSeries`), migrate those call sites to native Promise patterns.

If you maintain a downstream Nxus module/plugin, see the module-focused guide:

- [`docs/guides/upgrading-v4-to-v5-modules.md`](docs/guides/upgrading-v4-to-v5-modules.md)

## Documentation

User guides and API reference live in the docs site (generated as part of this repo):

- See [`docs/`](docs/) for the source.

API reference is generated from TypeScript/TSDoc (see `npm run docs:*` scripts).

Recommended guides:

- [`docs/guides/architecture.md`](docs/guides/architecture.md)
- [`docs/guides/modules.md`](docs/guides/modules.md)
- [`docs/guides/application-patterns.md`](docs/guides/application-patterns.md)
