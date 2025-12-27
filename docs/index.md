# Nxus Core

Nxus Core is the runtime foundation for Nxus applications: a small event-driven `Application` with a boot lifecycle, a promisified `Dispatcher`, and a module proxy layer (`ModuleProxy`) that allows modules to communicate without tight coupling.

## What makes Nxus unique

Nxus is designed for teams who want the benefits of modular architecture without building (and maintaining) a custom framework:

- **Composable async events**: events return promises and support `before`/`after` hooks, so you can build pipelines and “contribution” patterns cleanly.
- **Loose coupling between modules**: modules integrate through `ModuleProxy` instead of importing each other directly.
- **Deterministic startup**: a fixed lifecycle makes it clear where to do work, and makes startup behavior consistent across apps.
- **Small core, scalable ecosystem**: Nxus Core stays minimal; most functionality lives in modules.

## Recommended reading order

If you’re new to Nxus, these guides build on each other:

- Start with [Getting started](./guides/getting-started).
- Learn the lifecycle in [Boot lifecycle](./guides/boot-lifecycle).
- Understand how Nxus fits together in [Architecture & core concepts](./guides/architecture).
- Learn how to design module APIs in [Modules](./guides/modules).
- Pick a structure in [Application patterns](./guides/application-patterns).

## Quick links

- [Getting started](./guides/getting-started.md)
- [Configuration](./guides/configuration.md)
- [Boot lifecycle](./guides/boot-lifecycle.md)
- [Architecture](./guides/architecture.md)
- [Modules](./guides/modules.md)
- [Application patterns](./guides/application-patterns.md)
- [API reference](./api/)


