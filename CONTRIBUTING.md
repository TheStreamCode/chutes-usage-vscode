# Contributing

Thanks for your interest in improving `Chutes Usage for VS Code`.

## Prerequisites

- Node.js 22 or newer
- `pnpm`

## Development Setup

1. Install dependencies:

```bash
pnpm install
```

2. Build the extension:

```bash
pnpm run compile
```

3. Run the test suite:

```bash
pnpm test
```

## Contribution Guidelines

- Keep changes focused and minimal.
- Prefer small fixes over broad refactors.
- Add or update tests for parser and state behavior changes.
- Preserve user privacy. Do not log API keys or sensitive account data.
- Use `pnpm`, not `npm`.

## Pull Requests

Before opening a pull request, make sure to:

1. Run `pnpm test`
2. Run `pnpm package`
3. Update `CHANGELOG.md` when the change is user-visible
4. Update `README.md` when setup, behavior, or supported API shapes change

## Reporting API Shape Issues

If Chutes changes the shape of an endpoint response, please include a redacted sample payload in the issue when possible. Remove secrets and personal data, but keep field names and numeric values intact.
