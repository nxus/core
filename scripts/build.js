/* eslint-disable no-console */
/**
 * Nxus Core v5 build:
 * - dist/cjs: CommonJS runtime
 * - dist/esm: ESM runtime (scoped via dist/esm/package.json { type: "module" })
 * - dist/types: Type declarations
 */

'use strict'

const {execFileSync} = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')

function rmrf(p) {
  fs.rmSync(p, {recursive: true, force: true})
}

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true})
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8')
}

function tsc(projectPath) {
  const tscBin = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc')
  execFileSync(tscBin, ['-p', projectPath], {cwd: root, stdio: 'inherit'})
}

rmrf(distDir)

tsc(path.join(root, 'tsconfig.cjs.json'))
writeJson(path.join(root, 'dist', 'cjs', 'package.json'), {type: 'commonjs'})

tsc(path.join(root, 'tsconfig.esm.json'))
writeJson(path.join(root, 'dist', 'esm', 'package.json'), {type: 'module'})

tsc(path.join(root, 'tsconfig.types.json'))



