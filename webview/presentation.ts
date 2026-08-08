import type { DashboardState, UsageWindow } from './types.js'

export type HeaderPresentation = {
  statusText: string
  showDot: boolean
  keyActionLabel: 'Set Key' | 'Replace Key'
  removeDisabled: boolean
  tone: 'idle' | 'live' | 'warn' | 'error'
}

export type ProgressPresentation = {
  percentUsed: number | null
  ariaValueText: string
}

export function getProgressPresentation(window: UsageWindow): ProgressPresentation {
  const percentUsed = window.percentUsed === null
    ? null
    : Math.max(0, Math.min(window.percentUsed, 100))

  if (percentUsed === null) {
    if (window.unit === 'requests' && window.limit === 0) {
      return {
        percentUsed: null,
        ariaValueText: window.used === null
          ? 'Unlimited request quota'
          : `${formatProgressValue(window.used, window.unit)} used; unlimited request quota`
      }
    }

    return {
      percentUsed: null,
      ariaValueText: window.used === null
        ? 'Usage unavailable'
        : `${formatProgressValue(window.used, window.unit)} used; limit unavailable`
    }
  }

  const limit = window.limit === 0 && window.unit === 'requests'
    ? 'Unlimited'
    : formatProgressValue(window.limit, window.unit)

  return {
    percentUsed,
    ariaValueText: `${Math.round(percentUsed)}% used; ${formatProgressValue(window.used, window.unit)} of ${limit}`
  }
}

export function formatResetLabel(
  value: string | null,
  formatAbsoluteTime: (value: string) => string = defaultFormatResetTime
): string | null {
  if (!value) {
    return null
  }

  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) {
    return value
  }

  return `resets ${formatAbsoluteTime(value)}`
}

export function getHeaderPresentation(state: DashboardState, formatTime: (value: string) => string = defaultFormatTime): HeaderPresentation {
  const hasStoredCredentials = state.connectionState !== 'missing-key'
  const planName = state.data?.plan?.planName
  const monthlyPrice = state.data?.plan?.monthlyPriceUsd
  const timeText = state.lastUpdatedAt ? formatTime(state.lastUpdatedAt) : null

  switch (state.connectionState) {
    case 'missing-key':
      return {
        statusText: 'Awaiting API key',
        showDot: false,
        keyActionLabel: 'Set Key',
        removeDisabled: true,
        tone: 'idle'
      }
    case 'loading': {
      const prefix = buildPrefix(planName, monthlyPrice)
      return {
        statusText: prefix ? `${prefix} · refreshing` : 'Refreshing',
        showDot: hasStoredCredentials,
        keyActionLabel: 'Replace Key',
        removeDisabled: false,
        tone: 'live'
      }
    }
    case 'error': {
      const prefix = buildPrefix(planName, monthlyPrice)
      return {
        statusText: prefix ? `${prefix} · sync failed` : 'Sync failed',
        showDot: hasStoredCredentials,
        keyActionLabel: 'Replace Key',
        removeDisabled: false,
        tone: 'error'
      }
    }
    case 'ready': {
      const prefix = buildPrefix(planName, monthlyPrice)
      const suffix = timeText ? `updated ${timeText}` : 'connected'
      return {
        statusText: prefix ? `${prefix} · ${suffix}` : suffix.charAt(0).toUpperCase() + suffix.slice(1),
        showDot: true,
        keyActionLabel: 'Replace Key',
        removeDisabled: false,
        tone: 'live'
      }
    }
  }
}

function buildPrefix(planName: string | null | undefined, monthlyPrice: number | null | undefined): string {
  if (planName) {
    return planName
  }

  if (monthlyPrice !== null && monthlyPrice !== undefined) {
    return `$${monthlyPrice.toFixed(0)}/mo`
  }

  return ''
}

function formatProgressValue(value: number | null, unit: UsageWindow['unit']): string {
  if (value === null) return '—'
  if (unit === 'requests') return Math.round(value).toLocaleString('en-US')
  return `$${value.toFixed(2)}`
}

function defaultFormatTime(value: string): string {
  return new Date(value).toLocaleTimeString()
}

function defaultFormatResetTime(value: string): string {
  return new Date(value).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
