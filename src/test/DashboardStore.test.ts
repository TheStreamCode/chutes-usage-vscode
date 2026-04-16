import test from 'node:test'
import assert from 'node:assert/strict'
import packageJson from '../../package.json'

import { DASHBOARD_VIEW_ID, VIEW_CONTAINER_ID } from '../constants'
import { DashboardStore } from '../state/DashboardStore'
import { ChutesApiClient } from '../services/ChutesApiClient'
import type { SecretStore } from '../services/SecretStore'
import type { JsonObject } from '../types'

test('registers commands used by the renamed extension shell', () => {
  const commands = packageJson.contributes.commands.map((entry) => entry.command)

  assert.ok(commands.includes('chutesUsageVscode.openDashboard'))
  assert.ok(commands.includes('chutesUsageVscode.refresh'))
  assert.ok(commands.includes('chutesUsageVscode.setApiKey'))
  assert.ok(commands.includes('chutesUsageVscode.removeApiKey'))
})

test('uses the correct built-in focus command for the custom activity bar container', () => {
  assert.equal(`workbench.view.extension.${VIEW_CONTAINER_ID}`, 'workbench.view.extension.chutesUsageVscode')
  assert.equal(DASHBOARD_VIEW_ID, 'chutesUsageVscode.dashboard')
})

test('keeps the newest dashboard snapshot when an older refresh finishes last', async () => {
  const originalGetDashboardPayload = ChutesApiClient.prototype.getDashboardPayload
  const firstResponse = createDeferred<DashboardPayload>()
  const keyRef: { value: string | undefined } = { value: 'test-key' }
  const store = new DashboardStore(createSecretStore(keyRef))
  let callCount = 0

  ChutesApiClient.prototype.getDashboardPayload = async function (): Promise<DashboardPayload> {
    callCount += 1
    if (callCount === 1) {
      return firstResponse.promise
    }

    return createDashboardPayload({ monthlyPriceUsd: 20, billingUsedUsd: 12 })
  }

  try {
    const firstRefresh = store.refresh()
    await Promise.resolve()

    const secondRefresh = store.refresh()
    await secondRefresh

    assert.equal(store.getState().data?.plan?.monthlyPriceUsd, 20)

    firstResponse.resolve(createDashboardPayload({ monthlyPriceUsd: 3, billingUsedUsd: 55 }))
    await firstRefresh

    assert.equal(store.getState().data?.plan?.monthlyPriceUsd, 20)
    assert.equal(store.getState().data?.windows[0]?.used, 12)
  } finally {
    ChutesApiClient.prototype.getDashboardPayload = originalGetDashboardPayload
  }
})

test('returns to missing-key when the stored API key disappears during a refresh', async () => {
  const originalGetDashboardPayload = ChutesApiClient.prototype.getDashboardPayload
  const pendingResponse = createDeferred<DashboardPayload>()
  const keyRef: { value: string | undefined } = { value: 'test-key' }
  const store = new DashboardStore(createSecretStore(keyRef))

  ChutesApiClient.prototype.getDashboardPayload = async function (): Promise<DashboardPayload> {
    return pendingResponse.promise
  }

  try {
    const refreshPromise = store.refresh()
    await Promise.resolve()

    keyRef.value = undefined
    pendingResponse.resolve(createDashboardPayload({ monthlyPriceUsd: 10, billingUsedUsd: 5 }))
    await refreshPromise

    assert.deepEqual(store.getState(), {
      connectionState: 'missing-key',
      connected: false,
      lastUpdatedAt: null,
      data: null,
      errorMessage: null
    })
  } finally {
    ChutesApiClient.prototype.getDashboardPayload = originalGetDashboardPayload
  }
})

type DashboardPayload = Awaited<ReturnType<ChutesApiClient['getDashboardPayload']>>

// Build a minimal secret store for DashboardStore tests without touching VS Code APIs.
function createSecretStore(keyRef: { value: string | undefined }): SecretStore {
  return {
    getApiKey: async () => keyRef.value
  } as SecretStore
}

// Create a minimal dashboard payload that exercises the refresh state machine.
function createDashboardPayload({ monthlyPriceUsd, billingUsedUsd }: { monthlyPriceUsd: number; billingUsedUsd: number }): DashboardPayload {
  const subscriptionUsage: JsonObject = {
    subscription: true,
    custom: false,
    monthly_price: monthlyPriceUsd,
    billing_cycle_cap: {
      used: billingUsedUsd,
      limit: 100,
      remaining: Math.max(100 - billingUsedUsd, 0),
      label: 'Billing Cycle Cap'
    }
  }

  return {
    subscriptionUsage,
    quotas: [],
    quotaUsageMe: null,
    quotaUsageFallback: null,
    invocationStatsLlm: null,
    pricing: null
  }
}

// Create a deferred promise so tests can control which refresh resolves first.
function createDeferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (reason?: unknown) => void } {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })

  return { promise, resolve, reject }
}
