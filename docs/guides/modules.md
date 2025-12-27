# Modules

Nxus applications are built from **modules** (plugins) that communicate by sending messages through `ModuleProxy`. This keeps boundaries clean and enables “optional dependency” patterns where modules can be present or absent without breaking the app.

## What is a module?

A module is simply a class (or function) that Nxus loads and instantiates during startup. Modules typically:

- register handlers for lifecycle events (`init`, `load`, `startup`, `launch`, `stop`)
- expose an integration surface (commands/events) other modules can call
- consume other modules via `application.get('other-module')`

## How modules talk: `ModuleProxy`

To access a module contract:

```js
const {application} = require('nxus-core')

const storage = application.get('storage')
await storage.connect('postgres://...')
```

That call doesn’t require importing the storage module directly. It’s a message routed through the proxy.

### `provide`/`request` vs `gather`/`respond`

The proxy supports two complementary roles:

- **consumer**: `provide()` / `request()` — invoke a named event with arguments
- **producer**: `gather()` / `respond()` — register a handler for a named event

In practice you’ll usually use:

- `respond(name, handler)` to define module API behavior
- `request(name, ...args)` (or `proxy.name(...args)`) to call it

### Fan-in and fan-out behavior

Nxus events can have multiple listeners. When multiple handlers are registered, Nxus collects their results.

Design guidance:

- Use **single-handler contracts** for “commands” (create user, start server).
- Use **multi-handler contracts** for “contributions” (add routes, add config defaults, add middleware).

## Writing a module with `NxusModule`

`NxusModule` is a convenience base class. It:

- derives a module name from the class name (dashed) and a config key (snake)
- wires your instance to its proxy so your public methods become message handlers

Example module:

```js
const {NxusModule} = require('nxus-core')

class Greeter extends NxusModule {
  _defaultConfig() {
    return {greeting: 'Hello'}
  }

  startup() {
    // lifecycle methods can be registered like any other handler; see Boot lifecycle guide
  }

  greet(name) {
    return `${this.config.greeting}, ${name}!`
  }
}

module.exports = Greeter
```

Calling it from elsewhere:

```js
const {application} = require('nxus-core')
const greeter = application.get('greeter')
console.log(await greeter.greet('World'))
```

### Naming conventions (important)

`NxusModule` derives:

- **module name**: dashed version of the class name (e.g. `MyGreeter` → `my-greeter`)
- **config key**: snake version of the class name (e.g. `MyGreeter` → `my_greeter`)

Other modules should call `application.get('<module-name>')` using the derived module name.

### Multi-app processes and `NxusModule`

`NxusModule` binds to the exported singleton `application`. If you need to run multiple `Application` instances in the same process, prefer modules that accept an `app` instance explicitly (do not extend `NxusModule`).

## Configuration for modules

Modules can be configured via `.nxusrc`, environment variables, `config` event, or runtime `start(opts)`.

If your module implements a static `_configName()` method (or extends `NxusModule`), Nxus also supports disabling the module by config:

```json
{
  "my_module": {
    "disabled": true
  }
}
```

## Module loading locations

By default Nxus loads:

- dependency modules from `node_modules/` that match patterns (commonly `nxus-*`, excluding `nxus-core`)
- local application modules from `<appDir>/modules` (or `modulesDir`)

## Testing modules

Nxus Core ships a small Mocha helper you can `--require` to set up Chai + chai-as-promised globals:

- `nxus-core/test/support/node`

Prefer unit tests that:

- create a fresh `Application` instance when you need isolation
- keep side effects out of constructors; do work during lifecycle stages so tests can control timing



