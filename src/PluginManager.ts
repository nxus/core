import fs from 'node:fs'
import path from 'node:path'
import {createRequire} from 'node:module'

import multimatch from 'multimatch'
import _ from 'underscore'

type AppLike = {
  log: {debug: (...args: any[]) => void; warn: (...args: any[]) => void; error: (...args: any[]) => void}
}

type PluginInfo = {name: string; modulePath: string; isLocal: boolean}
type PluginPackage = any & {_pluginInfo?: PluginInfo; _packageJson?: any}

// Use createRequire so this file works in both CJS and ESM builds.
const requireFn = createRequire(path.join(process.cwd(), 'package.json'))

/**
 * @private
 *
 * The PluginManager handles all of the module loading. Load order is as follows:
 *
 * 1. Packages in node_modules that match the passed `namespace` config option, and packages in the `@nxus` namespace.
 * 2. Folders in the <appDir>/modules directory.
 * 3. Filepaths passed in the `modules` config option
 *
 * Note: Nxus v4 used a constructor that *returns an array* (overriding `this`).
 * We preserve that behavior for backwards compatibility.
 */
function PluginManager(this: any, app: AppLike, options: Record<string, any>) {
  this.app = app
  this.options = options = options || {}

  this._loaded = []
  this.packages = [] as PluginPackage[]

  this.loadNxusModules(options)
  this.loadAdditionalModules(options)

  return this.packages
}

/**
 * @private
 * Helper method to ensure a passed variable is an array.
 */
PluginManager.prototype._arrayify = function _arrayify(el: any) {
  if (!el) return []
  return (Array.isArray(el) ? el : [el]) as any[]
}

PluginManager.prototype.loadNxusModules = function loadNxusModules(options: Record<string, any>) {
  const nxusCorePath = `${options.nxusModulesDir || process.cwd()}/node_modules`
  const pattern = _.uniq((this._arrayify(options.namespace) as any[]).concat(['nxus-*', '!nxus-core'])) as any[]
  this._loadModulesFromDirectory(nxusCorePath, false, pattern)
}

PluginManager.prototype.loadAdditionalModules = function loadAdditionalModules(
  options: Record<string, any>
) {
  const customDir = options.modulesDir || (options.appDir || process.cwd()) + '/modules'
  const dirs: string[] = _.isArray(customDir) ? customDir : String(customDir).split(',')
  _.each(dirs, (dir: string) => {
    this._loadModulesFromDirectory(dir, true)
  })
}

/**
 * Loads all modules from directory.
 *
 * A missing module produces a warning message. Other errors produce
 * an error message and force the process to exit. (If `require()`
 * reports a subsidiary module as missing, it forces an exit; that is,
 * a missing nxus module is non-fatal, but a nxus module that is
 * missing a required module is fatal.)
 */
PluginManager.prototype._loadModulesFromDirectory = function _loadModulesFromDirectory(
  dir: string,
  isLocal: boolean,
  matches?: string[]
) {
  if (!fs.existsSync(dir)) return

  const moduleDirs = fs.readdirSync(dir)
  moduleDirs.forEach((name) => {
    if (matches) name = multimatch([name], matches)[0]
    if (!name || (name && name[0] === '.')) return

    this.app.log.debug('Loading module', name, isLocal ? '(app)' : '(dep)')
    const modulePath = path.resolve(path.join(dir, name))
    try {
      const pkg: PluginPackage = requireFn(modulePath)
      pkg._pluginInfo = {name, modulePath, isLocal}
      this.packages.push(pkg)

      // Recurse for module modules
      this._loadModulesFromDirectory(path.join(dir, name, 'modules'), isLocal)
      this._loadModulesFromDirectory(path.join(dir, name, 'lib', 'modules'), isLocal)
    } catch (e: any) {
      // kludgy message text match to distinguish subsidiary modules from primary
      if ((e.code === 'MODULE_NOT_FOUND') && String(e.message || '').includes(`'${modulePath}'`)) {
        this.app.log.warn(`Module ${name} not found (${modulePath})`)
      } else {
        this.app.log.error(`Error loading module ${name} (${modulePath})`, e)
        process.kill(process.pid, 'SIGTERM')
      }
    }
  })
}

/**
 * Loads manually passed in packages by path
 */
PluginManager.prototype.loadPassedPlugins = function loadPassedPlugins(
  options: Record<string, any>,
  packages: PluginPackage[]
) {
  const customPluginDirs: string[] = options.modules || []

  customPluginDirs.forEach((modulePath) => {
    this.app.log.debug('Loading custom module', modulePath)
    const pkg: PluginPackage = requireFn(modulePath)
    pkg._packageJson = this.getPluginPackageJson?.(modulePath)
    pkg._pluginInfo = pkg._pluginInfo || ({} as any)
    if (pkg._packageJson) pkg._pluginInfo.name = pkg._packageJson.name || null
    packages.push(pkg)
  })
}

export default PluginManager as any


