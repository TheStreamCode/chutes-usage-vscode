import type { DashboardState, WebviewDashboardState } from '../types'

// Send the webview only what the dashboard renders. The per-model `quotas` rows
// are consumed by the extension host to derive the daily window and are never
// read by the webview, so project an exact boundary type rather than forwarding
// the wider extension-host state object.
export function toWebviewState(state: DashboardState): WebviewDashboardState {
  return {
    connectionState: state.connectionState,
    connected: state.connected,
    lastUpdatedAt: state.lastUpdatedAt,
    data: state.data === null
      ? null
      : {
          windows: state.data.windows,
          plan: state.data.plan,
          planLimits: state.data.planLimits,
          paygCreditUsd: state.data.paygCreditUsd
        },
    errorMessage: state.errorMessage
  }
}
