# Architecture & core concepts

Nxus Core is a small runtime for building applications as **composable, event-driven modules**.
Instead of a framework that owns “your app”, Nxus is a **coordination layer**: it provides a predictable boot lifecycle, a promisified event system, and a proxy-based integration surface so modules can collaborate without tight coupling.

## Why Nxus is different

- **Async events as a first-class API**: events return promises, can be awaited, and can be composed with `before`/`after` hooks.
- **Loose coupling by default**: modules communicate through `ModuleProxy` (message passing), not by importing each other.
- **Deterministic startup**: a fixed boot lifecycle (`init` → `load` → `startup` → `launch`) gives a consistent place to do work.
- **Small surface area, scalable composition**: Nxus Core is intentionally minimal; most behavior lives in modules.

## The big pieces

### `Application`

`Application` is the runtime container. It:

- loads modules (plugins) via the `PluginManager`
- dispatches lifecycle events during startup
- owns global configuration (`application.config`)
- exposes `application.get(name)` to obtain a `ModuleProxy`

Nxus exports both:

- the shared singleton `application`
- the `Application` class (useful for tests and special cases)

### `Dispatcher` (promisified events + hooks)

`Dispatcher` is the foundation of Nxus messaging. It extends Node’s `EventEmitter`, but changes two important behaviors:

- `emit(event, ...)` returns a **Promise** that resolves after handlers complete
- you can attach `before(event, ...)` and `after(event, ...)` hooks

Practical consequences:

- lifecycle hooks can be async and safely awaited
- “pipelines” are easy: `before` can transform args, `after` can transform results

### `ModuleProxy` (message bus between modules)

`application.get(name)` returns a `ModuleProxy` — the primary integration surface between modules.

Key properties:

- **safe when missing**: a proxy is available even if the target module isn’t loaded yet
- **safe during boot**: proxy calls made before modules load are delayed until the `load` stage
- **two-way patterns**:
  - producers `respond()` / `gather()` (register handlers)
  - consumers `request()` / `provide()` (invoke handlers)

The proxy also supports **event names as methods**, so `proxy.someEvent(...)` is equivalent to `proxy.provide('someEvent', ...)`.

### `PluginManager` (how modules are discovered)

At startup, Nxus discovers modules in:

- `node_modules/` entries matching configured patterns (by default `nxus-*`, excluding `nxus-core`)
- project module directories (by default `<appDir>/modules`, configurable via `modulesDir`)

### `NxusModule` (base class for module authors)

`NxusModule` is a convenience base class that:

- derives the module name and config key from the class name
- automatically binds the instance to a `ModuleProxy`
- supports `_defaultConfig()` and `_userConfig()`

Important nuance: `NxusModule` binds to the exported singleton `application`. If you’re building a multi-app process (multiple `Application` instances), prefer writing modules that accept an `app` instance explicitly instead of extending `NxusModule`.

### Watch mode & restarts (development)

In non-production environments, Nxus can watch configured paths and automatically restart the app on change. This is a development convenience; production deployments should manage process lifecycle externally (systemd, containers, etc).

## Mental model: building with Nxus

Think in terms of:

- **modules** that each own a domain (“routing”, “storage”, “jobs”, “billing”)
- **contracts** that are messages/events, not imports
- **lifecycle** stages that are the only place you do side-effectful work (start servers, connect to DBs, register routes)

Next steps:

- See [Boot lifecycle](./boot-lifecycle.md) for when to do what.
- See [Modules](./modules.md) for how to design module APIs using `ModuleProxy`.
- See [Application patterns](./application-patterns.md) for structuring different kinds of Nxus apps.



