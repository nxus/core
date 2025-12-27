import rc from 'rc'

/**
 * @private
 * ConfigurationManager loads the internal app.config hash using the following order (each overwrites any values of the previous):
 * 1. Opts loaded into the application object.
 * 2. Opts in the `config` hash of the project package.json file
 * 3. Any environment variables
 */
export default class ConfigurationManager {
  opts: Record<string, any>

  constructor(opts: Record<string, any> = {}) {
    this.opts = opts
  }

  /**
   * Returns the current NODE_ENV
   */
  getNodeEnv() {
    return this.opts.env || process.env.NODE_ENV || 'dev'
  }

  /**
   * @private
   * Gets the local rc config
   */
  _rcConfig() {
    return rc(this.opts.namespace, {})
  }

  /**
   * Extracts the currently available environment variables
   */
  getEnvironmentVariables() {
    return process.env
  }

  /**
   * Returns the final config option using the loading order described above.
   */
  getConfig() {
    return Object.assign(
      this._rcConfig(),
      this.getEnvironmentVariables(),
      {NODE_ENV: this.getNodeEnv()}
    )
  }
}


