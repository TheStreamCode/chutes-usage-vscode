import test from 'node:test'
import assert from 'node:assert/strict'

import { formatResetLabel, getHeaderPresentation, getProgressPresentation } from '../../webview/presentation'
import type { DashboardState, UsageWindow } from '../types'

test('keeps key management actions available when the dashboard is in error with stale data', () => {
  const presentation = getHeaderPresentation(createState({
    connectionState: 'error',
    connected: false,
    lastUpdatedAt: '2026-04-16T10:11:12.000Z',
    data: {
      windows: [],
      quotas: [],
      planLimits: [],
      paygCreditUsd: null,
      plan: {
        planName: 'Pro',
        monthlyPriceUsd: 20,
        monthlyCapUsd: 100,
        fourHourCapUsd: 8.33,
        dailyRequestLimit: 5000,
        paygDiscountPercent: 10
      }
    },
    errorMessage: 'Request failed with status 401'
  }), () => '10:11:12')

  assert.equal(presentation.statusText, 'Pro · sync failed')
  assert.equal(presentation.keyActionLabel, 'Replace Key')
  assert.equal(presentation.removeDisabled, false)
  assert.equal(presentation.tone, 'error')
})

test('shows onboarding actions only when the API key is actually missing', () => {
  const presentation = getHeaderPresentation(createState())

  assert.equal(presentation.statusText, 'Awaiting API key')
  assert.equal(presentation.keyActionLabel, 'Set Key')
  assert.equal(presentation.removeDisabled, true)
  assert.equal(presentation.tone, 'idle')
})

test('shows the last synced time when the dashboard is ready', () => {
  const presentation = getHeaderPresentation(createState({
    connectionState: 'ready',
    connected: true,
    lastUpdatedAt: '2026-04-16T10:11:12.000Z',
    data: {
      windows: [],
      quotas: [],
      planLimits: [],
      paygCreditUsd: null,
      plan: {
        planName: null,
        monthlyPriceUsd: 20,
        monthlyCapUsd: 100,
        fourHourCapUsd: 8.33,
        dailyRequestLimit: 5000,
        paygDiscountPercent: null
      }
    },
    errorMessage: null
  }), () => '10:11:12')

  assert.equal(presentation.statusText, '$20/mo · updated 10:11:12')
  assert.equal(presentation.showDot, true)
  assert.equal(presentation.tone, 'live')
})

test('keeps the title in natural case without monospace divider prefix', () => {
  const presentation = getHeaderPresentation(createState({ connectionState: 'loading' }))

  assert.doesNotMatch(presentation.statusText, /\/\//)
  assert.equal(presentation.tone, 'live')
})

test('formats reset timestamps into clearer short labels', () => {
  const formatted = formatResetLabel('2026-04-16T02:00:00+02:00', (value: string) => {
    const date = new Date(value)
    return `16 Apr, ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    })}`
  })

  assert.equal(formatted, 'resets 16 Apr, 00:00')
})

test('keeps explanatory reset labels readable', () => {
  assert.equal(formatResetLabel('Possible sync delay'), 'Possible sync delay')
})

test('announces a known progress value with its verified usage and limit', () => {
  const presentation = getProgressPresentation(createWindow({
    used: 21.2,
    limit: 50,
    percentUsed: 42.4
  }))

  assert.deepEqual(presentation, {
    percentUsed: 42.4,
    ariaValueText: '42% used; $21.20 of $50.00'
  })
})

test('omits the numeric progress value when the percentage is unknown', () => {
  assert.deepEqual(getProgressPresentation(createWindow({
    unit: 'requests',
    used: 3,
    limit: null,
    percentUsed: null
  })), {
    percentUsed: null,
    ariaValueText: '3 used; limit unavailable'
  })

  assert.equal(getProgressPresentation(createWindow()).ariaValueText, 'Usage unavailable')
})

test('announces an unlimited request quota without inventing a percentage', () => {
  assert.deepEqual(getProgressPresentation(createWindow({
    unit: 'requests',
    used: 8,
    limit: 0,
    percentUsed: null
  })), {
    percentUsed: null,
    ariaValueText: '8 used; unlimited request quota'
  })
})

test('clamps progress percentages to the ARIA range', () => {
  assert.equal(getProgressPresentation(createWindow({ percentUsed: 140 })).percentUsed, 100)
  assert.equal(getProgressPresentation(createWindow({ percentUsed: -10 })).percentUsed, 0)
})

// Build a minimal dashboard state for presentation tests.
function createState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    connectionState: 'missing-key',
    connected: false,
    lastUpdatedAt: null,
    data: null,
    errorMessage: null,
    ...overrides
  }
}

function createWindow(overrides: Partial<UsageWindow> = {}): UsageWindow {
  return {
    id: 'billing',
    kind: 'billing-cycle',
    label: 'Billing Cycle Cap',
    unit: 'usd',
    used: null,
    limit: null,
    remaining: null,
    percentUsed: null,
    resetLabel: null,
    ...overrides
  }
}
