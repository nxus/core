# Nxus Core

Nxus Core is the runtime foundation for Nxus applications: a small event-driven `Application` with a boot lifecycle, a promisified `Dispatcher`, and a module proxy layer (`ModuleProxy`) that allows modules to communicate without tight coupling.

## Requirements

- Node.js **>= 22**

## Quickstart

```js
const {application} = require('nxus-core')

application.start()
```

## Documentation

- User docs live in [`docs/`](./docs/) (Vitepress site + guides).
- API reference is generated into [`docs/api/`](./docs/api/) from the TypeScript source.

Key guides:

- [`docs/guides/getting-started.md`](./docs/guides/getting-started.md)
- [`docs/guides/architecture.md`](./docs/guides/architecture.md)
- [`docs/guides/modules.md`](./docs/guides/modules.md)
- [`docs/guides/application-patterns.md`](./docs/guides/application-patterns.md)

## Testing helper

Nxus Core includes a small Mocha helper that sets up Chai + chai-as-promised globals:

- `nxus-core/test/support/node`

