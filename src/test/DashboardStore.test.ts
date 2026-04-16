import test from 'node:test'
import assert from 'node:assert/strict'
import packageJson from '../../package.json'

import { DashboardStore } from '../state/DashboardStore'
import { SecretStore } from '../services/SecretStore'

test('passes debug logger to the client only when debug logging is enabled', async () => {
  let disabledMessage: string | null = null
  let enabledMessage: string | null = null

  const secretStore = {
    getApiKey: async () => 'test-key'
  } as SecretStore

  class TestDashboardStore extends DashboardStore {
    public isDebugLoggingEnabled(): boolean {
      return this.debugLoggingEnabled()
    }

    public emitDebugLog(message: string): void {
      this.debugLog(message)
    }
  }

  const disabledStore = new TestDashboardStore(secretStore, {
    debugLoggingEnabled: () => false,
    log: (message: string) => {
      disabledMessage = message
    }
  })
  assert.equal(disabledStore.isDebugLoggingEnabled(), false)
  disabledStore.emitDebugLog('disabled')
  assert.equal(disabledMessage, null)

  const enabledStore = new TestDashboardStore(secretStore, {
    debugLoggingEnabled: () => true,
    log: (message: string) => {
      enabledMessage = message
    }
  })
  assert.equal(enabledStore.isDebugLoggingEnabled(), true)
  enabledStore.emitDebugLog('enabled')
  assert.equal(enabledMessage, 'enabled')
})

test('registers commands used by the status bar and debug output flow', () => {
  const commands = packageJson.contributes.commands.map((entry) => entry.command)

  assert.ok(commands.includes('chutesUsage.openDashboard'))
  assert.ok(commands.includes('chutesUsage.openLogs'))
})
