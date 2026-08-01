import test from 'node:test'
import assert from 'node:assert/strict'

import { toWebviewState } from '../state/webviewState'
import type { DashboardState } from '../types'

test('keeps states without dashboard data untouched', () => {
  const state: DashboardState = {
    connectionState: 'missing-key',
    connected: false,
    lastUpdatedAt: null,
    data: null,
    errorMessage: null
  }

  assert.equal(toWebviewState(state), state)
})

test('drops the per-model quota rows the webview never renders', () => {
  const state = createReadyState([
    { modelLabel: 'All Models', quota: 5000, lastUpdated: '2026-08-01T10:00:00.000Z' }
  ])

  const projected = toWebviewState(state)

  assert.deepEqual(projected.data?.quotas, [])
  assert.equal(projected.connectionState, state.connectionState)
  assert.equal(projected.lastUpdatedAt, state.lastUpdatedAt)
  assert.deepEqual(projected.data?.windows, state.data?.windows)
  assert.deepEqual(projected.data?.plan, state.data?.plan)
  assert.deepEqual(projected.data?.planLimits, state.data?.planLimits)
  assert.equal(projected.data?.paygCreditUsd, state.data?.paygCreditUsd)
})

test('does not copy the state when there is no quota payload to strip', () => {
  const state = createReadyState([])
  assert.equal(toWebviewState(state), state)
})

test('leaves the extension-host state object unmodified', () => {
  const state = createReadyState([{ modelLabel: 'All Models', quota: 5000, lastUpdated: null }])

  toWebviewState(state)

  assert.equal(state.data?.quotas.length, 1)
})

function createReadyState(quotas: NonNullable<DashboardState['data']>['quotas']): DashboardState {
  return {
    connectionState: 'ready',
    connected: true,
    lastUpdatedAt: '2026-08-01T10:00:00.000Z',
    data: {
      windows: [
        {
          id: 'billing',
          kind: 'billing-cycle',
          label: 'Billing Cycle Cap',
          unit: 'usd',
          used: 12.5,
          limit: 100,
          remaining: 87.5,
          percentUsed: 12.5,
          resetLabel: null
        }
      ],
      quotas,
      plan: {
        planName: 'Pro',
        monthlyPriceUsd: 20,
        monthlyCapUsd: 100,
        fourHourCapUsd: 8.3333,
        dailyRequestLimit: 5000,
        paygDiscountPercent: 10
      },
      planLimits: [],
      paygCreditUsd: 4.2
    },
    errorMessage: null
  }
}
