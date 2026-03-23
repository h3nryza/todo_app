# Project Context

## What This Project Is
**RemindMe** — a cross-platform reminder app (macOS, Windows, Linux, Android, iOS, Web). API-driven, TypeScript monorepo. Simple app that creates reminders with scheduling, subtasks, and push notifications.

## Current State
- **Status**: Phase 1 code complete — all packages build clean, 119 tests passing
- **Code**: 191 source files across 4 packages + infrastructure
  - `packages/shared/` — Types, Zod schemas, schedule utils (73 tests)
  - `packages/api/` — NestJS REST API, 7 modules, Prisma, BullMQ jobs, 5 unit test suites + 5 e2e specs
  - `packages/web/` — React PWA, 7 pages, 11 components, soft modern UI, 8 test suites + 3 Playwright specs
  - `packages/desktop/` — Electron for macOS, tray, notifications, menu
- **CI/CD**: 5 GitHub Actions workflows, Dependabot, CodeQL, Trivy, Husky hooks
- **Security**: STRIDE threat model, security policy, ESLint security plugin, container scanning
- **Design**: Soft modern UI (Things 3/Linear-inspired), neutral palette, indigo accent, dark mode support

## Key Decisions Made (Session 2)
- Auth: Email/password + Google + Apple OAuth
- Hosting: Local dev → Vercel free tier (web), Docker API (portable)
- Name: "RemindMe" temporary — abstracted via APP_NAME constant
- Desktop: macOS .dmg for testing only (no signing)
- Notifications: User-selectable urgency (critical/normal/low)
- Data: Server-side only
- Design: Soft rounded UI, best-in-market modern aesthetic

## Where We Are Going
- Phase 1: API (NestJS) + Web app (React PWA) — **code complete, needs install/test**
- Phase 2: Desktop (Electron for macOS, Windows, Linux) — **macOS shell built**
- Phase 3: Android (Expo/React Native)
- Phase 4: iOS (Expo/React Native)
- Phases 5-7: Advanced features, scaling, integrations

## Next Steps
1. Start Docker (Postgres + Redis): `docker compose -f infrastructure/docker/docker-compose.yml up -d`
2. Run `npx prisma migrate dev --schema packages/api/prisma/schema.prisma` to create database tables
3. Run `npm run dev` to start all packages in dev mode
4. Test the full app end-to-end in browser
5. Create Firebase project for push notifications
6. Set up Vercel deployment for web
7. Build desktop .dmg: `npm run build:mac -w @remindme/desktop`

## Where We Left Off
- Session 2: Built entire Phase 1 codebase from scratch
- All 12 questions answered
- 191 source files, all builds green, 119 tests passing (73 shared + 46 API)
- Commit prefix: none (skipped)
- Dependencies installed, Prisma client generated

## Key Files
- `docs/PRODUCT_SPEC.md` — Product specification
- `docs/DESIGN_SPEC.md` — UI/UX design spec with mockups
- `docs/ARCHITECTURE.md` — Tech stack, repo structure, API endpoints, DB schema
- `docs/THREAT_MODEL.md` — STRIDE threat model
- `docs/SECURITY.md` — Security policy
- `docs/tasks.md` — All phases with task breakdowns
- `docs/questions_for_human.md` — All questions answered
- `claudefiles/decisions/2026-03-22_2_decisions.md` — Design & architecture decisions
