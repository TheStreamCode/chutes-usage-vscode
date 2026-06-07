# Chutes Usage Monitor

Monitor Chutes subscription usage, rolling limits, and request quotas directly inside VS Code.

This is an unofficial third-party extension and is not affiliated with or endorsed by Chutes.

![Chutes Usage Monitor dashboard](media/screenshot-chutes-usage.png)

## Installation

Install the extension from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode):

- `mikesoft.chutes-usage-vscode`

After installation:

1. Open the Command Palette.
2. Run `Chutes Usage Monitor: Set API Key`.
3. Open the `Chutes Usage Monitor` view from the Activity Bar.

## Features

- Sidebar dashboard aligned with the chutes.ai look: pure-black on dark themes, pill buttons, mint pill badges, headline-violet section titles, generous whitespace
- Theme-aware: backgrounds, foregrounds, borders, and description text follow VS Code theme tokens; works with Light, Dark, and High Contrast themes
- Plan snapshot, per-window usage cards with progress bars, and a Plan Limits reference that highlights your current tier
- Compact status bar summary with severity-aware codicon and background color; full detail in the tooltip
- Secure API key storage through VS Code `SecretStorage`
- Manual refresh command for immediate sync
- Automatic refresh on a configurable timer, when the dashboard becomes visible again, and when the VS Code window regains focus
- Live `refresh in Ns` countdown driven by your `refreshIntervalSeconds` setting
- Cached state restore on side-panel reopen — no `Loading…` flash, no flicker on every tick
- Accessible by default: ARIA progressbar/alert/status semantics, `prefers-reduced-motion` support, and visible focus rings
- Hardened webview CSP with a per-load nonce and scoped `font-src`/`img-src`

## Latest Changes

- `0.4.5` removes the retired `$3/mo` Base plan from Plan Limits and keeps the built-in fallback reference aligned to the current Plus and Pro tiers.
- `0.4.4` adds a dashboard screenshot to the README and Marketplace description, and includes the screenshot asset in the packaged VSIX.
- `0.4.3` refreshes the README and changelog to document the 0.4.x redesign, theme-aware tokens, accessibility additions, state persistence, hardened CSP, Codicons, and the compact status bar.
- `0.4.2` fixes a critical visibility bug where `[hidden]` was being overridden by `display: flex/grid/inline-flex`, which kept the loading skeleton, stale banner, and per-card stale and current-tier badges visible regardless of state.
- `0.4.1` clears the next-refresh ticker on hide/unload, fixes the Plan Limits collapsed preference when no cache exists yet, keeps the refresh button enabled after reopening from a cached `loading` state, and pipes the configured `refreshIntervalSeconds` into the webview countdown.
- `0.4.0` redesigns the dashboard around the chutes.ai visual language, makes it theme-aware (`--vscode-*` tokens with mint/violet accents), eliminates dashboard flicker via mount/update DOM diffing, persists state with `vscode.setState/getState`, replaces unicode glyphs with Codicons, hardens the CSP with a nonce, adds full ARIA + `prefers-reduced-motion`, introduces a current-tier highlight and per-card stale badge, makes the Plan Limits section collapsible, and shrinks the status bar text to a severity-aware compact summary.
- `0.3.3` rebuilds the package with the latest documentation for the pricing-data-backed plan limits reference.
- `0.3.2` hardens external link handling, reduces unnecessary quota fallback requests, and feeds pricing data into the plan limits reference.
- `0.3.0` renames the extension to `Chutes Usage Monitor` for a clearer identity across the Marketplace and VS Code UI.
- `0.2.9` clarifies dashboard reset and key-removal labels so destructive actions are easier to understand before confirming them.
- `0.2.8` refines the dashboard UI for narrow sidebars, improves onboarding and stale-error messaging, and replaces the raw quotas table with a `Plan Limits` reference section.

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
- a `Plan Limits` reference section that uses pricing data when available without exposing a raw quota payload table

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

## Support The Project

If Chutes Usage Monitor helps you track quotas from VS Code, support continued maintenance through GitHub Sponsors: [github.com/sponsors/TheStreamCode](https://github.com/sponsors/TheStreamCode).

## License

MIT
