# Changelog

> Immutable, append-only log of all changes. Entries are never modified or deleted.

---

| Timestamp | Actor | Change | Why | References |
|-----------|-------|--------|-----|------------|
| 2026-03-22T10:00:00Z | Claude | Prime Directive activated — session initialized | First full session under Prime Directive governance | `learning/sessions/2026-03-22_session.md` |
| 2026-03-22T10:02:00Z | Claude | Archived original PRODUCT_PLAN.md to `/archive/PRODUCT_PLAN_v1_archived.md` | Complete product pivot — old plan no longer relevant | Session log 10:02 |
| 2026-03-22T10:02:01Z | Claude | Created full documentation suite in `/docs/` — PRODUCT_SPEC.md, DESIGN_SPEC.md, ARCHITECTURE.md, ideas.md, recommendations.md, tasks.md, questions_for_human.md | User requested comprehensive spec for new RemindMe app before building | `docs/PRODUCT_SPEC.md`, `docs/ARCHITECTURE.md`, `docs/tasks.md` |
| 2026-03-22T11:00:00Z | Claude | Session 2 started — recorded all 12 question answers | User provided answers to all blocking questions | `learning/sessions/2026-03-22_2_session.md` |
| 2026-03-22T11:01:00Z | Claude | Scaffolded monorepo: root package.json, turbo.json, tsconfig.base.json, ESLint, Prettier, .env.example, docker-compose, Dockerfile, setup.sh, .gitignore | Foundation for all packages | `package.json`, `turbo.json`, `infrastructure/docker/` |
| 2026-03-22T11:10:00Z | Claude | Built `@remindme/shared` package: types, Zod schemas, schedule utils, date utils, constants, 73 passing tests | Shared types and validation used by all packages | `packages/shared/` |
| 2026-03-22T11:20:00Z | Claude | Built NestJS API backend: 63 files, all modules (auth, reminders, categories, subtasks, notifications, sync, jobs, health), Prisma schema, Swagger, unit tests | Complete REST API with JWT auth, OAuth, CRUD, scheduling, push notifications | `packages/api/` |
| 2026-03-22T11:30:00Z | Claude | Built React web frontend: 44 files, all pages (auth, home, reminders, categories, settings), soft modern UI, PWA, Zustand + TanStack Query | Full web app with responsive layout, dark mode, push notifications | `packages/web/` |
| 2026-03-22T11:40:00Z | Claude | Built Electron desktop app: 9 source files, macOS .dmg build config, tray, notifications, keyboard shortcuts | Desktop wrapper for macOS testing | `packages/desktop/` |
| 2026-03-22T11:45:00Z | Claude | Built CI/CD pipeline: 5 GitHub Actions workflows (ci, security, release-api/web/desktop), Dependabot, CODEOWNERS, PR template, Husky hooks | Automated testing, security scanning, deployment | `.github/workflows/`, `.husky/` |
| 2026-03-22T11:50:00Z | Claude | Created STRIDE threat model and security policy | User requested vulnerability checking and threat modeling | `docs/THREAT_MODEL.md`, `docs/SECURITY.md` |
| 2026-03-22T11:55:00Z | Claude | Built comprehensive test suite: 5 API e2e specs, 8 web component/hook/page tests, 3 Playwright e2e specs, test utilities | User requested all test types: unit, integration, mock, e2e | `packages/api/test/`, `packages/web/src/__tests__/`, `packages/web/e2e/` |
| 2026-03-23T01:30:00Z | Claude | Added inline "New Category" creation in New Reminder form | User reported missing ability to create categories from the reminder form | `packages/ui/src/pages/NewReminderPage.tsx` |
| 2026-03-23T01:32:00Z | Claude | Added missing schedule types: Hourly, Twice a Day, Monthly Weekday to SchedulePicker | User reported missing hourly, twice-daily, and weekday schedule options | `packages/ui/src/components/SchedulePicker.tsx`, `packages/shared/src/types/reminder.ts`, `packages/shared/src/utils/schedule.ts`, `packages/shared/src/schemas/reminder.schema.ts` |
| 2026-03-23T01:35:00Z | Claude | Expanded Home view tabs: Today, Tomorrow, This Week, This Month, This Year, All | User requested granular time-based views beyond Today/Upcoming/All | `packages/ui/src/pages/HomePage.tsx`, `packages/ui/src/store/app.store.ts` |
| 2026-03-23T01:37:00Z | Claude | Fixed reminder list filtering — reminders now appear correctly in all views | Bug: reminders were not appearing in lists due to faulty grouping logic | `packages/ui/src/pages/HomePage.tsx` |
| 2026-03-23T01:38:00Z | Claude | Made category rows clickable — navigates to Home filtered by that category | User reported categories page rows were not clickable | `packages/ui/src/pages/CategoriesPage.tsx` |
| 2026-03-23T01:40:00Z | Claude | Added "Send Test Notification" button in Settings | User reported no way to test if notifications work | `packages/ui/src/pages/SettingsPage.tsx`, `packages/ui/src/services/notifications.service.ts` |
| 2026-03-23T01:42:00Z | Claude | Added "Last Day of Month" option for monthly_date and "Last" week option for monthly_weekday schedules | User requested first/last day-of-month and first/last weekday options | `packages/ui/src/components/SchedulePicker.tsx`, `packages/shared/src/utils/schedule.ts` |
| 2026-03-23T01:45:00Z | Claude | Full codebase audit: fixed unused imports, verified all components link correctly, schema validation updated for new types | Pre-launch bug sweep | All UI and shared packages |
