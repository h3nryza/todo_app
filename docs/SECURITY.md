# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | Yes (current dev)  |

Once Oh Right! reaches 1.0, only the latest minor release will receive security patches.

## Architecture

Oh Right! is a **local-first desktop application** built with Tauri v2. There is no server component -- all data is stored locally on the user's machine in a SQLite database.

This means:

- There is no remote API to attack
- There are no user accounts or authentication flows
- Data never leaves the user's machine unless they explicitly export it

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities via GitHub's [private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) feature on this repository.

Include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action                             | Target   |
| ---------------------------------- | -------- |
| Acknowledgement                    | 48 hours |
| Initial assessment                 | 5 days   |
| Fix development                    | 14 days  |
| Public disclosure (coordinated)    | 30 days  |

We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Features

### IPC Sandboxing (Tauri v2 Capabilities)

- The webview (React UI) can only invoke explicitly allowed Tauri commands
- Tauri v2's capabilities system restricts which APIs the frontend can access
- All IPC command inputs are validated with Zod schemas

### Input Validation

- **Zod schemas** validate all data at the IPC boundary (shared package)
- Import files are validated against schemas before processing
- Size limits enforced on imports to prevent resource exhaustion

### Local Data Security

- SQLite database stored in the OS-standard application data directory
- File permissions are set to the current user only
- No sensitive tokens, passwords, or credentials are stored by the app
- Production builds disable webview developer tools

### Code Signing and Updates

- Release builds are code-signed to verify integrity
- Auto-updates are delivered via GitHub Releases over HTTPS
- Tauri's built-in updater verifies signatures before applying updates

### Dependency Security

- Dependabot enabled for npm and Cargo dependency updates
- `npm audit` runs in CI on every push
- `cargo audit` runs in CI for Rust dependencies
- Trivy filesystem scan for known vulnerabilities
- CodeQL static analysis for TypeScript
- Dependency review on every pull request

## Disclosure Policy

We follow coordinated disclosure. If you report a vulnerability:

1. We will acknowledge receipt within 48 hours.
2. We will provide an estimated timeline for a fix.
3. We will notify you when the fix is released.
4. We request that you do not disclose the vulnerability publicly until we have released a fix or 30 days have passed, whichever comes first.
