# Security Policy — Oh Right

## Architecture

**Oh Right** (Oh Right) is a **local-first** desktop application. All data is stored locally on the user's device in an SQLite database. There is no remote server, no cloud sync, no API, and no user accounts.

### Data Flow

```
User → Tauri WebView (React UI) → Tauri IPC → SQLite (local file)
```

- **No network requests** — the app functions entirely offline
- **No telemetry** — no data is sent to any remote server
- **No authentication** — single-user, local-only
- **No cookies/sessions** — no web-based auth

### Technology Stack

| Layer | Technology | Security Notes |
|-------|-----------|----------------|
| Frontend | React 18 + TypeScript | CSP configured in Tauri, no inline scripts |
| Desktop Shell | Tauri 2 (Rust) | Sandboxed WebView, capability-based permissions |
| Database | SQLite (via tauri-plugin-sql) | Local file, no network exposure |
| Notifications | tauri-plugin-notification | OS-level permission required |
| File I/O | tauri-plugin-fs | Scoped to app data directory |

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |
| < 1.0   | No        |

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Email: security@ohright.app (or use GitHub's private vulnerability reporting)
3. Include: description, reproduction steps, impact assessment
4. We will acknowledge within 48 hours and provide a fix timeline within 7 days

## Security Controls

### Build Pipeline

| Control | Tool | Stage |
|---------|------|-------|
| SAST | CodeQL | CI (every PR + push to main) |
| SCA (JS) | npm audit + Dependency Review | CI (every PR) |
| SCA (Rust) | cargo audit | CI (every PR) |
| Secrets Detection | TruffleHog | CI (every PR) |
| Vulnerability Scan | Trivy (filesystem) | CI + weekly schedule |
| SBOM Generation | Trivy (CycloneDX + SPDX) | CI (every build) |
| Dependency Updates | Dependabot | Weekly (automated PRs) |
| License Compliance | Dependency Review | CI (blocks GPL-3.0, AGPL-3.0) |

### Application Security

| Control | Implementation |
|---------|---------------|
| Content Security Policy | Configured in `tauri.conf.json` |
| Capability Permissions | Minimal: SQL, notification, dialog, fs (scoped) |
| Input Validation | Zod schemas on all user input |
| SQL Injection Prevention | Parameterized queries ($1, $2, etc.) |
| XSS Prevention | React's built-in escaping + CSP |
| Local Storage | SQLite file in OS-protected app data directory |

### Tauri Capabilities (Principle of Least Privilege)

The app requests only these permissions:
- `sql:*` — Read/write to local SQLite database
- `notification:*` — Send local notifications (requires OS permission)
- `dialog:save/open` — File save/open dialogs for import/export
- `fs:read-text-file/write-text-file` — Read/write for import/export only
- `shell:allow-open` — Open URLs in default browser

No network, HTTP, or WebSocket permissions are granted.

## SBOM (Software Bill of Materials)

SBOMs are generated automatically on every CI build in two formats:
- **CycloneDX** (`sbom.cdx.json`) — Industry standard, machine-readable
- **SPDX** (`sbom.spdx.json`) — Linux Foundation standard

Download from the latest CI run's artifacts, or generate locally:

```bash
# Requires trivy installed
trivy fs --format cyclonedx --output sbom.cdx.json .
trivy fs --format spdx-json --output sbom.spdx.json .
```

## Dependency Trees

### JavaScript/TypeScript
```bash
npm ls --all
```

### Rust
```bash
cd packages/desktop/src-tauri && cargo tree
```

These are also generated as CI artifacts on every build.

## Threat Model

See `docs/THREAT_MODEL.md` for the full STRIDE analysis.

### Key Risks (Local-First App)

| Threat | Risk | Mitigation |
|--------|------|------------|
| Local file tampering | Medium | SQLite file permissions, OS-level protection |
| Malicious import file | Low | Zod validation on imported JSON |
| Dependency supply chain | Medium | Dependabot, npm audit, cargo audit, Trivy |
| Notification spoofing | Low | OS-level notification permissions |
| Memory disclosure | Low | Rust backend (memory safe), no sensitive secrets in memory |

## Compliance

- No PII is collected or transmitted
- No GDPR/CCPA obligations (no data processing)
- All data remains on the user's device
- User can export/delete all data at any time via Settings
