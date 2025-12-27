# Upgrading downstream modules (Nxus Core v4 → v5)

This guide is for **module authors** (packages loaded by Nxus via the plugin loader), not application developers.

## Summary of breaking changes

- **Node.js requirement**: Nxus Core v5 requires **Node >= 22**.
- **No global Bluebird**: Nxus Core v5 no longer assigns `global.Promise` to Bluebird.
- **Packaging expectations**: Nxus Core v5 ships both CJS + ESM builds and can load either style of module export, but you should export your module class/function cleanly.
- **Avoid duplicate `nxus-core` installs**: Nxus will exit if a module is running against a different Nxus Core instance than the app.

## 1) Update engine + CI

- Set `engines.node` to `>=22` (or a narrower supported range if your module wants).
- Update CI/test matrices to run Node 22+.

## 2) Remove Bluebird-specific Promise usage

In Nxus Core v4, many apps implicitly relied on Bluebird APIs being available via the global `Promise`.
In v5 this is no longer true, so any Bluebird-only calls will break at runtime.

Common examples to replace:

- `Promise.map(...)` → `await Promise.all(list.map(...))`
- `Promise.mapSeries(...)` → `for...of` with `await` (or a small helper)
- `Promise.delay(ms)` → `await new Promise(r => setTimeout(r, ms))`

If your module wants Bluebird features, **import Bluebird explicitly** inside the module (don’t assume globals).

## 3) Ensure your exports are compatible with Nxus module loading

Nxus loads modules via `require(...)`. To be compatible:

- **CJS**: `module.exports = MyModule`
- **ESM**: `export default MyModule`

Nxus Core v5 will use the `default` export when present, so ESM default exports work.

Recommendation: export **a single instantiable class** (or function) and avoid side-effect work at module top-level.

## 4) Don’t bundle your own copy of `nxus-core`

Nxus Core v5 detects “separate Nxus Core module” cases and will exit to prevent hard-to-debug split-brain behavior.

To avoid this in downstream modules:

- Prefer `nxus-core` as a **peerDependency** (and a `devDependency` for local tests).
- Avoid bundling `nxus-core` into your published artifact.

## 5) Module configuration: disabling modules (optional)

Nxus Core v5 can skip booting a module when its config key contains `disabled: true`.
This only applies when the module exposes a config name (commonly by extending `NxusModule` or defining `static _configName()`).

Example:

```json
{
  "my_module": {
    "disabled": true
  }
}
```

## 6) Testing notes

- If your tests relied on Bluebird globals, update them the same way as runtime code.
- Nxus Core still provides a small Mocha helper:
  - `nxus-core/test/support/node`


