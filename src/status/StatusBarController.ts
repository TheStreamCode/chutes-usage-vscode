import * as vscode from 'vscode'

import type { DashboardState } from '../types'
import { summarizeStatusBar } from '../services/normalize'

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem

  public constructor() {
    this.item = vscode.window.createStatusBarItem('chutesUsage.status', vscode.StatusBarAlignment.Left, 100)
    this.item.command = 'chutesUsage.openDashboard'
  }

  public render(state: DashboardState, visible: boolean): void {
    if (!visible) {
      this.item.hide()
      return
    }

    switch (state.connectionState) {
      case 'missing-key':
        this.item.text = 'Chutes Sign in'
        this.item.tooltip = 'Set your Chutes API key to start monitoring usage.'
        break
      case 'loading':
        this.item.text = '$(loading~spin) Chutes'
        this.item.tooltip = 'Refreshing Chutes usage...'
        break
      case 'ready':
        this.item.text = state.data ? summarizeStatusBar(state.data) : 'Chutes'
        this.item.tooltip = buildTooltip(state)
        break
      case 'error':
        this.item.text = 'Chutes Error'
        this.item.tooltip = state.errorMessage ?? 'Unable to refresh Chutes usage.'
        break
    }

    this.item.show()
  }

  public dispose(): void {
    this.item.dispose()
  }
}

function buildTooltip(state: DashboardState): string {
  const lines: string[] = []
  if (state.data) {
    for (const window of state.data.windows) {
      const used = window.used === null ? '--' : `${Math.round(window.used)}`
      const limit = window.limit === null ? '--' : window.unit === 'requests' && window.limit === 0 ? 'Unlimited' : `${Math.round(window.limit)}`
      const suffix = window.resetLabel ? ` (${window.resetLabel})` : ''
      lines.push(`${window.label}: ${used}/${limit}${suffix}`)
    }
  }

  if (state.lastUpdatedAt) {
    lines.push(`Updated: ${new Date(state.lastUpdatedAt).toLocaleTimeString()}`)
  }

  lines.push('Click to open the dashboard.')
  return lines.join('\n')
}
