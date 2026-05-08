import * as vscode from 'vscode'

import type { DashboardState } from '../types'
import { summarizeStatusBarCompact } from '../services/normalize'

export class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem

  public constructor() {
    this.item = vscode.window.createStatusBarItem('chutesUsageVscode.status', vscode.StatusBarAlignment.Left, 100)
    this.item.command = 'chutesUsageVscode.openDashboard'
    this.item.name = 'Chutes Usage'
  }

  public render(state: DashboardState, visible: boolean): void {
    if (!visible) {
      this.item.hide()
      return
    }

    const summary = summarizeStatusBarCompact(state)
    this.item.text = summary.text
    this.item.tooltip = buildTooltip(state)

    switch (summary.severity) {
      case 'warning':
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground')
        break
      case 'error':
        this.item.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
        break
      default:
        this.item.backgroundColor = undefined
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

  if (state.connectionState === 'missing-key') {
    lines.push('Set your Chutes API key to start monitoring usage.')
  } else if (state.connectionState === 'error' && state.errorMessage) {
    lines.push(`Sync failed: ${state.errorMessage}`)
  }

  if (state.lastUpdatedAt) {
    lines.push(`Updated: ${new Date(state.lastUpdatedAt).toLocaleTimeString()}`)
  }
  return lines.join('\n')
}
