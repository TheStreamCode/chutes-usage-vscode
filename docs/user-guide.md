# User Guide

## Overview

`Chutes Usage Monitor` helps you monitor subscription usage and request quotas without leaving VS Code.

The extension provides:

- a sidebar dashboard for detailed usage information
- an optional status bar item for a compact summary

## Get Started

1. Install `mikesoft.chutes-usage-vscode` from the [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=mikesoft.chutes-usage-vscode).
2. Open the Command Palette.
3. Run `Chutes Usage Monitor: Set API Key`.
4. Open the `Chutes Usage Monitor` view from the Activity Bar.

Your API key is stored securely using VS Code `SecretStorage`.

## Main UI

### Sidebar Dashboard

The dashboard is the primary interface for the extension.

It includes:

- a header with connection status and actions
- a plan snapshot with key subscription details, including your pay-as-you-go credit balance
- stacked usage cards for the main billing windows
- a `Plan Limits` section with public plan prices and PAYG discounts; monthly, daily, and burst limits are filled only for your current plan when the account API provides them

Depending on the current state, the dashboard shows onboarding, loading, ready, or error content.

The dashboard is optimized for the narrow sidebar widths common in VS Code, so cards stack vertically and supporting content collapses more gracefully on smaller layouts.

If the sidebar ever appears blank after an update, make sure you are on version `0.2.5` or newer, which fixes a webview bootstrap regression from `0.2.4`.

From version `0.2.6`, the Activity Bar/sidebar icon uses a dedicated single-color SVG for better visibility inside VS Code, while the Marketplace listing keeps a separate PNG icon.

### Status Bar

The status bar item provides a compact summary of usage.

Clicking it opens the `Chutes Usage Monitor` dashboard.

It can be turned on or off with the `chutesUsageVscode.showStatusBar` setting.

## Commands

The extension contributes these commands:

- `Chutes Usage Monitor: Open Dashboard`
- `Chutes Usage Monitor: Refresh`
- `Chutes Usage Monitor: Set API Key`
- `Chutes Usage Monitor: Remove API Key`

## Refresh Behavior

The extension refreshes data in three ways:

- manual refresh through the command or dashboard action
- automatic refresh on the configured interval
- automatic refresh when the dashboard becomes visible again
- automatic refresh when the VS Code window regains focus

Use `chutesUsageVscode.refreshIntervalSeconds` to control the refresh interval.

While the extension host remains active, reopening the dashboard can reuse its in-memory snapshot before refreshing. The webview itself persists only whether the Plan Limits section is collapsed and never stores usage or account values.

## Usage Data Shown

Depending on the API responses available for your account, the extension can display:

- billing cycle usage
- 4-hour rolling window usage
- daily request usage
- plan information such as subscription price or caps when available
- your pay-as-you-go credit balance (the account credit that funds requests beyond your subscription caps), with visible `Low credit` or `No credit` text and warning colors when applicable
- a Plus and Pro reference using public prices and PAYG discounts; other limits show `--` unless they are verified from the current account

## Managing Your API Key

- Use `Set API Key` to save or replace the current key.
- Use `Remove API Key` to remove the locally stored Chutes API key.

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
