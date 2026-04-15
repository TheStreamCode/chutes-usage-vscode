import * as vscode from 'vscode'

import { DEFAULT_REFRESH_INTERVAL_SECONDS, VIEW_CONTAINER_ID } from './constants'
import { SecretStore } from './services/SecretStore'
import { DashboardStore } from './state/DashboardStore'
import { StatusBarController } from './status/StatusBarController'
import { ChutesWebviewProvider, registerChutesWebviewProvider } from './views/ChutesWebviewProvider'

export function activate(context: vscode.ExtensionContext): void {
  const secretStore = new SecretStore(context.secrets)
  const dashboardStore = new DashboardStore(secretStore)
  const statusBarController = new StatusBarController()

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
    }
  })

  context.subscriptions.push(statusBarController)
  context.subscriptions.push(registerChutesWebviewProvider(context, provider))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsage.openDashboard', async () => {
    await vscode.commands.executeCommand(`${VIEW_CONTAINER_ID}.focus`)
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsage.refresh', async () => {
    await dashboardStore.refresh()
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsage.setApiKey', async () => {
    await setApiKey(secretStore, dashboardStore)
  }))

  context.subscriptions.push(vscode.commands.registerCommand('chutesUsage.removeApiKey', async () => {
    await removeApiKey(secretStore, dashboardStore)
  }))

  const unsubscribe = dashboardStore.subscribe((state) => {
    const visible = vscode.workspace.getConfiguration('chutesUsage').get<boolean>('showStatusBar', true)
    statusBarController.render(state, visible)
    provider.postState(state)
  })
  context.subscriptions.push({ dispose: unsubscribe })

  const interval = getRefreshInterval()
  const timer = setInterval(() => {
    void dashboardStore.refresh()
  }, interval * 1000)

  context.subscriptions.push({ dispose: () => clearInterval(timer) })
  context.subscriptions.push(vscode.window.onDidChangeWindowState((event) => {
    if (event.focused) {
      void dashboardStore.refresh()
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
    'Remove all locally stored Chutes Usage secrets?',
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
  return vscode.workspace.getConfiguration('chutesUsage').get<number>('refreshIntervalSeconds', DEFAULT_REFRESH_INTERVAL_SECONDS)
}
