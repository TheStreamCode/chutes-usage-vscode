# Contributing

Thanks for your interest in improving `Chutes Usage`.

## Development Setup

1. Install Node.js 22 or newer.
2. Install `pnpm`.
3. Install dependencies:

```bash
pnpm install
```

4. Build the extension:

```bash
pnpm run compile
```

5. Run the test suite:

```bash
pnpm test
```

## Project Structure

- `src/`: extension runtime, API client, state, status bar, and webview provider
- `webview/`: webview frontend source
- `out/`: compiled output
- `media/`: extension icons and static assets
- `docs/`: design notes and internal project documentation

## Contribution Guidelines

- Keep changes focused and minimal.
- Prefer small fixes over broad refactors.
- Add or update tests for parser and state behavior changes.
- Preserve user privacy. Do not log API keys or sensitive account data.
- Use `pnpm`, not `npm`.

## Pull Requests

Before opening a pull request:

1. Run `pnpm test`
2. Run `pnpm package`
3. Update `CHANGELOG.md` when the change is user-visible
4. Update `README.md` when setup, behavior, or supported API shapes change

## Changelog Style

- Keep changelog entries short and release-oriented.
- Group related work into one or two meaningful bullets when possible.
- Do not list minor visual tweaks, refactors, or housekeeping individually unless they matter to users.
- Include technical detail only when it affects compatibility, user behavior, migration, or debugging expectations.

## Reporting API Shape Issues

If Chutes changes the shape of an endpoint response, please include a redacted sample payload in the issue when possible. Remove secrets and personal data, but keep field names and numeric values intact.
