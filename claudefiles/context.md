# Project Context

## What This Project Is
**Oh Right!** — a local-first, cross-platform reminder app (macOS, Windows, Linux, Android, iOS). No server required. SQLite for storage, local notifications, import/export for data portability. TypeScript + Rust monorepo.

## Current State
- **Status**: Desktop app built and running on macOS, 102 shared tests passing
- **Branch**: `feat/local-first-native` (main branch has old server architecture)
- **Code**:
  - `packages/shared/` — @ohright/shared: Types, Zod schemas, schedule utils, date utils (102 tests)
  - `packages/ui/` — @ohright/ui: React frontend (Vite), soft modern UI, all pages/components
  - `packages/desktop/` — @ohright/desktop: Tauri v2 shell, compiles to .app/.dmg for macOS
- **Design**: Soft modern UI, indigo accent, light/dark mode, Inter font
- **App renamed**: Was "RemindMe" → now **"Oh Right!"**

## Architecture (Local-First)
- **No server** — all data stored locally in SQLite per device
- **Tauri v2** for desktop (macOS/Windows/Linux) — Rust backend, webview frontend
- **Expo/React Native** planned for mobile (Android/iOS)
- **Import/Export** JSON for data portability between devices
- **Local notifications** via OS-level APIs (no push server)
- **Zero hosting cost** — completely free to run

## Key Decisions
- Name: "Oh Right!" (was "RemindMe")
- Architecture: Local-first, no server, no auth needed
- Desktop: Tauri v2 (not Electron) — 10x smaller binary
- Storage: SQLite everywhere
- Notifications: Local OS notifications, user-selectable priority
- Categories: User creates their own (no defaults)
- Design: Soft rounded UI, best-in-market modern aesthetic
- Priority levels: critical/medium/low (was critical/normal/low)

## Where We Are Going
- Phase 1: Desktop (macOS) — **built and running**
- Phase 2: Desktop (Windows + Linux builds)
- Phase 3: Mobile (Android via Expo)
- Phase 4: Mobile (iOS via Expo)
- Phase 5: Advanced features (calendar view, templates, streaks)
- Future: Optional sync server for multi-device (paid tier)

## Next Steps
1. Iterate on desktop app based on user feedback
2. Update CI/CD for Tauri builds
3. Build Expo mobile app
4. Code signing for distribution
5. App store submissions

## Where We Left Off
- Session 3 (2026-03-23): Pivoted to local-first, renamed to "Oh Right!"
- User added features: inline category creation, expanded schedule types, view tabs, clickable categories, test notifications
- Desktop app compiles and runs on macOS (.app and .dmg)
- 102 shared tests passing, all builds green
- CI/CD being updated for new architecture

## Key Files
- `packages/shared/` — Shared types, schemas, utils
- `packages/ui/` — React UI (runs in Tauri webview)
- `packages/desktop/src-tauri/` — Tauri Rust backend + config
- `docs/PRODUCT_SPEC.md` — Product specification
- `docs/DESIGN_SPEC.md` — UI/UX design spec
- `docs/THREAT_MODEL.md` — STRIDE threat model (being updated for local-first)
- `docs/SECURITY.md` — Security policy
