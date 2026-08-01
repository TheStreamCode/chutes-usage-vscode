// KEEP IN SYNC WITH src/types.ts — the webview bundle compiles separately
// from the extension host and intentionally has no dependency on VS Code APIs.
export type ConnectionState = 'missing-key' | 'loading' | 'ready' | 'error'
export type UsageWindowKind = 'billing-cycle' | 'rolling-4h' | 'daily-requests' | 'weekly' | 'unknown'

export type UsageWindow = {
  id: string
  kind: UsageWindowKind
  label: string
  unit: 'usd' | 'requests'
  used: number | null
  limit: number | null
  remaining: number | null
  percentUsed: number | null
  resetLabel: string | null
  status?: 'trusted' | 'stale' | 'unknown'
  dataSource?: 'quota-usage-me' | 'quota-usage-fallback' | 'subscription-usage' | 'quotas' | 'unknown'
}

export type PlanInfo = {
  planName: string | null
  monthlyPriceUsd: number | null
  monthlyCapUsd: number | null
  fourHourCapUsd: number | null
  dailyRequestLimit: number | null
  paygDiscountPercent: number | null
}

export type PlanLimitEntry = {
  name: string
  priceLabel: string
  monthlyCapLabel: string
  dailyRequestLimitLabel: string
  fourHourCapLabel: string
  paygDiscountLabel: string
}

export type DashboardState = {
  connectionState: ConnectionState
  connected: boolean
  lastUpdatedAt: string | null
  data: {
    windows: UsageWindow[]
    plan: PlanInfo | null
    planLimits: PlanLimitEntry[]
    paygCreditUsd: number | null
  } | null
  errorMessage: string | null
}

export type StateMessage = {
  type: 'state'
  state: DashboardState
  refreshIntervalMs?: number
}

export type ActionType = 'refresh' | 'setApiKey' | 'removeApiKey' | 'openExternal'

export type CachedPayload = {
  version: number
  state: DashboardState
  planLimitsCollapsed: boolean
}
