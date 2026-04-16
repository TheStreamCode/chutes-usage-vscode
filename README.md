# Chutes Usage

Monitor Chutes usage, quotas, and rolling limits directly inside VS Code.

## Important Disclaimer

`Chutes Usage` is a third-party tool.

It is not official and is not affiliated with or endorsed by Chutes.

Created by:
- Michael Gasperini
- `mikesoft.it`

Public repository:
- `https://github.com/TheStreamCode/chutes-usage-vscode`

Marketplace publisher:
- `mikesoft`

## What It Shows

- Monthly usage and remaining subscription credit
- 4-hour rolling window usage and remaining credit
- Daily request quota usage and remaining requests
- Quotas table for the authenticated user
- Compact status bar summary
- Sidebar dashboard with plan snapshot and usage cards

## Current Data Sources

The extension reads only user-scoped Chutes endpoints tied to your API key:

- `GET /users/me/subscription_usage`
- `GET /users/me/quotas`
- `GET /users/me/quota_usage/{chute_id}`
- `GET /users/me/discounts`
- `GET /users/me/price_overrides`

Notes:

- Monthly and 4-hour windows come from `subscription_usage`.
- Daily request usage comes from live `quota_usage/{chute_id}` responses and is aggregated when multiple quota rows are returned.
- Daily request limits come from `quotas`.
- The public `GET /pricing` endpoint is not used to infer user usage windows.

## Plan Name Behavior

Chutes user endpoints currently expose numeric subscription fields such as `monthly_price`, but do not appear to expose a stable tier name string for the authenticated user.

The extension therefore maps known public pricing values to tier names:

- `$3` -> `Base`
- `$10` -> `Plus`
- `$20` -> `Pro`
- no subscription -> `Free tier`
- custom plan -> `Custom`

If Chutes later exposes an official tier name in the API, the extension should prefer that value directly.

## User Friendly By Design

The extension is designed to be easy to use:

- one quick setup action
- one compact status bar item
- one sidebar dashboard
- clear labels instead of technical jargon where possible
- safe defaults with very few settings

## Setup

1. Open the Command Palette.
2. Run `Chutes Usage: Set API Key`.
3. Open the `Chutes Usage` sidebar.

## Notes

- This extension uses your Chutes API key only to request your own usage data.
- The key is stored using VS Code `SecretStorage`.
- The extension is built as a practical unofficial utility for Chutes users.

## Data Retention

- The extension does not keep a local history of your usage data.
- The sidebar webview state is not persisted between sessions.
- On uninstall, the extension runs a best-effort cleanup hook to remove its local extension storage.
- VS Code does not document access to `SecretStorage` from the uninstall hook, so secure secret cleanup is guaranteed when you use `Chutes Usage: Remove API Key` before uninstalling.

## Development Notes

- Package manager: `pnpm`
- Platform target: Windows-friendly workflows
- Webview assets are compiled to `out/webview`
- The packaged extension includes both `main.js` and `styles.css`

## Repository Standards

This repository includes:

- CI workflow for build and test validation
- issue and pull request templates
- contribution guide
- code of conduct
- security policy
- Dependabot configuration for dependency maintenance

## Author

Michael Gasperini

`https://mikesoft.it`
