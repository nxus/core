/*
* Logger environment behavior tests
*/

'use strict';

const {Logger} = require('../..')

describe('Logger (env behavior)', () => {
  const originalEnv = Object.assign({}, process.env)

  afterEach(() => {
    process.env = Object.assign({}, originalEnv)
  })

  it('defaults to silent during tests unless explicitly enabled', () => {
    process.env.NODE_ENV = 'test'
    delete process.env.NXUS_LOG_LEVEL
    delete process.env.NXUS_LOG_SILENT

    const log = Logger('test')
    log.level.should.equal('silent')
  })

  it('can be enabled in tests via NXUS_LOG_SILENT=0 (defaults to info)', () => {
    process.env.NODE_ENV = 'test'
    delete process.env.NXUS_LOG_LEVEL
    process.env.NXUS_LOG_SILENT = '0'

    const log = Logger('test')
    log.level.should.equal('info')
    log.log.should.be.Function()
  })

  it('respects NXUS_LOG_LEVEL override', () => {
    process.env.NODE_ENV = 'test'
    process.env.NXUS_LOG_LEVEL = 'debug'
    process.env.NXUS_LOG_SILENT = '0'

    const log = Logger('test')
    log.level.should.equal('debug')
  })
})


