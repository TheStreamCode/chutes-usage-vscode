# Chutes Usage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user-friendly VS Code extension that securely shows Chutes usage and quotas through a status bar item and a sidebar dashboard.

**Architecture:** The extension host manages authentication, API calls, state, commands, and status bar updates. A single sidebar webview renders normalized data snapshots received through message passing.

**Tech Stack:** TypeScript, VS Code Extension API, SecretStorage, WebviewView, pnpm, unit tests.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.vscodeignore`
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `LICENSE`

- [ ] Create the base extension manifest with commands, one custom view container, one sidebar view, and three settings.
- [ ] Add TypeScript compilation and test scripts using `pnpm`.
- [ ] Add packaging ignore rules and repository metadata.

### Task 2: Domain types and tests

**Files:**
- Create: `src/types.ts`
- Create: `src/services/normalize.ts`
- Create: `src/test/normalize.test.ts`

- [ ] Write failing tests for monthly, 4-hour, daily, and quotas normalization.
- [ ] Implement the minimal normalized model and parsing helpers.
- [ ] Verify the tests pass.

### Task 3: Extension host core

**Files:**
- Create: `src/extension.ts`
- Create: `src/services/SecretStore.ts`
- Create: `src/services/ChutesApiClient.ts`
- Create: `src/state/DashboardStore.ts`

- [ ] Write failing tests for state transitions and summary generation.
- [ ] Implement secure secret storage.
- [ ] Implement API client and store refresh logic.
- [ ] Verify tests pass.

### Task 4: VS Code integration

**Files:**
- Create: `src/status/StatusBarController.ts`
- Create: `src/views/ChutesWebviewProvider.ts`

- [ ] Implement commands for setup, refresh, open dashboard, and remove key.
- [ ] Implement a single status bar item.
- [ ] Implement a single sidebar webview provider.

### Task 5: Sidebar UI

**Files:**
- Create: `webview/index.html`
- Create: `webview/main.ts`
- Create: `webview/styles.css`

- [ ] Build a simple dashboard with onboarding, loading, ready, and error states.
- [ ] Keep the layout friendly in a narrow VS Code sidebar.
- [ ] Use VS Code theme variables with Chutes-inspired accents.

### Task 6: Docs and packaging polish

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `media/icon.svg`

- [ ] Add setup instructions, disclaimer, author attribution, and GitHub repo references.
- [ ] Add screenshots and extension description text for the marketplace.

### Task 7: Verification

**Files:**
- Modify as needed

- [ ] Run `pnpm install`.
- [ ] Run `pnpm run compile`.
- [ ] Run `pnpm run test`.
- [ ] Fix any build or test issues.
