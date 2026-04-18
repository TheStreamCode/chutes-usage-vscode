import test from 'node:test'
import assert from 'node:assert/strict'

import { formatResetLabel, getHeaderPresentation } from '../../webview/presentation'
import type { DashboardState } from '../types'

test('keeps key management actions available when the dashboard is in error with stale data', () => {
  const presentation = getHeaderPresentation(createState({
    connectionState: 'error',
    connected: false,
    lastUpdatedAt: '2026-04-16T10:11:12.000Z',
    data: {
      windows: [],
      quotas: [],
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

  assert.equal(presentation.statusText, 'PRO // SYNC FAILED')
  assert.equal(presentation.keyActionLabel, 'Replace Key')
  assert.equal(presentation.removeDisabled, false)
})

test('shows onboarding actions only when the API key is actually missing', () => {
  const presentation = getHeaderPresentation(createState())

  assert.equal(presentation.statusText, '// AWAITING API KEY')
  assert.equal(presentation.keyActionLabel, 'Set Key')
  assert.equal(presentation.removeDisabled, true)
})

test('shows the last synced time when the dashboard is ready', () => {
  const presentation = getHeaderPresentation(createState({
    connectionState: 'ready',
    connected: true,
    lastUpdatedAt: '2026-04-16T10:11:12.000Z',
    data: {
      windows: [],
      quotas: [],
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

  assert.equal(presentation.statusText, '$20/MO // updated 10:11:12')
  assert.equal(presentation.showDot, true)
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
