import test from 'node:test'
import assert from 'node:assert/strict'
import * as path from 'node:path'
import packageJson from '../../package.json'

import { EXTENSION_ID } from '../constants'
import { getCleanupTargets } from '../lifecycleTargets'

test('builds cleanup targets for Windows global storage locations', () => {
  const targets = getCleanupTargets(EXTENSION_ID, {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  }, 'win32')

  assert.ok(targets.includes(`C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\${EXTENSION_ID}`))
  assert.ok(targets.includes(`C:\\Users\\Mike\\AppData\\Roaming\\Code - Insiders\\User\\globalStorage\\${EXTENSION_ID}`))
})

test('returns unique cleanup targets only once', () => {
  const targets = getCleanupTargets(EXTENSION_ID, {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  }, 'win32')

  assert.equal(new Set(targets).size, targets.length)
})

test('builds cleanup targets for Linux global storage locations', () => {
  const home = '/home/example'
  const targets = getCleanupTargets(EXTENSION_ID, { HOME: home }, 'linux')

  assert.deepEqual(targets, [
    path.join(home, '.config', 'Code', 'User', 'globalStorage', EXTENSION_ID),
    path.join(home, '.config', 'Code - Insiders', 'User', 'globalStorage', EXTENSION_ID)
  ])
})

test('builds cleanup targets for macOS global storage locations', () => {
  const home = '/Users/example'
  const targets = getCleanupTargets(EXTENSION_ID, { HOME: home }, 'darwin')

  assert.deepEqual(targets, [
    path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage', EXTENSION_ID),
    path.join(home, 'Library', 'Application Support', 'Code - Insiders', 'User', 'globalStorage', EXTENSION_ID)
  ])
})

test('keeps manifest publisher aligned with extension identity', () => {
  assert.equal(packageJson.publisher, 'mikesoft')
  assert.equal(EXTENSION_ID, `${packageJson.publisher}.${packageJson.name}`)
})
