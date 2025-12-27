'use strict'

const {NxusModule} = require('../../../..')

/**
 * Minimal local Nxus module used by the CLI smoke app.
 * Demonstrates plugin discovery + event registration.
 */
module.exports = class HelloModule extends NxusModule {
  constructor(app) {
    super(app)

    this.respond('hello', (name = 'world') => {
      this.log.info({name}, 'hello called')
      return `hello ${name}`
    })

    this.on('startup', async () => {
      this.log.info('HelloModule startup')
    })
  }
}



