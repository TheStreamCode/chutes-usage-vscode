# User Guide

## Overview

`Chutes Usage for VS Code` helps you monitor subscription usage and request quotas without leaving VS Code.

The extension provides:

- a sidebar dashboard for detailed usage information
- an optional status bar item for a compact summary

## Get Started

1. Install `mikesoft.chutes-usage-vscode` from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode).
2. Open the Command Palette.
3. Run `Chutes Usage for VS Code: Set API Key`.
4. Open the `Chutes Usage` view from the Activity Bar.

Your API key is stored securely using VS Code `SecretStorage`.

## Main UI

### Sidebar Dashboard

The dashboard is the primary interface for the extension.

It includes:

- a header with connection status and actions
- a plan snapshot with key subscription details
- usage cards for the main billing windows
- a quotas table for returned model quota rows

Depending on the current state, the dashboard shows onboarding, loading, ready, or error content.

### Status Bar

The status bar item provides a compact summary of usage.

Clicking it opens the `Chutes Usage` dashboard.

It can be turned on or off with the `chutesUsageVscode.showStatusBar` setting.

## Commands

The extension contributes these commands:

- `Chutes Usage for VS Code: Open Dashboard`
- `Chutes Usage for VS Code: Refresh`
- `Chutes Usage for VS Code: Set API Key`
- `Chutes Usage for VS Code: Remove API Key`

## Refresh Behavior

The extension refreshes data in three ways:

- manual refresh through the command or dashboard action
- automatic refresh on the configured interval
- automatic refresh when the dashboard becomes visible again
- automatic refresh when the VS Code window regains focus

Use `chutesUsageVscode.refreshIntervalSeconds` to control the refresh interval.

When you reopen the dashboard after a recent refresh, the latest snapshot is shown immediately and then refreshed again in the background.

## Usage Data Shown

Depending on the API responses available for your account, the extension can display:

- billing cycle usage
- 4-hour rolling window usage
- daily request usage
- model quota rows
- plan information such as subscription price or caps when available

## Managing Your API Key

- Use `Set API Key` to save or replace the current key.
- Use `Remove API Key` to remove locally stored extension secrets.

If no API key is stored, the extension remains in an onboarding state until one is provided.

## Settings

### `chutesUsageVscode.refreshIntervalSeconds`

Controls how often the extension refreshes usage data automatically.

Changes take effect immediately without reloading the extension.

- Type: `number`
- Default: `60`
- Minimum: `15`
- Maximum: `900`

### `chutesUsageVscode.showStatusBar`

Controls whether the status bar item is visible.

Changes take effect immediately without reloading the extension.

- Type: `boolean`
- Default: `true`

## Related Documents

- [Troubleshooting](troubleshooting.md)
- [Support](../SUPPORT.md)
- [Security](../SECURITY.md)
