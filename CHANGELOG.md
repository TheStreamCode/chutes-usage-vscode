# Changelog

## 0.1.9

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
