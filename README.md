# Chutes Usage Monitor

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/mikesoft.chutes-usage-vscode?label=Marketplace&color=6366F1)](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode)
[![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/mikesoft.chutes-usage-vscode?color=0EA5E9)](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode)
[![Open VSX](https://img.shields.io/open-vsx/v/mikesoft/chutes-usage-vscode?label=Open%20VSX&color=a60ee5)](https://open-vsx.org/extension/mikesoft/chutes-usage-vscode)
[![CI](https://github.com/TheStreamCode/chutes-usage-vscode/actions/workflows/ci.yml/badge.svg)](https://github.com/TheStreamCode/chutes-usage-vscode/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Sponsor](https://img.shields.io/badge/Sponsor-TheStreamCode-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/TheStreamCode)

Keep Chutes usage visible while you code. The sidebar shows subscription spend, rolling limits, daily requests, and pay-as-you-go credit without leaving VS Code.

[Install from the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode) · [Install from Open VSX](https://open-vsx.org/extension/mikesoft/chutes-usage-vscode) · [Read the user guide](docs/user-guide.md)

This is an unofficial third-party extension and is not affiliated with or endorsed by Chutes.

![Chutes Usage Monitor dashboard](media/screenshot-chutes-usage.png)

_Current dashboard rendered with synthetic, illustrative values._

## Requirements

- VS Code `1.103.0` or newer (or a compatible editor that installs from Open VSX)
- A Chutes account and an API key with access to your own usage data

## Installation

Install `mikesoft.chutes-usage-vscode` from either registry:

- [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode)
- [Open VSX](https://open-vsx.org/extension/mikesoft/chutes-usage-vscode)

After installation:

1. Open the Command Palette.
2. Run `Chutes Usage Monitor: Set API Key`.
3. Open the `Chutes Usage Monitor` view from the Activity Bar.

## What You Get

- A focused sidebar dashboard for billing-cycle, rolling four-hour, and daily request usage
- Plan context and PAYG credit at a glance, with visible low- and no-credit warnings
- An optional status bar summary for quick checks without opening the dashboard
- Manual and automatic refresh when the timer fires, the view reopens, or VS Code regains focus
- Native Light, Dark, and High Contrast theme support with keyboard and screen-reader accessibility
- Read-only account access, secure API-key storage, no local usage history, and a locked-down webview

## Commands

- `Chutes Usage Monitor: Open Dashboard`
- `Chutes Usage Monitor: Refresh`
- `Chutes Usage Monitor: Set API Key`
- `Chutes Usage Monitor: Remove API Key`

## Settings

- `chutesUsageVscode.refreshIntervalSeconds`: Refresh interval in seconds. Default: `60`
- `chutesUsageVscode.showStatusBar`: Show or hide the status bar item. Default: `true`

## How It Works

The extension shows your current Chutes usage in two places:

- the `Chutes Usage Monitor` sidebar dashboard for full details
- the optional status bar item for a compact summary and quick access back to the dashboard

The sidebar dashboard includes:

- a compact header with sync state and actions
- a plan snapshot with the most relevant subscription figures, including your pay-as-you-go credit balance
- stacked usage cards optimized for narrow Activity Bar layouts
- a `Plan Limits` reference section with public plan prices and PAYG discounts; current-plan limits come from your account and unavailable values display as `--`

The dashboard refreshes when you run the refresh command, on the configured refresh interval, when the dashboard becomes visible again, and when VS Code regains window focus.

Settings changes for refresh interval and status bar visibility apply immediately without reloading the extension.

## Known Limitations

- Chutes quota metering may lag behind live requests.
- When daily quota data cannot be verified reliably, the extension shows `--` instead of a potentially misleading `0`.
- Some API responses are normalized defensively because endpoint shapes may evolve over time.
- Temporary refresh errors keep the last successful dashboard snapshot visible when possible.

## Privacy And Storage

- Your Chutes API key is stored using VS Code `SecretStorage`.
- The extension uses the key only to request your own usage data.
- The extension does not keep a local history of usage data.
- The webview persists only whether the Plan Limits section is collapsed, never an account snapshot.
- On uninstall, the extension performs best-effort cleanup of its local extension storage.

## Latest Changes

- `0.5.5` removes persisted usage snapshots and the unrelated pricing request, clears dependency advisories, tightens the webview boundary, improves accessibility, and refreshes the public project presentation.
- `0.5.4` trims dashboard state, removes dead code, synchronizes release metadata, and expands the project documentation.
- `0.5.3` strengthens webview security, repository quality gates, cross-platform cleanup, and API compatibility.

See the [changelog](CHANGELOG.md) for the complete release history and the [latest GitHub release](https://github.com/TheStreamCode/chutes-usage-vscode/releases/latest) for downloadable artifacts.

## Development

Requires Node.js `22.17.0` (see `.nvmrc`) and `npm`. The lockfile is authoritative — do not switch package manager.

```bash
npm ci          # install the locked dependencies
npm run compile # build extension host + webview and copy webview assets
npm test        # compile, then run the node:test suite
npm run audit   # npm audit --audit-level=high
npm run check   # npm test + npm run audit
npm run package # build the VSIX with vsce
npm run preflight # npm run check + npm run package
```

Press `F5` in VS Code to launch an Extension Development Host.

## Repository Structure

```
src/            extension host (TypeScript, VS Code API)
  services/     Chutes API client, secret storage, payload normalization, link allowlist
  state/        dashboard store and the webview state projection
  status/       status bar controller
  views/        webview view provider and CSP-nonced HTML
  test/         node:test suites
webview/        browser-side dashboard, compiled separately as ES modules
scripts/        build helpers
media/          icon and screenshot assets
docs/           user guide and troubleshooting
out/            build output (generated, not committed)
```

## Documentation

- [User guide](docs/user-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Documentation index](docs/README.md)
- [Questions and community support](https://github.com/TheStreamCode/chutes-usage-vscode/discussions)
- [Bug reports and feature requests](https://github.com/TheStreamCode/chutes-usage-vscode/issues)
- [Contributing](CONTRIBUTING.md)
- [Support](SUPPORT.md)
- [Security](SECURITY.md)

## Support The Project

If Chutes Usage Monitor helps you track quotas from VS Code, support continued maintenance through GitHub Sponsors: [github.com/sponsors/TheStreamCode](https://github.com/sponsors/TheStreamCode).

## License

Project-owned code and materials are licensed under the [MIT License](LICENSE).
See [NOTICE](NOTICE) for trademark, logo, non-affiliation, and Chutes provider
terms/privacy notices. This is an unofficial third-party extension and is not
affiliated with or endorsed by Chutes.
