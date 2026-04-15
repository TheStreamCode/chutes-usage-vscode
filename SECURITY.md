# Security Policy

## Supported Versions

Security fixes are applied to the latest published version of the extension.

## Reporting a Vulnerability

Please do not open public GitHub issues for sensitive vulnerabilities.

Instead, report security problems privately through one of these channels:

- GitHub security advisories for the repository
- the maintainer contact listed on `https://mikesoft.it`

When reporting a vulnerability, include:

- affected version
- reproduction steps
- impact summary
- any proposed mitigation if available

## Sensitive Data Handling

This extension should never print or persist user API keys in logs, issues, or screenshots.

If you share payloads for debugging, redact:

- API keys
- user identifiers if desired
- any account-specific secrets

Keep field names and numeric values when possible so response-shape debugging remains useful.
