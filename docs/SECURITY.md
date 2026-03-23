# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.x     | Yes (current dev)  |

Once RemindMe reaches 1.0, only the latest minor release will receive security patches.

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report vulnerabilities by emailing **security@remindme.app** (or via GitHub's private vulnerability reporting feature on this repository).

Include the following in your report:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

| Action                     | Target     |
| -------------------------- | ---------- |
| Acknowledgement            | 48 hours   |
| Initial assessment         | 5 days     |
| Fix development            | 14 days    |
| Public disclosure (coordinated) | 30 days |

We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Security Features Implemented

### Authentication & Authorization

- **JWT-based authentication** with short-lived access tokens (15 minutes) and refresh token rotation
- **httpOnly, Secure, SameSite cookies** for token storage
- **Password hashing** with bcrypt (cost factor 12)
- **OAuth 2.0** support (Google) via Passport.js
- **Ownership validation** on every data access query

### Input Validation & Injection Prevention

- **Zod schemas** for API request validation (shared package)
- **class-validator** decorators on DTOs
- **Parameterized queries** via Prisma ORM (no raw SQL)
- **Content Security Policy** headers on the web client

### Rate Limiting

- Global rate limit: 100 requests per minute per IP
- Authentication endpoints: 10 requests per minute per IP
- Implemented via `@nestjs/throttler`

### Transport Security

- HTTPS enforced in production
- HSTS headers enabled
- Security headers via Helmet middleware:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Dependency Security

- Dependabot enabled for automated dependency updates
- `npm audit` runs in CI on every push
- Trivy scans for filesystem and Docker image vulnerabilities
- GitHub CodeQL analysis for static application security testing
- Dependency review on every pull request

### Error Handling

- Structured error responses with no stack traces in production
- Centralized exception filter to prevent information leakage
- Request logging via Pino (no sensitive data logged)

## Disclosure Policy

We follow coordinated disclosure. If you report a vulnerability:

1. We will acknowledge receipt within 48 hours.
2. We will provide an estimated timeline for a fix.
3. We will notify you when the fix is released.
4. We request that you do not disclose the vulnerability publicly until we have released a fix or 30 days have passed, whichever comes first.

## Security Configuration for Self-Hosting

If you are self-hosting RemindMe:

1. **Always use HTTPS** in production (terminate TLS at your reverse proxy)
2. **Set strong secrets** for `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (minimum 32 characters, randomly generated)
3. **Restrict database access** to the API server only (no public-facing Postgres)
4. **Enable Redis AUTH** in production
5. **Use environment variables** for all secrets (never commit `.env` files)
6. **Keep dependencies updated** by monitoring Dependabot alerts
