# Security Policy

## Supported Versions

Ultimate Cyberpunk 2077 is currently in its initial release series. Security fixes are provided for the latest published release and the current `main` branch.

| Version                        | Supported |
| ------------------------------ | --------- |
| 0.1.x                          | ✅        |
| Current `main` branch          | ✅        |
| Earlier or unreleased versions | ❌        |

When a newer release series is published, older versions may stop receiving security updates. Users should update to the latest available release.

## Project Security Model

Ultimate Cyberpunk 2077 is a local-first web application.

At the time of writing:

- The application does not provide user accounts or authentication.
- The application does not use a server-side application database.
- Playthroughs, notes, settings, and other user-created data are stored locally in the user's browser through IndexedDB.
- The project does not intentionally transmit locally stored playthrough data to the project maintainers.
- The production deployment collects anonymous, cookie-free page-view analytics through Vercel Web Analytics. Reported URLs are redacted to origin and pathname only (query strings and hashes are stripped before each event is sent), so share links such as `/builds?b=…` and other query-backed routes never expose user-created data. No IndexedDB records, notes, or settings are transmitted.
- The production application is hosted through Vercel.
- Source code and development activity are publicly available through GitHub.

A vulnerability may still affect user data, browser behavior, dependency integrity, deployment security, or the software supply chain.

## Reporting a Vulnerability

Please do not disclose an unpatched vulnerability through a public GitHub issue, discussion, pull request, or social-media post.

The preferred reporting method is GitHub Private Vulnerability Reporting:

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Submit the report privately.

If private vulnerability reporting is unavailable, contact the repository owner privately before making the issue public.

A useful report should include:

- A clear description of the vulnerability.
- The affected route, component, file, release, or commit.
- The security impact.
- Reproduction steps.
- A minimal proof of concept when appropriate.
- Browser, operating system, and device information.
- Whether the issue affects local development, preview deployments, production, or all environments.
- Any suggested mitigation or fix.
- Whether the vulnerability has already been disclosed elsewhere.

Please avoid including unnecessary personal information, credentials, access tokens, private browser data, or copyrighted game files.

## Response Process

The maintainer will make a reasonable effort to:

- Acknowledge the report within three business days.
- Perform an initial assessment within seven business days.
- Request additional information when reproduction is incomplete.
- Provide a status update at least every fourteen days while a confirmed issue remains unresolved.
- Coordinate a reasonable disclosure date when the vulnerability is valid.
- Credit the reporter when requested and appropriate.

These timeframes are targets rather than contractual guarantees. Response and remediation time may vary based on severity, reproducibility, maintainer availability, and upstream dependencies.

If the report is accepted, the maintainer may:

- Prepare a private fix.
- Add regression tests.
- Update affected dependencies.
- Publish a patched release.
- Request a CVE or GitHub Security Advisory when appropriate.
- Coordinate disclosure after users have had a reasonable opportunity to update.

If the report is declined, the maintainer will attempt to explain why it is not considered a security vulnerability or why it falls outside the project's scope.

## In-Scope Vulnerabilities

Examples of issues that may be considered security vulnerabilities include:

- Cross-site scripting or unintended script execution.
- Unsafe handling of imported data.
- Malicious imports that can corrupt or overwrite unrelated local data.
- Exposure or transmission of locally stored user data without clear consent.
- Path traversal, arbitrary file access, or unsafe file generation.
- Injection vulnerabilities.
- Dependency or software-supply-chain compromises.
- GitHub Actions workflows that expose secrets or grant excessive permissions.
- Deployment configuration that exposes private credentials.
- Unauthorized modification of production deployments.
- Security-header bypasses with a demonstrated impact.
- Vulnerabilities in future authentication, API, synchronization, or cloud-storage features.

## Out-of-Scope Reports

The following are generally outside the scope of this policy unless they demonstrate a concrete security impact on this project:

- Vulnerabilities in Cyberpunk 2077, Phantom Liberty, CD Projekt Red services, or game clients.
- Vulnerabilities in external websites linked from the resource directory.
- Broken or outdated external links.
- Missing security headers without a demonstrated exploit or meaningful risk.
- Automated scanner output without manual validation.
- Dependency version reports that are already covered by Dependabot and have no applicable exploit path.
- Self-cross-site scripting that requires a user to paste code into developer tools.
- Attacks requiring full control of the user's operating system, browser profile, or physical device.
- Denial-of-service testing or excessive automated traffic against the production deployment.
- Social engineering, phishing, or credential attacks against maintainers.
- Public disclosure of secrets that are fake, expired, revoked, or used only as documented examples.
- Cosmetic UI defects.
- Gameplay-data inaccuracies, spoilers, balancing disagreements, or content-source disputes.
- Intellectual-property or content-removal requests, which should follow the process described in the README.

## Safe Testing Guidelines

Security research must be conducted responsibly.

Please:

- Test against your own browser data and accounts.
- Use preview or local environments whenever possible.
- Avoid destructive testing against production.
- Do not attempt to access another person's device, browser profile, GitHub account, or Vercel account.
- Do not use denial-of-service techniques.
- Do not retain, publish, or distribute sensitive information.
- Stop testing and report the issue if you encounter credentials, tokens, or private data.
- Give the maintainer a reasonable opportunity to investigate and patch the issue before public disclosure.

Good-faith research that follows these guidelines will not be treated as malicious activity by the project maintainer.

## Security Updates

Security-related fixes may be delivered through:

- A patch release.
- A GitHub Security Advisory.
- A dependency update.
- A deployment configuration change.
- A documented mitigation when an immediate code fix is unavailable.

Users should run the latest supported release and keep their browser updated.

## Bug Bounty

This project does not currently operate a paid bug-bounty program. Reports are welcomed and may receive public credit with the reporter's permission.
