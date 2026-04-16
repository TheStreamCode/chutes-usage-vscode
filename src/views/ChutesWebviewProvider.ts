import * as vscode from 'vscode'

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

  public constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly actions: Actions
  ) {}

  public resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.view = webviewView
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'media'), vscode.Uri.joinPath(this.extensionUri, 'out', 'webview')]
    }

    webviewView.webview.html = this.getHtml(webviewView.webview)
    this.postState(this.actions.getState())

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        this.actions.onRefresh()
      }
    })

    webviewView.webview.onDidReceiveMessage((message: WebviewActionMessage) => {
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
      state
    }

    void this.view.webview.postMessage(message)
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'main.js'))
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'styles.css'))

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src ${webview.cspSource};">
  <title>Chutes Usage</title>
  <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
  <div id="app"></div>
  <script src="${scriptUri}"></script>
</body>
</html>`
  }
}

export function registerChutesWebviewProvider(
  context: vscode.ExtensionContext,
  provider: ChutesWebviewProvider
): vscode.Disposable {
  return vscode.window.registerWebviewViewProvider(DASHBOARD_VIEW_ID, provider)
}
