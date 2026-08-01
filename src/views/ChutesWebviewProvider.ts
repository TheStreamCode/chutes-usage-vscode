import * as vscode from 'vscode'
import { randomBytes } from 'crypto'

import { DASHBOARD_VIEW_ID } from '../constants'
import type { DashboardState, WebviewActionMessage, WebviewStateMessage } from '../types'

type Actions = {
  onRefresh: () => void
  onSetApiKey: () => void
  onRemoveApiKey: () => void
  onOpenExternal: (href: string) => void
  getState: () => DashboardState
}

export class ChutesWebviewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView
  private refreshIntervalMs?: number

  public constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly actions: Actions
  ) {}

  public setRefreshIntervalMs(ms: number): void {
    this.refreshIntervalMs = ms
    if (this.view) this.postState(this.actions.getState())
  }

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media'), vscode.Uri.joinPath(this.extensionUri, 'out', 'webview')]
    }

    webviewView.webview.html = this.getHtml(webviewView.webview)
    this.postState(this.actions.getState())

    webviewView.onDidDispose(() => {
      if (this.view === webviewView) {
        this.view = undefined
      }
    })

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.actions.onRefresh()
      }
    })

    webviewView.webview.onDidReceiveMessage((message: unknown) => {
      if (!isWebviewActionMessage(message)) {
        return
      }

      switch (message.type) {
        case 'refresh':
          this.actions.onRefresh()
          break
        case 'setApiKey':
          this.actions.onSetApiKey()
          break
        case 'removeApiKey':
          this.actions.onRemoveApiKey()
          break
        case 'openExternal':
          if (message.href) {
            this.actions.onOpenExternal(message.href)
          }
          break
      }
    })
  }

  public postState(state: DashboardState): void {
    if (!this.view) {
      return
    }

    const message: WebviewStateMessage = {
      type: 'state',
      state,
      refreshIntervalMs: this.refreshIntervalMs
    }

    void this.view.webview.postMessage(message)
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'main.js'))
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'styles.css'))
    const codiconUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'codicon.css'))
    const nonce = generateNonce()

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; form-action 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'strict-dynamic'; img-src ${webview.cspSource} data:; font-src ${webview.cspSource};">
  <title>Chutes Usage Monitor</title>
  <link rel="stylesheet" href="${codiconUri}" />
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="app"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`
  }
}

function generateNonce(): string {
  return randomBytes(16).toString('base64')
}

function isWebviewActionMessage(message: unknown): message is WebviewActionMessage {
  if (typeof message !== 'object' || message === null) {
    return false
  }

  const candidate = message as Partial<WebviewActionMessage>
  switch (candidate.type) {
    case 'refresh':
    case 'setApiKey':
    case 'removeApiKey':
      return true
    case 'openExternal':
      return typeof candidate.href === 'string'
    default:
      return false
  }
}

export function registerChutesWebviewProvider(
  provider: ChutesWebviewProvider
): vscode.Disposable {
  return vscode.window.registerWebviewViewProvider(DASHBOARD_VIEW_ID, provider)
}
