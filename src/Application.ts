import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'

import _ from 'underscore'
import deepExtend from 'deep-extend'

import Dispatcher from './Dispatcher'
import ModuleProxy from './ModuleProxy'
import PluginManager from './PluginManager'
import ConfigurationManager from './ConfigurationManager'
import Watcher from './Watcher'
import {logger} from './Logger'
import {pMapSeries} from './promiseUtils'

const requireFn = createRequire(path.join(process.cwd(), 'package.json'))

const _userConfigDefaults = {
  siteName: 'Nxus App',
  host: 'localhost',
  baseUrl: 'localhost:3001',
}

const _defaultConfig = {
  appName: 'App',
  namespace: 'nxus',
  appDir: process.cwd(),
  config: process.cwd() + '/.nxusrc',
}

_.mixin(requireFn('underscore.deep'))

function safeReadJson(filePath: string) {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (e) {
    return null
  }
}

function stableHash(input: string) {
  // Simple stable non-crypto hash (djb2-ish) for deterministic “randomness”.
  let h = 5381
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i)
  }
  return h >>> 0
}

function pickTagline(seed: string, kind: 'start' | 'ready') {
  const startLines = [
    'Summoning modules…',
    'Warming up the event loop…',
    'Charging the promise cannons…',
    'Reticulating splines…',
    'Spinning up tiny gears…',
    'Assembling boot sequence…',
  ]
  const readyLines = [
    'All systems nominal.',
    'Modules assembled. Let’s go.',
    'Boot sequence complete.',
    'Event loop engaged.',
    'Ready for requests.',
  ]
  const lines = kind === 'start' ? startLines : readyLines
  return lines[stableHash(seed) % lines.length]
}

function supportsColor() {
  if (process.env.NO_COLOR) return false
  if (process.env.NXUS_BANNER_COLOR === '0') return false
  return Boolean(process.stdout && process.stdout.isTTY)
}

// ANSI color helpers
function teal(s: string) { return `\x1b[38;2;45;212;191m${s}\x1b[0m` }
function violet(s: string) { return `\x1b[38;2;167;139;250m${s}\x1b[0m` }
function emerald(s: string) { return `\x1b[38;2;52;211;153m${s}\x1b[0m` }
function cyan(s: string) { return `\x1b[96m${s}\x1b[0m` }
function green(s: string) { return `\x1b[92m${s}\x1b[0m` }
function gray(s: string) { return `\x1b[90m${s}\x1b[0m` }
function bold(s: string) { return `\x1b[1m${s}\x1b[0m` }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m` }

function createStartupBanner(appName: string, version: string | undefined, env: string, nodeVer: string, tagline: string): string {
  const useColor = supportsColor() && process.env.NXUS_BANNER_COLOR !== '0'
  
  if (!useColor) {
    return [
      '',
      '╭─────────────────────────────────────────────────────╮',
      '│ ✨ NXUS CORE                                        │',
      `│ ${tagline.padEnd(51)}│`,
      '│                                                     │',
      `│ ${appName}${version ? ` v${version}` : ''}`.padEnd(53) + '│',
      `│ Node ${nodeVer} • ${env}`.padEnd(53) + '│',
      '╰─────────────────────────────────────────────────────╯',
      ''
    ].join('\n')
  }
  
  // Artistic colored version (compact box with gradient accents)
  const versionStr = version ? dim(` v${version}`) : ''
  return [
    '',
    teal('╭─') + gray('─'.repeat(51)) + teal('─╮'),
    teal('│') + ' ' + bold(teal('✨ NXUS CORE')) + ' '.repeat(39) + teal('│'),
    teal('│') + ' ' + violet(tagline) + ' '.repeat(51 - tagline.length) + teal('│'),
    teal('│') + ' '.repeat(53) + teal('│'),
    teal('│') + ' ' + cyan(appName) + versionStr + ' '.repeat(51 - appName.length - (version ? version.length + 2 : 0)) + teal('│'),
    teal('│') + ' ' + gray(`Node ${nodeVer} • ${env}`) + ' '.repeat(51 - `Node ${nodeVer} • ${env}`.length) + teal('│'),
    teal('╰') + gray('─'.repeat(53)) + teal('╯'),
    ''
  ].join('\n')
}

function createReadyBanner(appName: string, durationMs: number, modulesLoaded: number): string {
  const useColor = supportsColor() && process.env.NXUS_BANNER_COLOR !== '0'
  const durationSec = (durationMs / 1000).toFixed(2)
  const moduleLabel = modulesLoaded === 1 ? 'module' : 'modules'
  
  if (!useColor) {
    return [
      '',
      '╭─────────────────────────────────────────────────────╮',
      '│ 🚀 NXUS READY                                       │',
      `│ ${appName} is live!`.padEnd(53) + '│',
      `│ ${durationSec}s • ${modulesLoaded} ${moduleLabel}`.padEnd(53) + '│',
      '╰─────────────────────────────────────────────────────╯',
      ''
    ].join('\n')
  }
  
  // Artistic colored version
  const liveMsg = `${bold(green(appName))} ${emerald('is live!')}`
  const stats = gray(`${durationSec}s • ${modulesLoaded} ${moduleLabel}`)
  return [
    '',
    emerald('╭─') + gray('─'.repeat(51)) + emerald('─╮'),
    emerald('│') + ' ' + bold(emerald('🚀 NXUS READY')) + ' '.repeat(38) + emerald('│'),
    emerald('│') + ' ' + liveMsg + ' '.repeat(51 - appName.length - ' is live!'.length) + emerald('│'),
    emerald('│') + ' ' + stats + ' '.repeat(51 - `${durationSec}s • ${modulesLoaded} ${moduleLabel}`.length) + emerald('│'),
    emerald('╰') + gray('─'.repeat(53)) + emerald('╯'),
    ''
  ].join('\n')
}

/**
 * The Core Application class.
 *
 * ### Configuration Options
 *
 * Available options are:
 *
 * | Name | Description |
 * | --- | --- |
 * | appName | the name of your app. Will be used for console logging. |
 * | appDir | the location to use to load the default 'package.json' file. |
 * | namespace | any additional namespaces to use to load modules in the node_modules folder. Can be a string or array of strings. |
 * | modules | an array of paths to require into the application |
 * | debug | Boolean to display debug messages, including startup summary |
 * | script | Boolean to indicate the application is a CLI script, silences all logging/output messages except for explicit console.log calls |
 * | silent | Don't show any console output. Useful for CLI scripts. |
 */
export default class Application extends Dispatcher {
  _opts: Record<string, any>
  _modules: any[]
  _moduleProxies: Record<string, any>
  _pluginInfo: Record<string, any>
  _pluginInstances: Record<string, any>
  _currentStage: string | null
  _appWatcher: any
  _userConfig: Record<string, any>
  config: Record<string, any>
  _bootEvents: string[]
  registeredModules: Record<string, boolean>
  log: any
  private _startTime: {at: Date; hr: bigint}

  constructor(opts: Record<string, any> = {}) {
    super()
    this._opts = opts
    this._modules = []
    this._moduleProxies = {}
    this._pluginInfo = {}
    this._pluginInstances = {}
    this._currentStage = null
    this._appWatcher = null
    this._userConfig = {}
    this.config = {}
    this._startTime = {at: new Date(), hr: 0n}

    this._bootEvents = ['init', 'load', 'startup', 'launch']

    this._setupLog()

    this.after('launch', () => {
      this._writeConfig()
    })

    this.registeredModules = {}
    this.on('registeredModule', (name: string) => {
      this.registeredModules[name] = true
    })
  }

  private _getStartupInfo(startAt: Date) {
    const appDir = this.config.appDir || process.cwd()
    const appPkg = safeReadJson(path.join(appDir, 'package.json'))

    let corePkg: any = null
    try {
      corePkg = requireFn('nxus-core/package.json')
    } catch (e) {
      // ignore: not resolvable in some embed/monorepo cases
    }

    return {
      startAt: startAt.toISOString(),
      app: {
        name: this.config.appName || appPkg?.name,
        version: appPkg?.version,
        dir: appDir,
      },
      nxusCore: {
        version: corePkg?.version,
      },
      runtime: {
        node: process.version,
        pid: process.pid,
        ppid: process.ppid,
        platform: process.platform,
        arch: process.arch,
        uptimeSec: Math.round(process.uptime() * 1000) / 1000,
        env: process.env.NODE_ENV,
      },
      config: {
        namespace: this.config.namespace,
        host: this.config.host,
        baseUrl: this.config.baseUrl,
      },
    }
  }

  private _shouldShowBanner(): boolean {
    // Suppress banners in test mode by default (unless NXUS_BANNER=1 to force-enable)
    if (process.env.NODE_ENV === 'test' && process.env.NXUS_BANNER !== '1') {
      return false
    }
    return true
  }

  private _logStartup(startAt: Date) {
    const info = this._getStartupInfo(startAt)
    
    if (this._shouldShowBanner()) {
      const seed = `${info.app.name || 'app'}:${info.runtime.env || ''}:${info.runtime.node}`
      const tagline = pickTagline(seed, 'start')
      
      // Print banner directly to stdout so it doesn't get wrapped by pino-pretty
      const banner = createStartupBanner(
        info.app.name || 'App',
        info.app.version,
        info.runtime.env || 'unknown',
        info.runtime.node,
        tagline
      )
      console.log(banner)
    }
    
    // Log structured metadata at debug level
    this.log.debug({startup: info}, 'Nxus startup info')
  }

  private _logStarted(startAt: Date, durationMs: number) {
    const info = this._getStartupInfo(startAt)
    const dur = Math.round(durationMs * 1000) / 1000
    const modulesLoaded = this._modules?.length ?? 0
    
    if (this._shouldShowBanner()) {
      // Print ready banner directly to stdout
      const banner = createReadyBanner(info.app.name || 'App', dur, modulesLoaded)
      console.log(banner)
    }
    
    // Log structured metadata at debug level
    this.log.debug(
      {
        startup: {
          ...info,
          durationMs: dur,
          modulesLoaded,
        },
      },
      'Nxus started details'
    )
  }

  /**
   * Sets up the internal config
   *
   * @private
   */
  private async _setupConfig() {
    this.setUserConfig(null, _userConfigDefaults)

    let config: any = await this.emit('config')
    if (config === undefined) config = {}
    if (_.isArray(config)) {
      config = deepExtend({}, ...config)
    }

    this.config = Object.assign(this.config, _defaultConfig)
    this.config = Object.assign(this.config, new ConfigurationManager(this.config).getConfig())
    this.config = deepExtend(this.config, config, this._opts)
    if (typeof this.config.debug === 'undefined') {
      this.config.debug = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'
    }
  }

  /**
   * Sets up the internal log object. Falls back to console.log.
   *
   * @private
   */
  private _setupLog() {
    if (this.config.silent || this.config.script) {
      this.log = function () {}
      Object.assign(this.log, {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
      })
    } else {
      this.log = logger
    }
  }

  /**
   * Loads the internal _modules object by instantiating the PluginManager.
   *
   * @private
   */
  private _setupPluginManager() {
    // PluginManager preserves legacy behavior: `new PluginManager()` returns an array
    this._modules = new (PluginManager as any)(this, this.config)
    this._modules.forEach((plugin: any) => {
      this._pluginInfo[plugin._pluginInfo.name] = plugin._pluginInfo
    })
  }

  /**
   * Returns a {@link ModuleProxy} for the given module name.
   *
   * The proxy provides the primary integration surface between modules (provide/request/respond/gather).
   */
  get(name: string) {
    if (!this._moduleProxies[name]) {
      this._moduleProxies[name] = new (ModuleProxy as any)(this, name)
    }
    return this._moduleProxies[name]
  }

  /**
   * @private
   * Boots the application, cycling through the internal boot stages.
   */
  private _boot() {
    if (this.config.debug) this.log.info('Booting Application')
    return pMapSeries(this._bootEvents, async (e) => {
      this._currentStage = e
      if (this.config.debug) this.log.info(`Booting Stage: ${e}`)
      return this.emit(e)
    })
  }

  /**
   * Stops the currently running application.
   */
  stop() {
    if (this.config.debug) this.log.info('Stopping')
    return this.emit('stop')
  }

  /**
   * Starts the Nxus application.
   *
   * @param opts Config to deeply merge with default and rc configs
   * @returns Resolves when the boot sequence is complete
   */
  async start(opts: Record<string, any> = {}) {
    this._startTime = {at: new Date(), hr: process.hrtime.bigint()}

    // Ensure runtime opts are included before config/log setup.
    this._opts = deepExtend(this._opts, opts)

    await this._setupConfig()
    this._setupLog()

    if (!this.config.silent && !this.config.script) {
      this._logStartup(this._startTime.at)
    }

    // Register ready banner to fire after launch completes
    this.onceAfter('launch', () => {
      const durationMs = Number(process.hrtime.bigint() - this._startTime.hr) / 1e6
      if (!this.config.silent && !this.config.script) {
        this._logStarted(this._startTime.at, durationMs)
      }
    })

    this._pluginInstances = {}
    await this._loadPlugins()
    await this._boot()

    if (!this._appWatcher && !this.config.script && this.config.NODE_ENV != 'production') {
      this.log.debug('Setting up App watcher')
      this._appWatcher = new Watcher(this, this._getWatchPaths(), 'change', this._getAppIgnorePaths())
    }
  }

  /**
   * Restarts the Nxus application.
   *
   * In development mode, this is typically triggered by the {@link Watcher}.
   */
  async restart() {
    this._currentStage = 'restarting'
    this.log.info('Restarting App')
    await this._invalidateLocalModules()
    await this.stop()
    await this.start()
  }

  setUserConfig(name: string | null, opts: any) {
    if (name && name != '') {
      this._userConfig[name] = _.deepClone(opts)
      if (!this.config[name]) this.config[name] = opts
    } else {
      Object.assign(this._userConfig, opts)
      Object.assign(this.config, opts)
    }
  }

  private _writeConfig() {
    if (!this.config.config) return
    const configFile = this.config.config
    let config: any = {}
    try {
      if (fs.existsSync(configFile)) config = JSON.parse(fs.readFileSync(configFile, 'utf8'))
    } catch (e) {
      config = {}
    }
    _.each(this._userConfig, (value: any, key: any) => {
      if (!config[key]) {
        config[key] = value
      }
    })
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2))
  }

  /**
   * Invalidates the internal require plugin cache, ensuring all plugins are reloaded from the files.
   * Only applies to local app modules, not dependencies in node_modules.
   */
  private _invalidateLocalModules() {
    const localModulePaths: string[] = []
    for (const m of this._modules) {
      if (m._pluginInfo.isLocal && this._pluginInstances[m._pluginInfo.name]?.deregister) {
        localModulePaths.push(m._pluginInfo.modulePath)
        this._pluginInstances[m._pluginInfo.name].deregister()
      }
    }
    return new Promise<void>((resolve) => {
      const invalid = new RegExp('^.*(' + localModulePaths.join('|') + ').*.js')
      if (localModulePaths.length == 0) return resolve()
      _.each((requireFn as any).cache, (v: any, k: string) => {
        if (invalid.test(k)) {
          delete (requireFn as any).cache[k]
        }
      })
      resolve()
    })
  }

  /**
   * Returns an array of watch paths, either as defined by `config.watch` or the default paths.
   */
  private _getWatchPaths() {
    const watch = ['**/node_modules/**', '**/modules/**']
    if (_.isString(this.config.watch)) this.config.watch = [this.config.watch]
    return watch.concat(this.config.watch || [])
  }

  /**
   * Returns an array of paths to ignore, used by the watcher.
   */
  private _getAppIgnorePaths() {
    const opts = this.config.ignore || []
    return opts.concat(['**/.git/**', '**.ejs'])
  }

  /**
   * Loads the plugins, then boots them and handles any errors.
   */
  private async _loadPlugins() {
    this.log.info('Loading modules')
    this._setupPluginManager()
    try {
      await this._bootPlugins()
    } catch (err) {
      if (err) this.log.error(err)
    }
  }

  /**
   * Iterates through all loaded plugins, instantiating them and returning a promise once every plugin has successfully started.
   */
  private async _bootPlugins() {
    try {
      await Promise.all(this._modules.map((m) => this._bootPlugin(m)))
    } catch (e) {
      this.log.error('Error booting module', e)
      this.log.error((e as any)?.stack)
    }
  }

  /**
   * Accepts an instantiable object (function or class) as a plugin, then boots it.
   */
  private _bootPlugin(plugin: any) {
    const name = plugin._pluginInfo.name
    const modulePath = plugin._pluginInfo.modulePath

    if (this._pluginInstances[name] !== undefined) {
      this.log.error('Duplicate module found', name)
      process.exit()
    }

    if (plugin.default) plugin = plugin.default

    if (plugin.__appRef && plugin.__appRef() !== this) {
      this.log.error('Separate Nxus Core module detected in', name)
      process.exit()
    }

    const configName = plugin._configName?.()
    if (configName && this.config[configName] && this.config[configName].disabled) {
      this.log.debug('Not booting Module', name)
      return Promise.resolve()
    }

    try {
      this.log.debug('Booting Module', name)
      const pluginInstance = new plugin(this)
      this._pluginInstances[name] = pluginInstance
      return Promise.resolve(pluginInstance)
    } catch (e: any) {
      this.log.error('Error booting module ' + name + ' from ' + modulePath, e)
      this.log.error(e?.stack)
      process.exit()
    }
  }
}

export const application = new Application()


