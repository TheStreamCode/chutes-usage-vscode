import test from 'node:test'
import assert from 'node:assert/strict'
import packageJson from '../../package.json'

import { EXTENSION_ID } from '../constants'
import { getCleanupTargets } from '../lifecycleTargets'

test('builds cleanup targets for Windows global storage locations', () => {
  const targets = getCleanupTargets(EXTENSION_ID, {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  })

  assert.ok(targets.includes(`C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\${EXTENSION_ID}`))
  assert.ok(targets.includes(`C:\\Users\\Mike\\AppData\\Roaming\\Code - Insiders\\User\\globalStorage\\${EXTENSION_ID}`))
})

test('returns unique cleanup targets only once', () => {
  const targets = getCleanupTargets(EXTENSION_ID, {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  })

  assert.equal(new Set(targets).size, targets.length)
})

test('keeps manifest publisher aligned with extension identity', () => {
  assert.equal(packageJson.publisher, 'mikesoft')
  assert.equal(EXTENSION_ID, `${packageJson.publisher}.${packageJson.name}`)
})
