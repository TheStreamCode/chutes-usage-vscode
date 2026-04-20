# Chutes Usage Monitor

Monitor Chutes subscription usage, rolling limits, and request quotas directly inside VS Code.

This is an unofficial third-party extension and is not affiliated with or endorsed by Chutes.

## Installation

Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode):

- `mikesoft.chutes-usage-vscode`

After installation:

1. Open the Command Palette.
2. Run `Chutes Usage Monitor: Set API Key`.
3. Open the `Chutes Usage Monitor` view from the Activity Bar.

## Features

- Sidebar dashboard with plan snapshot, stacked usage cards, and a built-in plan limits reference
- Optional status bar summary for quick usage visibility
- Secure API key storage through VS Code `SecretStorage`
- Manual refresh command for immediate sync
- Automatic refresh on a timer, when the dashboard becomes visible again, and when the VS Code window regains focus
- Immediate sidebar snapshot restore when the dashboard is opened after a background refresh

## Latest Fixes

- `0.2.9` clarifies dashboard reset and key-removal labels so destructive actions are easier to understand before confirming them.
- `0.2.8` refines the dashboard UI for narrow sidebars, improves onboarding and stale-error messaging, and replaces the raw quotas table with a `Plan Limits` reference section.
- `0.2.7` refreshes the Marketplace PNG icon artwork while keeping the dedicated single-color icon used in the VS Code Activity Bar/sidebar.
- `0.2.6` refreshes the extension branding with a dedicated single-color icon for the VS Code Activity Bar/sidebar and an updated Marketplace icon.
- `0.2.5` fixes a dashboard regression where the sidebar could render only the background after activation.
- The dashboard bootstrap is now packaged as browser-safe ES modules to match the VS Code webview runtime.

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
- a plan snapshot with the most relevant subscription figures
- stacked usage cards optimized for narrow Activity Bar layouts
- a `Plan Limits` reference section that explains Base, Plus, and Pro limits without exposing a raw quota payload table

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
- On uninstall, the extension performs best-effort cleanup of its local extension storage.

## Documentation

- [User guide](docs/user-guide.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Documentation index](docs/README.md)
- [Contributing](CONTRIBUTING.md)
- [Support](SUPPORT.md)
- [Security](SECURITY.md)

## License

MIT
