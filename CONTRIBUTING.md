# Contributing

Thanks for your interest in improving `Chutes Usage for VS Code`.

## Prerequisites

- Node.js 22 or newer
- `npm`
- Visual Studio Code

## Development Setup

1. Install dependencies:

```bash
npm install
```

2. Build the extension:

```bash
npm run compile
```

3. Run the test suite:

```bash
npm test
```

## Running The Extension Locally

1. Open the repository in VS Code.
2. Run `npm install` if dependencies are not installed yet.
3. Press `F5` to launch an Extension Development Host window.
4. In the new window, run `Chutes Usage for VS Code: Set API Key` to test the extension manually.

If you are editing both extension-host code and webview assets, run `npm run compile` again before reloading the Extension Development Host.

## Contribution Guidelines

- Keep changes focused and minimal.
- Prefer small fixes over broad refactors.
- Add or update tests for parser and state behavior changes.
- Preserve user privacy. Do not log API keys or sensitive account data.
- Use `npm` so local development matches the checked-in lockfile and CI workflow.
- Update documentation when user-facing behavior changes.

## Pull Requests

Before opening a pull request:

1. Run `npm test`.
2. Run `npm run package`.
3. Update `CHANGELOG.md` when the change is user-visible.
4. Update `README.md` or files in `docs/` when setup, behavior, or support guidance changes.

## Reporting API Shape Issues

If Chutes changes the shape of an endpoint response, include a redacted sample payload in the issue when possible. Remove secrets and personal data, but keep field names and numeric values intact.
