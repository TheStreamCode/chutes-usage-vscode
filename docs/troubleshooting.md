# Troubleshooting

## Common Issues

### No Data Or API Key Prompt

If the dashboard asks for an API key or stays in its initial onboarding state:

1. Run `Chutes Usage for VS Code: Set API Key`.
2. Paste a valid Chutes API key.
3. Run `Chutes Usage for VS Code: Refresh`.

### Refresh Errors

If the extension shows an error state:

- verify that your API key is still valid
- verify that the Chutes API is reachable
- run `Chutes Usage for VS Code: Refresh`
- reopen the dashboard after the window regains focus

The extension preserves the last successful snapshot when possible, so a temporary API failure may still leave previous data visible.

### Daily Quota Looks Delayed

Chutes quota metering may lag behind live traffic.

To avoid showing misleading numbers, the extension may display `--` instead of `0` when daily quota usage cannot be verified reliably.

### Quota Rows Look Incomplete

The extension normalizes quota and usage data defensively because API response shapes may change over time.

If some rows or values look incomplete:

- refresh the dashboard manually
- compare the result after a short delay
- include a redacted sample payload when reporting the issue

## Data Sources

The extension reads user-scoped API data tied to the configured API key.

The extension currently relies on these endpoints for user-facing usage data:

- `GET /users/me/subscription_usage`
- `GET /users/me/quotas`
- `GET /users/me/quota_usage/me`
- `GET /users/me/quota_usage/{chute_id}`
- `GET /invocations/stats/llm`
Some endpoints are used as fallbacks when the primary payload is incomplete or delayed.

## Reporting An Issue

Open an issue at:

- `https://github.com/TheStreamCode/chutes-usage-vscode/issues`

Include:

- extension version
- VS Code version
- operating system
- steps to reproduce
- expected behavior
- actual behavior

If the issue is related to API parsing or quota behavior, include a redacted payload when possible. Remove secrets and personal identifiers, but keep field names and numeric values intact.
