# Chutes Usage for VS Code

Monitor Chutes subscription usage, rolling limits, and request quotas directly inside VS Code.

This is an unofficial third-party extension and is not affiliated with or endorsed by Chutes.

## Features

- Monthly usage and remaining subscription credit
- 4-hour rolling window usage and remaining credit
- Daily request quota usage and remaining requests
- Quotas table for the authenticated user
- Sidebar dashboard with plan snapshot and usage cards
- Compact status bar summary

## Installation

1. Open the Command Palette.
2. Run `Chutes Usage for VS Code: Set API Key`.
3. Open the `Chutes Usage` sidebar.

If you previously installed the removed Marketplace package, install this extension as a fresh package and set the API key again.

## Usage

The extension shows your current Chutes usage in two places:

- a sidebar dashboard with plan and quota details
- an optional status bar summary

Use the built-in refresh command whenever you want to request fresh data immediately.

## Data Sources

The extension reads only user-scoped Chutes endpoints tied to your API key:

- `GET /users/me/subscription_usage`
- `GET /users/me/quotas`
- `GET /users/me/quota_usage/me`
- `GET /users/me/quota_usage/{chute_id}`
- `GET /invocations/stats/llm`

Behavior summary:

- Monthly and 4-hour windows come from `subscription_usage`.
- Daily request usage comes primarily from `quota_usage/me`.
- `invocations/stats/llm` is used as a live cross-check when quota metering appears delayed.
- Daily request limits come from `quotas`.
- `quota: 0` is treated as `Unlimited`.

## Known Limitations

- Chutes quota metering may lag behind live requests.
- When daily quota data cannot be verified, the extension shows `--` instead of a potentially misleading `0`.
- The extension does not migrate settings or secrets from the removed Marketplace package.

## Privacy and Storage

- Your Chutes API key is stored using VS Code `SecretStorage`.
- The extension uses the key only to request your own usage data.
- The extension does not keep a local history of usage data.
- The sidebar webview state is not persisted between sessions.

Before uninstalling, use `Chutes Usage for VS Code: Remove API Key` if you want to explicitly clear stored secrets.

## Support

Use GitHub Issues for bug reports and feature requests:

- `https://github.com/TheStreamCode/chutes-usage-vscode/issues`

For API parsing issues, include a redacted payload when possible. Remove secrets and personal identifiers, but keep field names and numeric values intact.

## License

MIT
