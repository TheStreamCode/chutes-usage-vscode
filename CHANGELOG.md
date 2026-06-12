# Changelog

## 0.4.7

- Unified the `LICENSE` copyright holder to **Michael Gasperini (Mikesoft)**. No functional changes.

## 0.4.6

- Marketplace discoverability: sharper title and summary, expanded keywords.
- Added Marketplace, Open VSX, CI, and GitHub Sponsors badges and a `sponsor` link to the README and package metadata. No functional changes.

## 0.4.5

- Removed the retired $3 Base plan from the Plan Limits reference.
- Kept packaged fallback limits and normalized pricing payloads aligned to the current Plus and Pro subscription tiers.
- Stopped deriving a Base plan from the former $3 monthly subscription price.

## 0.4.4

- Added a dashboard screenshot to the README and Marketplace description.
- Included the screenshot asset in the packaged VSIX while keeping root screenshot artifacts excluded.

## 0.4.3

- Refreshed `README.md` and `CHANGELOG.md` to document the 0.4.x redesign, theme-aware tokens, accessibility additions, state persistence, hardened CSP, Codicons, and the compact status bar.

## 0.4.2

- Fixed a critical visibility bug where `[hidden]` was being overridden by `display: flex/grid/inline-flex` declared on the same elements, causing the loading skeleton, the stale banner, the per-card stale badge, and the current-tier badge to stay visible regardless of state.
- Added a regression test that pins `[hidden] { display: none !important }` so future class-level display rules can no longer leak the issue.
- Tightened `.vscodeignore` to exclude both `.png` and `.jpg` screenshot artifacts, not only `.jpeg`.

## 0.4.1

- Fixed a memory leak where the next-refresh ticker (`setInterval` 1 s) was never cleared; the ticker now pauses on `visibilitychange` and is cleared on `pagehide`.
- Fixed `persistCollapsed` so the Plan Limits collapsed preference is saved even when no cached state exists yet.
- Fixed a stuck refresh button after reopening the side panel from a `loading` cached state; the button now stays enabled when the render comes from cache.
- Made the next-refresh countdown accurate by passing `refreshIntervalMs` from the extension host to the webview through `WebviewStateMessage`; configuring `chutesUsageVscode.refreshIntervalSeconds` now updates the footer countdown immediately.
- Added `KEEP IN SYNC WITH src/types.ts` markers on the type duplicates inside `webview/main.ts` and `webview/presentation.ts` to make future drift easier to spot.
- Polished the hover state for the current tier (preserves the mint tint), gave Codicons `font-display: block` to avoid a flash of unstyled glyphs, and made the compact status bar handle `null` USD values cleanly (`$--/$--` instead of `$0.00/$0`).

## 0.4.0

- Redesigned the dashboard with a modern, minimal look aligned to chutes.ai: pure-black background on dark themes, pill buttons, mint pill badges for units and stale state, headline-violet section titles, natural-case copy (no more `// AWAITING API KEY`), generous whitespace.
- Made the webview theme-aware: backgrounds, foregrounds, borders, and description text now follow `--vscode-*` tokens; mint and violet stay only as accents on progress bars, status dot, badges, and section titles. Light and high-contrast themes are now first-class.
- Eliminated the dashboard flicker. The webview now mounts the DOM once and updates it in place via cached `Text` node references and `style.setProperty('--progress-w', ...)`. No more `app.innerHTML = ''` on every refresh; focus, scroll position, and hover state survive each tick.
- Removed all infinite glow / scan / pulse animations. Only `fadeIn 0.3s` (one-shot at mount) and the progress-bar `width` transition remain. Skeleton shimmer and the refresh spinner are gated behind `prefers-reduced-motion`.
- Added accessibility: `role="progressbar"` with `aria-valuemin/max/now` on every metric card, `role="status" aria-live="polite"` on the stale banner, `role="alert" aria-live="assertive"` on the error state, `aria-label` on icon-only buttons, `aria-hidden="true"` on decorative dots and codicons, and a full `prefers-reduced-motion: reduce` block.
- Persisted the last known dashboard state with `vscode.setState/getState` (schema-versioned) so reopening the side panel no longer flashes a `Loading…` empty state. The Plan Limits collapsed preference is also persisted.
- Added a current-tier highlight in the Plan Limits comparison (the tier matching `PlanInfo.planName` shows a `★ current` badge), per-card stale badge for windows with `status === 'stale'`, and a `refresh in Ns` countdown in the footer.
- Made the Plan Limits section collapsible with `aria-expanded` / `aria-controls` and remembered the open/closed state across sessions.
- Replaced the long status bar text with a compact summary backed by a new `summarizeStatusBarCompact`. The status bar now shows `$(graph) Chutes $X.XX` by default, escalates to `$(graph) Chutes 4h $X.XX/$Y` past 75%, and to `$(warning) Chutes …` with `statusBarItem.warningBackground` past 90%. Errors use `$(error) Chutes` with `statusBarItem.errorBackground`. Loading uses `$(loading~spin) Chutes` and a missing key uses `$(key) Chutes`.
- Switched all unicode glyphs (`⚠`, `↗`, `→`) to real Codicons (`codicon-warning`, `codicon-link-external`, `codicon-arrow-small-right`). The codicon font is bundled into `out/webview/` from `@vscode/codicons` at build time.
- Hardened the webview Content-Security-Policy: a per-load random nonce is now required for the `<script>` tag, and `font-src`/`img-src` directives are scoped to `webview.cspSource` (`img-src` also allows `data:`).
- Added a small zero-deps DOM helper (`webview/dom.ts`) that builds the entire UI without a framework. Shipped extensive bundle-level regression tests for the new render path, ARIA semantics, theme tokens, packaged Codicons, and natural-case copy.

## 0.3.3

- Aligned packaged documentation and release metadata after the plan limits pricing-data clarification.
- Rebuilt the VSIX so Marketplace and GitHub release assets include the latest docs.

## 0.3.2

- Hardened webview-to-extension message handling and external link opening with an HTTPS allowlist.
- Reduced quota refresh fan-out by using aggregate quota usage when available before falling back to per-chute requests.
- Fed pricing data into the plan limits reference and added contributor guidance in `AGENTS.md`.

## 0.3.1

- Finalized naming consistency across all documentation, internal specs, and implementation plans.
- Updated README latest changes section to highlight the 0.3.0 rename.

## 0.3.0

- Renamed the extension display name to `Chutes Usage Monitor` for a clearer identity across the Marketplace and VS Code UI.
- Updated all user-facing references, command categories, view titles, and documentation to reflect the new name.

## 0.2.9

- Clarified dashboard reset and key-removal labels so destructive actions are easier to understand before confirming them.
- Kept the refreshed dashboard UI and `Plan Limits` guidance from `0.2.8` while polishing the last confusing action copy in the current release.

## 0.2.8

- Refined the dashboard UI with cleaner hierarchy, better narrow-sidebar behavior, and clearer onboarding/error states while keeping the existing cyber visual effects.
- Replaced the raw quotas table with a curated `Plan Limits` reference section for Base, Plus, and Pro subscription limits.
- Fixed dashboard action behavior so destructive key removal is presented more safely and stale refresh failures are surfaced inline.

## 0.2.7

- Refreshed the Marketplace PNG icon artwork while keeping the dedicated single-color sidebar icon unchanged.

## 0.2.6

- Refreshed the extension branding with a new Marketplace icon and a dedicated single-color Activity Bar/sidebar icon.
- Updated the public docs and release notes to reflect the current icon behavior and latest release.

## 0.2.5

- Fixed a webview bootstrap regression that could leave the sidebar blank with only the background visible.
- Switched the dashboard webview bootstrap to browser-safe ES modules and added regression tests to prevent CommonJS output from breaking the UI again.

## 0.2.4

- Fixed overlapping refreshes so stale responses and removed API keys can no longer overwrite the latest dashboard state.
- Fixed the sidebar to receive the current snapshot as soon as it opens, refresh again when the view becomes visible, and keep stale data visible during temporary refresh errors.
- Restored the status bar click action and made runtime settings updates apply immediately without reloading the extension.

## 0.2.3

- Reworked the public documentation into a cleaner user-facing structure.
- Added dedicated user guide and troubleshooting docs, and streamlined support, security, and contributing guidance.

## 0.2.2

- Reorganized the public documentation for a cleaner Marketplace and repository presentation.

## 0.2.1

- Removed the non-working status bar click action and its misleading tooltip hint.

## 0.2.0

- Republished the extension under the new Marketplace identity `mikesoft.chutes-usage-vscode`.
- Removed development-only debug logging and cleaned up legacy command, view, and settings identifiers.

## 0.1.8

- Switched daily quota sync to prefer `quota_usage/me` with `invocations/stats/llm` as a live cross-check.
- Show `--` with a sync delay hint instead of a stale `0`, and treat `quota: 0` as `Unlimited`.

## 0.1.7

- Added runtime debug logging for quota usage diagnostics.
- Avoid showing a stale `0` daily usage value when live quota usage cannot be verified.

## 0.1.6

- Fixed daily quota usage so live request counts override stale daily values from subscription payloads.
- Switched quota usage fetching to documented per-chute endpoints and aggregate multi-entry responses correctly.

## 0.1.5

- Fixed publisher identity alignment for marketplace publishing.
- Refreshed the packaged extension icon colors.

## 0.1.4

- Improved packaging and marketplace metadata.

## 0.1.3

- Minor UI refinements.

## 0.1.2

- First public-ready release with stabilized usage parsing, daily quota usage support, improved sidebar UI, and repository polish for open-source publishing.

## 0.1.1

- Documentation and repository metadata updates.

## 0.1.0

- Repository and release process improvements.

## 0.0.9

- Improved plan and tier handling.
- Documentation updates.

## 0.0.8

- Improved daily quota handling.

## 0.0.7

- Improved compatibility with live Chutes usage payloads.
- Improved plan summary details.

## 0.0.6

- Improved API response parsing resilience.
- Fixed extension packaging for webview assets.

## 0.0.5

- Improved plan summary and usage visibility.

## 0.0.4

- Refreshed the sidebar UI.

## 0.0.3

- Improved usage parsing and quota labeling.

## 0.0.2

- Improved quota parsing and local data cleanup behavior.

## 0.0.1

- Initial development scaffold.
