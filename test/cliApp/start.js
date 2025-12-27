#!/usr/bin/env node
'use strict'

/**
 * CLI smoke-test app for Nxus Core.
 *
 * Run from repo root:
 *   NODE_ENV=development node test/cliApp/start.js
 *
 * Or from this folder (so rc picks up local .nxusrc):
 *   cd test/cliApp && NODE_ENV=development node start.js
 */

const path = require('node:path')

const {application} = require('../..')

async function main() {
  const appDir = __dirname
  await application.start({
    appName: 'nxus-core-cli-smoke',
    appDir,
    modulesDir: path.join(appDir, 'modules'),
    debug: true,
    silent: false,
    script: false,
  })

  // Exit explicitly so this is usable as a quick CLI check.
  process.exit(0)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})



