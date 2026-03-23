# TODO — Henry

Personal backlog items for What I Would Forget.

---

## Security Tooling

### Snyk
- [ ] Set up Snyk account and integrate with GitHub repo
- [ ] Replace/supplement npm audit with `snyk test` in CI
- [ ] Configure Snyk monitor for continuous dependency monitoring
- [ ] Snyk Container scanning (if Docker images added later)
- [ ] Snyk IaC scanning (if infrastructure-as-code added)
- [ ] Add Snyk badge to README

### CodeQL
- [ ] Investigate CodeQL failures — likely needs `security-events: write` permission and `github/codeql-action/init@v3`
- [ ] CodeQL requires the repo to have GitHub Advanced Security enabled (free for public repos, paid for private)
- [ ] Workaround: use CodeQL locally via `codeql database create` + `codeql database analyze`
- [ ] Alternative: Semgrep (open source SAST, drop-in replacement, no permission issues)
- [ ] If re-enabling: add `codeql` job back to `security.yml` with explicit `permissions: security-events: write`

### Trivy
- [x] Filesystem vulnerability scan ✅ (in CI)
- [x] SBOM generation (CycloneDX + SPDX) ✅ (in CI)
- [x] Per-platform security dashboards ✅ (in release workflow)
- [ ] Add Trivy to pre-commit hook for local dev scanning
- [ ] Configure `.trivyignore` for known accepted risks
- [ ] Trivy license scanning (`trivy fs --scanners license`)
- [ ] Trivy misconfig scanning for Tauri/Cargo configs

### Single Pane of Glass — SonarQube / SonarCloud
- [ ] Evaluate SonarCloud (free for open source) vs self-hosted SonarQube
- [ ] SonarCloud integrates with GitHub PRs — shows code smells, bugs, security hotspots, coverage
- [ ] Set up `sonar-project.properties` in repo root
- [ ] Add SonarCloud GitHub Action to CI pipeline
- [ ] Configure quality gate (e.g., no new bugs, >80% coverage on new code, no security hotspots)
- [ ] SonarCloud dashboard URL: would be the "single pane of glass" for code quality + security
- [ ] Alternative: Grafana + Prometheus if you want a custom dashboard aggregating multiple tools

---

## Future Enhancements
- [ ] Android build (Tauri v2 mobile — experimental, revisit when stable)
- [ ] iOS build (requires Apple Developer account)
- [ ] Code signing: Apple Developer ID for macOS notarization
- [ ] Code signing: Windows Authenticode certificate
- [ ] Auto-update via Tauri's built-in updater
- [ ] Notification repeat for high-priority reminders
- [ ] Quiet hours implementation
- [ ] Cloud sync (optional, opt-in)
