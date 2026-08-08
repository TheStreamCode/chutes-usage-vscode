import test from 'node:test'
import assert from 'node:assert/strict'

import { isCachedPayload, isStateMessage } from '../../webview/messages'

const readyState = {
  connectionState: 'ready',
  connected: true,
  lastUpdatedAt: '2026-08-01T06:00:00.000Z',
  data: {
    windows: [{
      id: 'billing-cycle',
      kind: 'billing-cycle',
      label: 'Billing Cycle Cap',
      unit: 'usd',
      used: 5,
      limit: 50,
      remaining: 45,
      percentUsed: 10,
      resetLabel: null
    }],
    plan: null,
    planLimits: [],
    paygCreditUsd: 12.34
  },
  errorMessage: null
}

test('accepts a complete dashboard state message', () => {
  assert.equal(isStateMessage({ type: 'state', state: readyState, refreshIntervalMs: 60_000 }), true)
})

test('rejects unknown fields at every webview message boundary', () => {
  assert.equal(isStateMessage({ type: 'state', state: readyState, unexpected: true }), false)
  assert.equal(isStateMessage({ type: 'state', state: { ...readyState, quotas: [] } }), false)
  assert.equal(isStateMessage({
    type: 'state',
    state: { ...readyState, data: { ...readyState.data, quotas: [] } }
  }), false)
  assert.equal(isStateMessage({
    type: 'state',
    state: {
      ...readyState,
      data: {
        ...readyState.data,
        windows: [{ ...readyState.data.windows[0], unexpected: true }]
      }
    }
  }), false)
  assert.equal(isStateMessage({
    type: 'state',
    state: {
      ...readyState,
      data: {
        ...readyState.data,
        plan: {
          planName: 'Pro',
          monthlyPriceUsd: 20,
          monthlyCapUsd: 100,
          fourHourCapUsd: 8.33,
          dailyRequestLimit: 5000,
          paygDiscountPercent: 10,
          unexpected: true
        }
      }
    }
  }), false)
})

test('rejects malformed dashboard values before rendering them', () => {
  const malformed = structuredClone(readyState)
  malformed.data.windows[0].used = Number.NaN

  assert.equal(isStateMessage({ type: 'state', state: malformed }), false)
  assert.equal(isStateMessage({ type: 'state', state: readyState, refreshIntervalMs: -1 }), false)
  assert.equal(isStateMessage({ type: 'refresh', state: readyState }), false)
})

test('validates cached payloads before restoring webview state', () => {
  assert.equal(isCachedPayload({ version: 3, planLimitsCollapsed: false }), true)
  assert.equal(isCachedPayload({ version: 3, planLimitsCollapsed: 'false' }), false)
  assert.equal(isCachedPayload({ version: 3, planLimitsCollapsed: false, unexpected: true }), false)
  assert.equal(isCachedPayload({ version: 2, state: readyState, planLimitsCollapsed: false }), false)
})
