type ConnectionState = 'missing-key' | 'loading' | 'ready' | 'error'

type PlanInfo = {
  planName: string | null
  monthlyPriceUsd: number | null
  monthlyCapUsd: number | null
  fourHourCapUsd: number | null
  dailyRequestLimit: number | null
  paygDiscountPercent: number | null
}

type DashboardState = {
  connectionState: ConnectionState
  connected: boolean
  lastUpdatedAt: string | null
  data: {
    plan: PlanInfo | null
  } | null
  errorMessage: string | null
}

export type HeaderPresentation = {
  statusText: string
  showDot: boolean
  keyActionLabel: 'Set Key' | 'Replace Key'
  removeDisabled: boolean
}

// Derive the webview header text and actions from the authoritative dashboard state.
export function getHeaderPresentation(state: DashboardState, formatTime: (value: string) => string = defaultFormatTime): HeaderPresentation {
  const hasStoredCredentials = state.connectionState !== 'missing-key'
  const planName = state.data?.plan?.planName
  const monthlyPrice = state.data?.plan?.monthlyPriceUsd
  const timeText = state.lastUpdatedAt ? formatTime(state.lastUpdatedAt) : null

  switch (state.connectionState) {
    case 'missing-key':
      return {
        statusText: '// AWAITING API KEY',
        showDot: false,
        keyActionLabel: 'Set Key',
        removeDisabled: true
      }
    case 'loading': {
      const prefix = buildPrefix(planName, monthlyPrice)
      return {
        statusText: prefix ? `${prefix} // REFRESHING` : '// REFRESHING',
        showDot: hasStoredCredentials,
        keyActionLabel: 'Replace Key',
        removeDisabled: false
      }
    }
    case 'error': {
      const prefix = buildPrefix(planName, monthlyPrice)
      return {
        statusText: prefix ? `${prefix} // LAST SYNC FAILED` : '// LAST SYNC FAILED',
        showDot: hasStoredCredentials,
        keyActionLabel: 'Replace Key',
        removeDisabled: false
      }
    }
    case 'ready': {
      const prefix = buildPrefix(planName, monthlyPrice)
      const suffix = timeText ? `SYNCED ${timeText}` : 'CONNECTED'
      return {
        statusText: prefix ? `${prefix} // ${suffix}` : `// ${suffix}`,
        showDot: true,
        keyActionLabel: 'Replace Key',
        removeDisabled: false
      }
    }
  }
}

function buildPrefix(planName: string | null | undefined, monthlyPrice: number | null | undefined): string {
  if (planName) {
    return planName.toUpperCase()
  }

  if (monthlyPrice !== null && monthlyPrice !== undefined) {
    return `$${monthlyPrice.toFixed(0)}/MO`
  }

  return ''
}

function defaultFormatTime(value: string): string {
  return new Date(value).toLocaleTimeString()
}
