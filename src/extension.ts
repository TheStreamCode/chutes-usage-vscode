import * as vscode from 'vscode'

import { DASHBOARD_VIEW_ID, DEFAULT_REFRESH_INTERVAL_SECONDS, MAX_REFRESH_INTERVAL_SECONDS, MIN_REFRESH_INTERVAL_SECONDS, VIEW_CONTAINER_ID } from './constants'
import { SecretStore } from './services/SecretStore'
import { DashboardStore } from './state/DashboardStore'
import { StatusBarController } from './status/StatusBarController'
import { ChutesWebviewProvider, registerChutesWebviewProvider } from './views/ChutesWebviewProvider'

export function activate(context: vscode.ExtensionContext): void {
  const secretStore = new SecretStore(context.secrets)
  const dashboardStore = new DashboardStore(secretStore)
  const statusBarController = new StatusBarController()
  let refreshTimer: NodeJS.Timeout | undefined

  const provider = new ChutesWebviewProvider(context.extensionUri, {
    onRefresh: () => {
      void dashboardStore.refresh()
    },
    onSetApiKey: () => {
      void setApiKey(secretStore, dashboardStore)
    },
    onRemoveApiKey: () => {
      void removeApiKey(secretStore, dashboardStore)
    },
    onOpenExternal: (href: string) => {
      void vscode.env.openExternal(vscode.Uri.parse(href))
    },
    getState: () => dashboardStore.getState()
  })

  const syncPresentation = (): void => {
    const state = dashboardStore.getState()
    const visible = vscode.workspace.getConfiguration('chutesUsageVscode').get<boolean>('showStatusBar', true)
    statusBarController.render(state, visible)
    provider.postState(state)
  }

  const restartRefreshTimer = (): void => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
    }

    refreshTimer = setInterval(() => {
      void dashboardStore.refresh()
    }, getRefreshInterval() * 1000)
  }

  context.subscriptions.push({
    dispose: () => {
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
    }
  })

  context.subscriptions.push(statusBarController)
  context.subscriptions.push(registerChutesWebviewProvider(context, provider))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsageVscode.openDashboard', async () => {
    await vscode.commands.executeCommand(`workbench.view.extension.${VIEW_CONTAINER_ID}`)
    await vscode.commands.executeCommand(`${DASHBOARD_VIEW_ID}.focus`)
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsageVscode.refresh', async () => {
    await dashboardStore.refresh()
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsageVscode.setApiKey', async () => {
    await setApiKey(secretStore, dashboardStore)
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsageVscode.removeApiKey', async () => {
    await removeApiKey(secretStore, dashboardStore)
  }))

  const unsubscribe = dashboardStore.subscribe((state) => {
    const visible = vscode.workspace.getConfiguration('chutesUsageVscode').get<boolean>('showStatusBar', true)
    statusBarController.render(state, visible)
    provider.postState(state)
  })
  context.subscriptions.push({ dispose: unsubscribe })

  restartRefreshTimer()
  context.subscriptions.push(vscode.window.onDidChangeWindowState((event) => {
    if (event.focused) {
      void dashboardStore.refresh()
    }
  }))
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('chutesUsageVscode.refreshIntervalSeconds')) {
      restartRefreshTimer()
    }

    if (event.affectsConfiguration('chutesUsageVscode.showStatusBar')) {
      syncPresentation()
    }
  }))

  void dashboardStore.refresh()
}

export function deactivate(): void {
}

async function setApiKey(secretStore: SecretStore, dashboardStore: DashboardStore): Promise<void> {
  const apiKey = await vscode.window.showInputBox({
    title: 'Set Chutes API Key',
    prompt: 'Paste your Chutes API key. It will be stored securely in VS Code.',
    password: true,
    ignoreFocusOut: true,
    validateInput: (value) => value.trim().length === 0 ? 'API key is required.' : undefined
  })

  if (!apiKey) {
    return
  }

  await secretStore.setApiKey(apiKey.trim())
  await dashboardStore.refresh()
}

async function removeApiKey(secretStore: SecretStore, dashboardStore: DashboardStore): Promise<void> {
  const choice = await vscode.window.showWarningMessage(
    'Remove all locally stored Chutes Usage Monitor secrets?',
    { modal: true },
    'Remove'
  )

  if (choice !== 'Remove') {
    return
  }

  await secretStore.clearAll()
  await dashboardStore.refresh()
}

function getRefreshInterval(): number {
  const configuredValue = vscode.workspace.getConfiguration('chutesUsageVscode').get<number>('refreshIntervalSeconds', DEFAULT_REFRESH_INTERVAL_SECONDS)
  return Math.min(Math.max(configuredValue, MIN_REFRESH_INTERVAL_SECONDS), MAX_REFRESH_INTERVAL_SECONDS)
}
