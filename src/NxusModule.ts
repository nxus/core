import morph from 'morph'
import path from 'node:path'
import stackTrace from 'stack-trace'
import deepExtend from 'deep-extend'

import {application} from './Application'
import Logger from './Logger'

function __dirName(constructorName: string) {
  for (const site of stackTrace.get()) {
    if (site.getFunctionName() == constructorName) {
      return path.dirname(site.getFileName())
    }
  }
}

/**
 * The NxusModule class is a base class for all Nxus modules.
 *
 * Nxus modules commonly subclass this and implement `_defaultConfig()` and/or `_userConfig()`.
 *
 * @property config The application configuration for this module (merged from defaults and app config).
 * @property log The logger for the module.
 */
export default class NxusModule {
  __name: string
  __config_name: string
  log: any
  _dirName: string | undefined
  __proxy: any
  _config?: any

  constructor(app?: any) {
    this.__name = (this.constructor as any)._moduleName()
    this.__config_name = (this.constructor as any)._configName()
    this.log = Logger(this.__name)

    const userConfig = this._userConfig()
    if (userConfig !== null) {
      application.setUserConfig(this.__config_name, userConfig)
    }

    this._dirName = __dirName((this.constructor as any).name)

    this.__proxy = application.get(this.__name)
    this.__proxy.use(this)
  }

  get config() {
    const _defaultConfig = this._defaultConfig() || {}
    if (!this._config) {
      this._config = Object.assign({}, deepExtend(_defaultConfig, application.config[this.__config_name]))
    }
    return this._config
  }

  set config(val: any) {
    this._config = val
  }

  _defaultConfig() {
    return null
  }

  _userConfig() {
    return null
  }

  static __appRef() {
    return application
  }

  static _configName() {
    return morph.toSnake((this as any).name)
  }

  static _moduleName() {
    return morph.toDashed((this as any).name)
  }

  static getProxy() {
    return application.get((this as any)._moduleName())
  }

  deregister() {
    this.__proxy.deregister()
  }
}


