# Security

## Supported version

Only the latest published version of Atlas receives security updates.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private vulnerability reporting feature on the repository's **Security** tab.

Include the affected version, reproduction steps, expected impact, and any relevant screenshots. Please allow time to investigate before publicly disclosing the issue.

## Security model

Atlas is an offline-first desktop application. It does not collect personal information, create user accounts, load remote application code, or transmit quiz results. The Electron renderer runs with Node.js disabled, context isolation enabled, Chromium sandboxing enabled, navigation blocked, new windows blocked, and a restrictive Content Security Policy. Its preload bridge exposes one read-only operation for loading bundled geography data.

Local progress is stored through the browser's local storage on the user's computer.
