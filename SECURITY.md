# Security Policy

## Supported Versions

Security fixes are applied to the latest published version of the extension.

## Reporting A Vulnerability

Do not open public GitHub issues for sensitive vulnerabilities.

Report security issues privately through one of these channels:

- [GitHub private vulnerability reporting](https://github.com/TheStreamCode/chutes-usage-vscode/security/advisories/new)
- the maintainer contact listed on `https://mikesoft.it`

Include:

- affected version
- reproduction steps
- impact summary
- any proposed mitigation if available

You can expect an initial acknowledgement within seven days and a status update within 30 days.
Disclosure timing is coordinated after the impact and remediation path are understood; please do not
publish details before a fix is available.

## Scope

In scope:

- defects in this repository's code, build scripts, or release artifacts;
- credential or secret exposure caused by this project;
- privilege or sandbox escapes in code shipped by this project.

Out of scope:

- vulnerabilities in third-party products this extension integrates with, such as Chutes or VS Code
  (report them upstream);
- misconfiguration of a user's environment;
- social engineering, spam, or denial-of-service against third-party services.

## Sensitive Data Handling

Never include API keys, account secrets, or unredacted private payloads in public reports.

When sharing payloads for debugging, redact sensitive values while keeping field names and numeric values when possible.
