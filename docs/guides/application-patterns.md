# Application patterns

Nxus Core is flexible: you can use the same module system and lifecycle for a CLI tool, a long-running service, or a background worker. This guide describes common patterns and what to do in each lifecycle stage.

## A suggested project layout

Most Nxus applications are easiest to reason about when they follow a simple convention:

- `index.js` (or `server.js`): creates/starts the application
- `.nxusrc`: environment-specific configuration
- `modules/`: local application modules (your domain code)

Example:

```
my-app/
  index.js
  .nxusrc
  modules/
    api/
      index.js
    jobs/
      index.js
```

## Pattern: long-running service (API / web / realtime)

**Goal**: start servers and keep running until shutdown.

- **constructor**: register event handlers, configure proxies, define module APIs
- **`init`**: lightweight setup; read/validate config
- **`load`**: internal wiring that does not depend on other modules
- **`startup`**: integration work that depends on other modules being present (e.g. register routes with a router module)
- **`launch`**: start listening / connect external services; at this point the app is “live”
- **`stop`**: close server sockets, drain queues, flush logs

Recommendations:

- Prefer `startup` to wire module-to-module interactions.
- Prefer `launch` for side effects that expose the system (ports, subscriptions).
- Handle process signals (`SIGTERM`, `SIGINT`) in your entrypoint and call `application.stop()`.

## Pattern: background worker (jobs, queue consumers, schedulers)

**Goal**: run work continuously (or on a schedule), typically without serving HTTP.

Recommendations:

- Keep the “work loop” as a module that starts on `launch` and stops on `stop`.
- If you depend on other modules (storage, metrics), wire those dependencies during `startup`.
- For graceful shutdown, ensure your worker stops polling and waits for in-flight jobs to finish during `stop`.

## Pattern: CLI script (one-off)

**Goal**: do a single operation and exit.

Nxus supports script-style runs via configuration:

- `script: true` silences Nxus logging so your CLI output stays clean
- `silent: true` disables all logging output

Recommendations:

- do most work in `onceAfter('launch')` so all modules are booted, then explicitly exit
- treat modules as libraries: they should expose commands as proxy events (see Modules guide)

## Pattern: plugin platform (an “app” that is mostly modules)

**Goal**: your app is a thin shell that loads and coordinates modules.

Recommendations:

- keep the entrypoint extremely small; prefer configuration-driven behavior
- define stable module contracts (events) and avoid cross-importing
- use module config keys to enable/disable optional modules per deployment

## Choosing singleton `application` vs `new Application()`

- Use the **singleton** for most apps — it’s the simplest and matches how `NxusModule` is designed.
- Use a **new `Application` instance** for test isolation or special processes.

If you need multiple application instances in the same process, avoid modules that extend `NxusModule` (it binds to the singleton `application`). Prefer modules that accept an `app` instance and call `app.get(name)` directly.



