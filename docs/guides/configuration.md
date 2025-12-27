# Configuration

Nxus uses [`rc`](https://www.npmjs.com/package/rc) to compose configuration from:

- rc files (commonly `.nxusrc`)
- environment variables
- values provided via the `config` event
- values passed to `application.start(opts)`

## `.nxusrc`

By default, Nxus looks for a `.nxusrc` in the current working directory. The exact lookup rules are provided by `rc`.

## Environment variables

Nested environment variables are supported via `__`:

```bash
nxus_myconfig__value__first=true npm start
```

Which becomes:

```js
console.log(application.config.myconfig) // { value: { first: true } }
```

## Runtime overrides

You can provide partial config objects in two ways:

### `application.start(opts)`

```js
application.start({module: {key: 'value'}})
```

### `config` event

```js
application.on('config', () => {
  return {module: {key: 'value'}}
})
```

Precedence is:

1. `start(opts)`
2. `config` event
3. rc/environment sources

## Common application config keys

Nxus Core provides several top-level config keys (either via `.nxusrc`, environment variables, or runtime overrides):

- `appName`: label used in startup logs
- `appDir`: application directory (used to locate `modules/` and read `package.json`)
- `namespace`: module discovery patterns (used by the plugin loader)
- `modulesDir`: directory (or comma-separated list) of local modules to load (default: `<appDir>/modules`)
- `config`: path to config file to read/write defaults (default: `<cwd>/.nxusrc`)
- `debug`: enable debug logging (defaults to true when `NODE_ENV` is not set or is `development`)
- `silent`: disable logging output
- `script`: treat the app as a CLI script (silences internal logging so your CLI output stays clean)
- `watch`: additional watch paths in development (used by the dev watcher)
- `ignore`: additional ignore paths for the watcher

## Module configuration and defaults

Modules commonly expose configuration under their config key.

- Modules built on `NxusModule` derive a config key from the class name (snake case).
- Modules can also define a static `_configName()` method to choose their config key.

Modules can provide two kinds of defaults:

- `_defaultConfig()`: defaults merged with application config when `module.config` is accessed
- `_userConfig()`: defaults persisted into the config file after first launch (useful for “write the starter config” behavior)

## Disabling modules via config

If a module class defines a static `_configName()` method (or extends `NxusModule`), Nxus can skip booting it when config contains:

```json
{
  "my_module": {
    "disabled": true
  }
}
```

This is useful for environment-specific deployments (e.g. disable schedulers in web-only environments).


