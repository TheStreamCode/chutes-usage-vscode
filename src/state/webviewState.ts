import type { DashboardState } from '../types'

// Send the webview only what the dashboard renders. The per-model `quotas` rows
// are consumed by the extension host to derive the daily window and are never
// read by the webview, so they stay out of every `postMessage` payload and out
// of the state the webview persists through `vscode.setState`.
export function toWebviewState(state: DashboardState): DashboardState {
  if (state.data === null || state.data.quotas.length === 0) {
    return state
  }

  return { ...state, data: { ...state.data, quotas: [] } }
}
