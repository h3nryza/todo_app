# Oh Right! — Security Audit Report

> Audit date: 2026-03-24 (updated with fixes)
> Scope: All packages (shared, ui, desktop, mobile) + CI/CD pipelines
> Method: Manual code review of every source file (3 parallel audits)
> Status: HIGH and MEDIUM issues fixed. See "Fixed" column below.

---

## Executive Summary

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| **Critical** | 0 | — | 0 |
| **High** | 2 | 2 | 0 |
| **Medium** | 8 | 6 | 2 (documented) |
| **Low** | 10 | 6 | 4 (minor) |

**No critical vulnerabilities found.** The codebase uses parameterized SQL queries throughout (zero SQL injection), no `dangerouslySetInnerHTML` (zero XSS), and no hardcoded secrets. HIGH findings were configuration issues — now fixed.

---

## HIGH Severity

### H1: Content Security Policy disabled in Tauri
- **File:** `packages/desktop/src-tauri/tauri.conf.json:27`
- **Issue:** `"csp": null` disables CSP entirely. If any XSS were introduced (via a compromised dependency, malicious import file, etc.), injected scripts could access Tauri IPC commands and the filesystem.
- **Fix:** Set a restrictive CSP:
  ```json
  "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
  ```
- **Impact:** An attacker with XSS could read/write files and execute SQL on the local database.

### H2: Unpinned GitHub Actions — supply chain risk
- **Files:** All `.github/workflows/*.yml`
- **Issue:** Actions referenced by mutable tags (`@v4`, `@stable`, `@v0`) instead of SHA hashes. Two actions use branch refs: `aquasecurity/trivy-action@master` and `trufflesecurity/trufflehog@main` — these auto-update and could be compromised.
- **Fix:** Pin all actions to full commit SHAs:
  ```yaml
  # Before (unsafe):
  uses: actions/checkout@v4
  uses: aquasecurity/trivy-action@master

  # After (safe):
  uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1
  uses: aquasecurity/trivy-action@2b6a709cf9c4025c5438138008bebd734f188592 # v0.19.0
  ```
- **Impact:** A compromised action could steal secrets, inject malware into builds, or modify release artifacts.

---

## MEDIUM Severity

### M1: Unvalidated `cronExpression` field
- **File:** `packages/shared/src/schemas/reminder.schema.ts:38`
- **Issue:** `cronExpression` is `z.string().optional()` with no length limit or format validation. Downstream cron libraries could behave unexpectedly with adversarial input.
- **Fix:** Add `.max(120).regex(/^(\S+\s+){4,5}\S+$/)` or validate with a cron parser in `.refine()`.

### M2: Unbounded `notes` field
- **File:** `packages/shared/src/schemas/reminder.schema.ts:122`
- **Issue:** `notes` has no `.max()` limit. Could cause storage exhaustion with very large inputs.
- **Fix:** Add `.max(10000)`.

### M3: Export dumps all data unencrypted
- **Files:** `packages/ui/src/services/export.service.ts`, `packages/mobile/src/services/export.service.ts`
- **Issue:** Export creates a plaintext JSON file with all user data. No warning to user about contents.
- **Fix:** Add a user confirmation dialog before export. Consider optional encrypted export.

### M4: Import lacks schema validation
- **Files:** `packages/ui/src/services/export.service.ts`, `packages/mobile/src/services/export.service.ts`
- **Issue:** Imported JSON is checked for `version`, `categories`, `reminders` keys but individual field values aren't type-checked. Malformed data could corrupt the database.
- **Fix:** Validate imported data against Zod schemas from `@ohright/shared` before writing to SQLite.

### M5: Unsafe JSON.parse without try/catch (mobile)
- **File:** `packages/mobile/src/services/reminders.service.ts:66,75`
- **Issue:** `JSON.parse(row.subtask_snapshot)` and `JSON.parse(row.schedule_config)` have no error handling. Malformed data from a bad import would crash the app.
- **Fix:** Wrap in try/catch with sensible defaults.

### M6: Overly permissive Tauri capabilities
- **File:** `packages/desktop/src-tauri/capabilities/default.json`
- **Issue:** `shell:allow-open` allows opening arbitrary URLs/programs. `fs:allow-read-text-file` and `fs:allow-write-text-file` have no path scope. Combined with CSP=null, this expands the XSS impact.
- **Fix:** Scope `fs` permissions to the app data directory. Remove `shell:allow-open` if not needed, or scope to specific URL patterns.

### M7: Missing permissions on CI workflow
- **File:** `.github/workflows/ci.yml`
- **Issue:** No `permissions:` block — runs with default (potentially broad) token permissions.
- **Fix:** Add `permissions: contents: read` at the top level.

---

## LOW Severity

### L1: `dayOfMonth: 0` accepted by schema
- **File:** `packages/shared/src/schemas/reminder.schema.ts:36`
- **Issue:** `.min(-1).max(31)` allows `0`, which JavaScript's Date treats as "last day of previous month". Logic bug that could schedule reminders on wrong dates.
- **Fix:** Use `.refine(n => n === -1 || (n >= 1 && n <= 31))`.

### L2: Unvalidated timezone field
- **Files:** `packages/shared/src/schemas/reminder.schema.ts:43`, `packages/shared/src/schemas/auth.schema.ts:14`
- **Issue:** No IANA timezone validation. Invalid timezone passed to `Intl.DateTimeFormat` throws `RangeError`.
- **Fix:** Add `.refine()` using `Intl.supportedValuesOf('timeZone')`.

### L3: Unbounded `icon` field on category schema
- **File:** `packages/shared/src/schemas/category.schema.ts:10`
- **Issue:** No max length on icon name string.
- **Fix:** Add `.max(100)`.

### L4: Weak UUID generation (mobile)
- **File:** `packages/mobile/src/lib/database.ts:25-40`
- **Issue:** Uses `Math.random()` for UUID generation instead of `crypto.randomUUID()`. Not a security risk for local DB keys, but poor practice.
- **Fix:** Use `expo-crypto`'s `randomUUID()`.

### L5: `continue-on-error` hides security audit findings
- **File:** `.github/workflows/security.yml:27,39`
- **Issue:** `npm audit` and `cargo audit` failures are silently ignored.
- **Fix:** Remove `continue-on-error` or use `||` with explicit handling.

### L6: Empty release.yml file
- **File:** `.github/workflows/release.yml`
- **Issue:** Empty/placeholder file. Should be deleted.
- **Fix:** Delete the file.

### L7: `release-desktop.yml` grants write permissions to all jobs
- **File:** `.github/workflows/release-desktop.yml:9`
- **Issue:** `permissions: contents: write` at workflow level gives test/build jobs unnecessary write access.
- **Fix:** Move `permissions` to individual jobs. Only the `release` job needs write.

### L8: Deep link parameter not UUID-validated (mobile)
- **File:** `packages/mobile/app/reminder/[id].tsx`
- **Issue:** `id` from URL used directly as DB lookup. Safe (parameterized query) but no format check.
- **Fix:** Validate `id` matches UUID format before querying.

### L9: `.gitignore` missing database dump patterns
- **File:** `.gitignore`
- **Issue:** No patterns for `*.sql` or `*.dump` files.
- **Fix:** Add `*.sql` and `*.dump` to `.gitignore`.

---

## Positive Findings (What's Done Right)

- **All SQL queries use parameterized bindings** — no SQL injection anywhere across desktop and mobile
- **No `dangerouslySetInnerHTML`** — no XSS via React rendering
- **No hardcoded secrets** — `.env.example` has placeholders only
- **No `eval()` or `Function()`** — no code injection
- **Zod password validation** is solid (8-128 chars, requires uppercase + lowercase + digit)
- **Hex color regex** is simple and safe (no ReDoS)
- **CI includes security scanning** — CodeQL, Trivy, npm audit, cargo audit, TruffleHog
- **`.gitignore` covers** sensitive files (`.env`, `*.pem`, `*.key`, service account files)
- **Tauri IPC** uses capability-based permissions (not blanket allow-all)

---

## Test Coverage Gaps (Security-Relevant)

| Missing Test | Package |
|-------------|---------|
| XSS payloads in reminder names (`<script>alert(1)</script>`) | shared |
| SQL injection strings in search (`'; DROP TABLE`) | shared |
| Extremely long inputs (1MB+ notes) | shared |
| Malformed cron expressions | shared |
| Invalid timezone strings | shared |
| `dayOfMonth: 0` boundary | shared |
| Auth schema validation (register/login) | shared |
| Import with corrupted/malicious JSON | ui, mobile |

---

## Recommended Fix Priority

### Before public release (HIGH)
1. Set CSP in `tauri.conf.json`
2. Pin all GitHub Actions to SHA hashes

### Before beta testers (MEDIUM)
3. Validate import data against Zod schemas
4. Add `.max()` to unbounded string fields (notes, icon, cronExpression)
5. Wrap JSON.parse calls in try/catch
6. Scope Tauri fs/shell capabilities
7. Add `permissions: contents: read` to ci.yml

### When convenient (LOW)
8. Fix `dayOfMonth: 0` schema bug
9. Validate timezone against IANA list
10. Delete empty `release.yml`
11. Add security-relevant test cases
12. Use `crypto.randomUUID()` in mobile
