# Boot lifecycle

Nxus apps boot through a fixed lifecycle. Modules should generally register event handlers in their constructor, and do work during the lifecycle events.

## Stages

| Boot Stage | Description |
| ---------- | ----------- |
| `init`     | App is starting up and initializing modules. Other modules may not be available yet. |
| `load`     | Modules are loading. Do internal setup here (outside of constructors). Other modules may not be available yet. |
| `startup`  | All modules have been loaded and are available. Do setup that depends on other modules here. |
| `launch`   | App is launching and services have started. Use `onceAfter('launch')` to guarantee execution after launch completes. |

## Hooking into stages

```js
const {application} = require('nxus-core')

application.on('init', async () => {
  // early setup
})

application.on('startup', async () => {
  // other modules should now be available
})
```

## Where to put work (practical guidance)

- **Constructors**: register handlers and define module APIs; avoid side effects.
- **`init`**: validate config, compute derived settings, set up in-memory state.
- **`load`**: internal wiring that doesn’t depend on other modules.
- **`startup`**: cross-module wiring (register routes, connect storage-backed services, etc).
- **`launch`**: start “external” side effects (listen on ports, start polling loops).
- **`stop`**: close resources and stop background work.

## `before` / `after` hooks

Nxus `Dispatcher` supports `before(event, ...)` and `after(event, ...)` hooks.

This is useful when you want to:

- validate or transform arguments before handlers run
- post-process results after handlers run

Example:

```js
const {application} = require('nxus-core')

application.before('launch', async (args) => {
  // observe or transform; return new args to override
  return args
})

application.after('launch', async (result) => {
  // observe or transform; return a value to override result
  return result
})
```

## Waiting for a stage to complete

If you need to schedule work after a stage has fully completed, prefer:

- `application.onceAfter('launch', handler)` (runs after `launch` finishes)


