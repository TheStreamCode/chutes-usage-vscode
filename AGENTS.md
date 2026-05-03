# Repository Guidelines

## Project Structure & Module Organization

This repository is a VS Code extension for monitoring Chutes usage. Extension-host TypeScript lives in `src/`, with API access in `src/services/`, state in `src/state/`, status bar UI in `src/status/`, and webview registration in `src/views/`. Browser-side webview code lives in `webview/` and is compiled separately as ES modules. Tests are in `src/test/`. Static assets are in `media/`, while user-facing docs live in `docs/` plus root files such as `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `CHANGELOG.md`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run compile`: compile extension-host code, compile webview code, and copy `webview/styles.css` into `out/webview/`.
- `npm test`: run compile, then execute Node test files from `out/src/test/**/*.test.js`.
- `npm run package`: build a VSIX package with `vsce`.
- `npm run vscode:prepublish`: run the compile step used before publishing.

For manual testing, open the repo in VS Code and press `F5` to launch an Extension Development Host.

## Coding Style & Naming Conventions

Use TypeScript with `strict` enabled. Follow the existing style: two-space indentation in JSON, no semicolons in TypeScript, single quotes for strings, and concise comments only where behavior is not obvious. Name classes and types in `PascalCase`, functions and variables in `camelCase`, and tests as `*.test.ts`. Keep extension-host code and browser webview code separated; do not import VS Code APIs into `webview/`.

## Testing Guidelines

Tests use the built-in `node:test` runner and `node:assert/strict`. Add or update tests for API normalization, dashboard state transitions, webview bootstrap behavior, lifecycle cleanup, and security-sensitive changes. Prefer focused tests with behavior-oriented names, for example `skips per-chute fallback quota usage when aggregate usage is available`. Run `npm test` before handing off changes.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:`, `fix:`, and `chore:`. Keep messages specific, for example `fix: clarify dashboard reset labels`. Pull requests should include a short description, linked issues when relevant, test results, and screenshots or notes for visible webview changes. Update `CHANGELOG.md` for user-visible changes and update docs when setup, behavior, or support guidance changes.

## Security & Configuration Tips

Never log API keys or account payloads containing sensitive data. API keys must stay in VS Code `SecretStorage`. Validate webview messages defensively and allowlist external links before calling VS Code APIs. If documenting API shape issues, include only redacted payload samples.
