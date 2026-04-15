import test from 'node:test'
import assert from 'node:assert/strict'

import { getCleanupTargets } from '../lifecycleTargets'

test('builds cleanup targets for Windows global storage locations', () => {
  const targets = getCleanupTargets('mikesoftit.chutes-usage', {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  })

  assert.ok(targets.includes('C:\\Users\\Mike\\AppData\\Roaming\\Code\\User\\globalStorage\\mikesoftit.chutes-usage'))
  assert.ok(targets.includes('C:\\Users\\Mike\\AppData\\Roaming\\Code - Insiders\\User\\globalStorage\\mikesoftit.chutes-usage'))
})

test('returns unique cleanup targets only once', () => {
  const targets = getCleanupTargets('mikesoftit.chutes-usage', {
    APPDATA: 'C:\\Users\\Mike\\AppData\\Roaming',
    HOME: 'C:\\Users\\Mike'
  })

  assert.equal(new Set(targets).size, targets.length)
})
