# Chutes Usage Monitor Design

## Goal

Build a user-friendly VS Code extension that shows Chutes subscription usage, rolling usage windows, and quotas in a simple and modern interface.

## Product Positioning

`Chutes Usage Monitor` is a third-party utility for the Chutes service.

It is not an official Chutes extension and must clearly state this in the README, Marketplace listing, and in-app onboarding copy.

Author attribution:
- Michael Gasperini
- `mikesoft.it`

Distribution targets:
- VS Code Marketplace
- public GitHub repository

## User Experience

Primary experience:
- one compact status bar item for quick visibility
- one Activity Bar icon with a sidebar dashboard for details

The extension should feel easy to use for first-time users:
- clear onboarding
- very few settings
- readable labels
- obvious refresh actions
- error states that explain what the user should do next

## Design Direction

Visual direction:
- inspired by Chutes
- more native to VS Code
- dark, clean, and metric-first

UI characteristics:
- compact header
- clear progress sections
- big numeric values
- soft card layout
- limited color palette
- strong readability in narrow sidebars

## Main Views

### Status Bar

Shows a short summary like:

`Chutes $55.34/$100 | 4h $0/$8.33 | 0/5000`

Behavior:
- click opens the dashboard
- loading shows spinner
- missing API key prompts setup

### Sidebar Dashboard

Sections:
- Header with connection status and actions
- Billing cycle usage card
- 4-hour usage card
- Daily usage card
- Quotas table
- Footer with last update info

## Data Sources

Confirmed useful APIs:
- `GET /users/me/subscription_usage`
- `GET /users/me/quotas`
- `GET /pricing`
- `GET /model_aliases/`

The extension should tolerate incomplete or evolving response shapes by using a normalization layer.

## Security

The user provides an API key.

Rules:
- store it only in VS Code `SecretStorage`
- never store it in workspace files
- never send it into the webview
- never log it

## Reliability

Refresh model:
- default polling every 60 seconds
- refresh on demand
- refresh when the sidebar becomes visible
- refresh when VS Code regains focus

## Scope For V1

Included:
- onboarding with API key
- status bar summary
- sidebar dashboard
- quotas table
- loading and error states
- documentation and marketplace setup

Excluded:
- historical analytics
- notifications
- weekly window assumptions unless returned by the API

## Testing Strategy

Core logic must be written test-first for:
- API normalization
- state transitions
- status bar summary generation

## Success Criteria

The extension is successful when a user can:
- install it
- set an API key in less than one minute
- immediately understand their current Chutes usage
- recognize monthly, 4-hour, and daily limits without reading docs
- trust that it is unofficial but safe and useful
