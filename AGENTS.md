# AGENTS.md — Chutes Usage Monitor

Guidance for humans and AI agents working in this repository. Read it fully before changing anything.

## Project Overview

`Chutes Usage Monitor` is an **unofficial, third-party VS Code extension** that shows a Chutes account's subscription usage, rolling limits, daily request quotas, and pay-as-you-go credit inside a sidebar dashboard and an optional status bar item. It is read-only: it never mutates the user's Chutes account.

The repository is **public** on GitHub, MIT licensed, and published to both the **Visual Studio Code Marketplace** and **Open VSX** under the publisher `mikesoft` (extension id `mikesoft.chutes-usage-vscode`).

## Stack And Runtime

- TypeScript with `strict` enabled, compiled by `typescript@^7`
- VS Code Extension API, target `engines.vscode: ^1.103.0`
- Node.js `22` (`.nvmrc` pins `22.17.0`; `@types/node` is pinned to the same major)
- Test runner: built-in `node:test` + `node:assert/strict`
- Package manager: **npm only**, `package-lock.json` is authoritative. Never add a second lockfile or package manager.
- No runtime `dependencies`. Everything shipped is compiled from this repository; `devDependencies` exist only for build, packaging, and Codicons assets.

## Architecture

Two independently compiled worlds that only talk through `postMessage`:

1. **Extension host** (`src/`, `tsconfig.json`, `module: node16`)
   - `services/ChutesApiClient.ts` — authenticated `fetch` against `https://api.chutes.ai`, 15 s abort timeout per request. `/users/me/subscription_usage` and `/users/me/quotas` are required; `/pricing`, `/users/me/quota_usage/me`, `/users/me/quota_usage/{chute_id}`, `/invocations/stats/llm`, `/users/me` are optional and fail soft.
   - `services/normalize.ts` — defensive normalization of loose API payloads into `DashboardData`, plus the compact status bar summary. All API shape tolerance lives here.
   - `services/SecretStore.ts` — the only place the API key is read or written, always through `vscode.SecretStorage`.
   - `services/externalLinks.ts` — https-only allowlist (`https://chutes.ai`) for anything the webview asks the host to open.
   - `state/DashboardStore.ts` — state machine (`missing-key` → `loading` → `ready`/`error`) with a monotonic `refreshVersion` guard against out-of-order refreshes.
   - `state/webviewState.ts` — projects the host state down to what the webview renders before it crosses the boundary.
   - `status/StatusBarController.ts` — the single status bar item.
   - `views/ChutesWebviewProvider.ts` — builds the webview HTML with a per-load CSP nonce and validates every inbound message.
   - `extension.ts` — wires everything and registers **every** disposable on `context.subscriptions` exactly once during `activate`.
   - `lifecycle.ts` / `lifecycleTargets.ts` — best-effort `vscode:uninstall` cleanup of global storage folders.
2. **Webview** (`webview/`, `tsconfig.webview.json`, `module: ES2022`) — plain DOM, no framework, no bundler. `webview/types.ts` mirrors the subset of `src/types.ts` the dashboard needs and must be kept in sync manually. **Never import `vscode` from `webview/`.**

`scripts/copy-webview-assets.mjs` copies `webview/styles.css` and the Codicons CSS/TTF into `out/webview/`. It is pure Node so the build works on Windows, macOS, and Linux.

## Commands

All commands are real `npm` scripts from `package.json`:

| Purpose | Command |
| --- | --- |
| Install | `npm ci` |
| Build | `npm run compile` |
| Watch (host only) | `npm run watch` |
| Unit tests only | `npm run test:unit` |
| Compile + tests | `npm test` |
| Dependency audit | `npm run audit` |
| Tests + audit | `npm run check` |
| Package VSIX | `npm run package` |
| Full gate before a PR | `npm run preflight` |

There is no separate lint or format step — `tsc` with `strict`, `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noUncheckedSideEffectImports` is the type and hygiene gate. Do not weaken those flags to make code compile.

Manual testing: open the repo in VS Code and press `F5` for an Extension Development Host.

## Coding Conventions

- Two-space indentation, LF line endings (`.gitattributes` enforces `eol=lf`), UTF-8, final newline.
- TypeScript: **no semicolons**, single quotes, `PascalCase` for classes and types, `camelCase` for functions and variables, tests named `*.test.ts` under `src/test/`.
- Comments only where behavior is not obvious, especially around API-shape tolerance and security decisions.
- Prefer small, behavior-named tests, e.g. `skips per-chute fallback quota usage when aggregate usage is available`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `build:`).

## Generated Files — Do Not Edit

- `out/` — build output, git-ignored.
- `*.vsix` — packaging output, git-ignored.
- `package-lock.json` — change it only through npm, never by hand.
- `allowScripts` in `package.json` — maintained by `npm approve-scripts`, not manually.

## Assets — Do Not Alter

`media/icon.png`, `media/icon.svg`, and `media/screenshot-chutes-usage.png` are fixed. Do not redesign, recolor, resize, rename, move, or regenerate them. `media/icon.svg` is intentionally a single-color Activity Bar icon while `media/icon.png` is the full-artwork Marketplace icon — that difference is deliberate and documented in `docs/troubleshooting.md`. The icon composition embeds the Chutes mark under the terms described in `NOTICE`.

## Security Rules

- The API key lives **only** in `vscode.SecretStorage`. Never write it to a workspace file, a setting, a log, an error message, or the webview.
- Never log or persist account payloads. The extension keeps no local usage history.
- Every inbound webview message must pass `isWebviewActionMessage` before it reaches an action; every payload the webview receives must pass the validators in `webview/messages.ts` before it is rendered or cached.
- External navigation goes through `getAllowedExternalUri`. Adding a host to that allowlist is a security decision, not a convenience.
- The webview CSP uses a fresh nonce per load with `default-src 'none'`. Do not add `unsafe-eval`, remote origins, or inline scripts.
- Never introduce a new outbound endpoint outside `https://api.chutes.ai` without documenting it in `docs/troubleshooting.md` and the PR privacy section.
- No secrets in the repository, in commits, or in CI logs. Secret scanning and push protection are enabled on GitHub.

## Compatibility And Anti-Breaking-Change Rules

- Do not raise `engines.vscode` or drop APIs that existed at `1.103.0` without an explicit, authorized major bump.
- Do not rename commands, setting keys (`chutesUsageVscode.*`), the view container id, the view id, or the `SECRET_KEY_API_TOKEN` value — these are user-visible or user-persisted contracts.
- Bump `SCHEMA_VERSION` in `webview/main.ts` when the shape of the cached webview payload changes; stale caches must be discarded, never misread.
- API responses may change shape at any time. Extend `normalize.ts` defensively and add a test for the new shape rather than assuming a field exists.
- Prefer showing `--` over a possibly wrong `0` when data cannot be verified.

## Environment Variables

The extension itself reads no environment variables at runtime. Only tooling does:

- `VSCE_PAT` — Visual Studio Marketplace token, used by `vsce publish`.
- `OVSX_PAT` — Open VSX token, used by `ovsx publish`.

Both are supplied by the maintainer at publish time. They are **not** stored in the repository and there are no GitHub Actions secrets configured for them.

## Validation Criteria (mandatory before handing off)

1. `npm ci` succeeds.
2. `npm run compile` succeeds with zero TypeScript errors.
3. `npm test` passes — all suites, no skips.
4. `npm run audit` reports no high or critical advisories.
5. `npm run package` produces a VSIX; inspect it with `npx vsce ls --tree` and confirm it contains only `out/` runtime code, `media/`, and the user-facing root documents — no sources, no maps, no tests, no secrets.
6. `CHANGELOG.md`, `package.json` `version`, `CITATION.cff` `version`, the Git tag, and the GitHub Release must all state the same version.

## Release And Publishing

Versioning is SemVer: patch for fixes, cleanup, and docs; minor for backward-compatible features; major only for authorized breaking changes.

`main` is protected: linear history, one required approving review, and the `build` status check. Work on a dedicated branch and open a pull request — never push directly, never force push, never self-approve.

Release sequence once the PR is merged:

```bash
npm version <patch|minor|major> --no-git-tag-version   # or edit package.json + CITATION.cff together
npm run preflight
git tag v<version> && git push origin v<version>
gh release create v<version> --title "..." --notes-file <notes>
npx vsce publish --packagePath chutes-usage-vscode-<version>.vsix   # needs VSCE_PAT
npx ovsx publish chutes-usage-vscode-<version>.vsix                 # needs OVSX_PAT
```

Publishing is manual by design: there is no publish workflow and no GitHub Actions secret. If `VSCE_PAT` or `OVSX_PAT` is absent, build and tag the release, then stop and report the missing credential — never simulate a publish.

## Repository Visibility Behavior

This repository is public. Assume everything committed here is world-readable forever:

- no internal endpoints, customer data, account identifiers, or unredacted API payloads
- redact sample payloads in issues and tests, keeping field names and numeric values
- keep documentation accurate and free of unverifiable claims, fake badges, or invented statistics
- community files (`CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, issue and PR templates) are part of the public contract — keep them current

## Notes For AI Agents

- Read `README.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `docs/` before proposing changes.
- Keep diffs minimal and focused. Do not reformat untouched files, and do not "modernize" working code without a concrete defect.
- Never disable a test, a compiler flag, or an audit to make a gate pass.
- When you touch `src/types.ts`, check whether `webview/types.ts` and the validators in `webview/messages.ts` need the same change.
- When you touch a user-visible behavior, update `CHANGELOG.md` and the relevant file in `docs/` in the same change.
- Do not create new top-level files unless they are genuinely required; prefer extending an existing document.
