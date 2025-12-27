# Getting started

## Requirements

- Node.js >= 22

## Install

```bash
npm install nxus-core
```

## Create an application

Nxus Core provides both:

- the singleton `application` (recommended for most apps)
- the `Application` class (useful for tests and multi-app processes)

### Singleton application

```js
const {application} = require('nxus-core')

application.start()

module.exports = application
```

ESM import is also supported:

```js
import {application} from 'nxus-core'

await application.start()
```

### New application instance

```js
const {Application} = require('nxus-core')

const app = new Application({silent: true})
app.start()
```

## Add a local module

Nxus discovers local modules from `<appDir>/modules` (by default, `./modules`).

Create `modules/greeter/index.js`:

```js
const {NxusModule} = require('nxus-core')

class Greeter extends NxusModule {
  greet(name) {
    return `Hello, ${name}!`
  }
}

module.exports = Greeter
```

Then call it from anywhere:

```js
const {application} = require('nxus-core')

const greeter = application.get('greeter')
console.log(await greeter.greet('World'))
```

## Next steps

- Understand **when** to do work in [Boot lifecycle](./boot-lifecycle.md).
- Understand **how** modules communicate in [Modules](./modules.md).
- For a deeper view of how Nxus fits together, see [Architecture](./architecture.md).


