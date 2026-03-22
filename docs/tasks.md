# RemindMe — Phases, Tasks & Subtasks

> Master task breakdown. Each phase has a clear deliverable and exit criteria.

---

## Phase 1: API Foundation + Web MVP
**Goal**: Working API + web app where you can create reminders and get browser push notifications.
**Deliverable**: Deployed web app at `remindme.app` (or similar), API at `api.remindme.app`.

### 1.1 Project Setup
- [ ] Initialize monorepo with Turborepo
- [ ] Configure root `package.json` workspaces
- [ ] Create `tsconfig.base.json` shared config
- [ ] Set up ESLint + Prettier configs
- [ ] Create `.env.example` with all required variables
- [ ] Set up `docker-compose.yml` for local dev (Postgres + Redis)
- [ ] Write `scripts/setup.sh` one-liner dev setup
- [ ] Create initial `README.md` with quick start guide

### 1.2 Shared Package (`@remindme/shared`)
- [ ] Define TypeScript types for all data models (Reminder, Subtask, Category, User)
- [ ] Create Zod validation schemas for all API inputs
- [ ] Write date/schedule utility functions (next occurrence calculator)
- [ ] Write schedule description formatter ("Every Monday at 9 AM")
- [ ] Export all types and schemas from package index
- [ ] Add unit tests for schedule calculator (critical logic)
- [ ] Add unit tests for all Zod schemas

### 1.3 API Backend (`packages/api`)
- [ ] Initialize NestJS project
- [ ] Configure Prisma ORM + PostgreSQL connection
- [ ] Create database schema (users, reminders, subtasks, categories, push_tokens, completion_records)
- [ ] Run initial migration
- [ ] **Auth module**
  - [ ] POST `/auth/register` — create account with email + password
  - [ ] POST `/auth/login` — return JWT + refresh token
  - [ ] POST `/auth/refresh` — refresh JWT
  - [ ] POST `/auth/logout` — invalidate refresh token
  - [ ] JWT guard for protected routes
  - [ ] Unit tests for auth service
  - [ ] Integration tests for auth endpoints
- [ ] **Categories module**
  - [ ] CRUD endpoints
  - [ ] Favorite toggle endpoint
  - [ ] Seed default categories on user creation
  - [ ] Integration tests
- [ ] **Reminders module**
  - [ ] CRUD endpoints
  - [ ] Complete, snooze, skip action endpoints
  - [ ] Next occurrence calculation on create/complete
  - [ ] Filtering: by status, category, date range
  - [ ] Pagination with cursor-based pagination
  - [ ] Unit tests for scheduling logic (every schedule type)
  - [ ] Integration tests for all endpoints
- [ ] **Subtasks module**
  - [ ] CRUD endpoints nested under reminders
  - [ ] Reorder endpoint (sort_order update)
  - [ ] Integration tests
- [ ] **Notification module**
  - [ ] Push token registration endpoint
  - [ ] Token unregister endpoint
  - [ ] Test notification endpoint
  - [ ] Web Push (VAPID) implementation
  - [ ] Integration tests
- [ ] **Job scheduler**
  - [ ] BullMQ setup with Redis connection
  - [ ] Reminder scheduler job: query reminders due in next minute, enqueue notifications
  - [ ] Notification dispatcher job: send push via appropriate channel
  - [ ] Retry logic with exponential backoff
  - [ ] Dead letter queue for failed notifications
  - [ ] Bull Board dashboard (dev only)
  - [ ] Unit tests for job processors
- [ ] **Sync module**
  - [ ] GET `/sync/export` — full JSON export
  - [ ] POST `/sync/import` — JSON import with conflict resolution
  - [ ] Integration tests
- [ ] **Cross-cutting**
  - [ ] Global exception filter with structured error responses
  - [ ] Request logging interceptor (Pino)
  - [ ] Rate limiting (`@nestjs/throttler`)
  - [ ] CORS configuration
  - [ ] Swagger/OpenAPI auto-generation
  - [ ] Health check endpoint (`/health`)
  - [ ] Verbose logging with configurable log levels

### 1.4 Web Frontend (`packages/web`)
- [ ] Initialize React + Vite project
- [ ] Configure Tailwind CSS
- [ ] Set up React Router
- [ ] Set up Zustand store
- [ ] Set up TanStack Query for API integration
- [ ] Create API client service with auth token management
- [ ] **Auth pages**
  - [ ] Login page
  - [ ] Registration page
  - [ ] Auth state management (token storage, auto-refresh)
- [ ] **Home page**
  - [ ] Today's reminders section
  - [ ] Upcoming reminders section
  - [ ] Overdue reminders (pinned to top, red accent)
  - [ ] Search bar
  - [ ] Pull-to-refresh behavior
- [ ] **New Reminder page**
  - [ ] Name input
  - [ ] Category picker with auto-suggest and favorites
  - [ ] Schedule type selector (chips)
  - [ ] Date + time pickers
  - [ ] Subtask add section
  - [ ] Notes field
  - [ ] Form validation (using shared Zod schemas)
- [ ] **Reminder Detail page**
  - [ ] Header with name, category, schedule summary
  - [ ] Subtask checklist (toggle, add, remove, reorder via drag)
  - [ ] Notes section (editable)
  - [ ] Completion history
  - [ ] Action buttons: Complete, Snooze, Skip, Pause, Delete
- [ ] **Categories page**
  - [ ] List all categories
  - [ ] Create/edit/delete categories
  - [ ] Favorite toggle
- [ ] **Settings page**
  - [ ] Notification toggle + test button
  - [ ] Quiet hours configuration
  - [ ] Theme toggle (light/dark/system)
  - [ ] Export / Import data
  - [ ] Permission status dashboard
  - [ ] Sign out
- [ ] **PWA setup**
  - [ ] Service worker registration (Workbox)
  - [ ] Web app manifest
  - [ ] Push notification subscription (VAPID)
  - [ ] Offline indicator
  - [ ] App install prompt
- [ ] **Responsive design**
  - [ ] Mobile layout (< 768px)
  - [ ] Tablet layout (768px - 1024px)
  - [ ] Desktop layout (> 1024px) with sidebar
- [ ] **Components**
  - [ ] ReminderCard component
  - [ ] CategoryChip component
  - [ ] SchedulePicker component
  - [ ] SubtaskItem component (with drag handle)
  - [ ] EmptyState component
  - [ ] PermissionPrompt component (explains why, links to settings)
  - [ ] NotificationBanner component
  - [ ] LoadingSkeleton components
- [ ] E2E tests (Playwright): create reminder flow, notification flow

### 1.5 CI/CD Pipeline
- [ ] GitHub Actions: lint + type-check on every PR
- [ ] GitHub Actions: run all tests on every PR
- [ ] GitHub Actions: build all packages on every PR
- [ ] Dependabot configuration
- [ ] CodeQL security scanning
- [ ] Branch protection rules (require CI pass, require review)

### 1.6 Deployment (Phase 1)
- [ ] Deploy API to Railway (or Fly.io)
- [ ] Deploy Postgres on Railway
- [ ] Deploy Redis on Railway (or Upstash)
- [ ] Deploy web to Vercel (or Cloudflare Pages)
- [ ] Configure custom domains
- [ ] SSL certificates (auto via platform)
- [ ] Environment variables configured
- [ ] Health check monitoring
- [ ] Sentry error tracking setup

---

## Phase 2: Desktop Apps (macOS + Windows)
**Goal**: Native desktop apps wrapping the web frontend.
**Deliverable**: Downloadable `.dmg` (macOS), `.exe` / `.msi` (Windows), `.AppImage` (Linux).

### 2.1 Electron Shell (`packages/desktop`)
- [ ] Initialize Electron project
- [ ] Main process: window management, native menu, tray icon
- [ ] Preload script: IPC bridge for native features
- [ ] Load web app (bundled, not URL — for offline support)
- [ ] Native notification integration
- [ ] Auto-updater (electron-updater + GitHub Releases)
- [ ] System tray with quick actions (new reminder, upcoming list)
- [ ] Keyboard shortcuts
- [ ] macOS: proper app menu, dock badge for pending reminders
- [ ] Windows: taskbar badge, toast notifications
- [ ] Linux: system tray, libnotify

### 2.2 Desktop Build Pipeline
- [ ] electron-builder config for macOS (.dmg, universal binary)
- [ ] electron-builder config for Windows (.exe, .msi, NSIS installer)
- [ ] electron-builder config for Linux (.AppImage, .deb, .rpm)
- [ ] GitHub Actions: build desktop apps on release tag
- [ ] Code signing: macOS (Apple Developer cert) + Windows (code signing cert)
- [ ] Auto-update server (GitHub Releases or custom)
- [ ] Canary channel: auto-publish from main branch
- [ ] Stable channel: publish from release tags

### 2.3 Desktop-Specific Testing
- [ ] Smoke tests: app launches, loads web content
- [ ] Notification delivery test on each OS
- [ ] Auto-update test (canary → stable)
- [ ] Offline behavior test

---

## Phase 3: Android App
**Goal**: Android app on Google Play Store.
**Deliverable**: Published on Google Play (or open beta).

### 3.1 Mobile App (`packages/mobile`)
- [ ] Initialize Expo project with Expo Router
- [ ] Configure app.json / eas.json
- [ ] Tab navigation: Home, All, Categories, Settings
- [ ] **Screens** (mirror web functionality)
  - [ ] Home screen with today/upcoming sections
  - [ ] New Reminder screen
  - [ ] Reminder Detail screen
  - [ ] Categories screen
  - [ ] Settings screen
- [ ] Push notification setup (Expo Notifications + FCM)
- [ ] Permission request flows (notifications, exact alarms, battery optimization)
- [ ] Deep linking: notification tap → reminder detail
- [ ] Pull-to-refresh
- [ ] Offline queue (local actions synced when online)

### 3.2 Android-Specific
- [ ] FCM configuration (google-services.json)
- [ ] Android notification channels
- [ ] Battery optimization guidance screen
- [ ] Boot receiver for rescheduling alarms
- [ ] Adaptive icon + splash screen
- [ ] EAS Build profile for Android
- [ ] Internal testing track on Google Play Console
- [ ] Beta → Production release

### 3.3 Mobile Testing
- [ ] Detox E2E tests on Android emulator
- [ ] Push notification delivery test
- [ ] Background/foreground notification handling
- [ ] Offline → online sync test

---

## Phase 4: iOS App
**Goal**: iOS app on Apple App Store.
**Deliverable**: Published on App Store (or TestFlight beta).

### 4.1 iOS-Specific
- [ ] APNs configuration (via FCM or direct)
- [ ] Apple Developer account setup
- [ ] Provisioning profiles + certificates
- [ ] iOS notification permission flow (clear explanation before system prompt)
- [ ] Background App Refresh configuration
- [ ] App icon + launch screen
- [ ] EAS Build profile for iOS
- [ ] TestFlight distribution
- [ ] App Store review submission

### 4.2 iOS Testing
- [ ] Detox E2E tests on iOS simulator
- [ ] Push notification delivery on real device
- [ ] Background notification handling
- [ ] App review guideline compliance check

---

## Phase 5: Advanced Features
**Goal**: Polish and power-user features.

### 5.1 Features
- [ ] Smart Snooze (contextual snooze options)
- [ ] Reminder templates (pre-built + shareable)
- [ ] Calendar view
- [ ] Batch operations (multi-select + bulk actions)
- [ ] Completion streaks
- [ ] Quiet hours (per-device)
- [ ] Quick capture widget (mobile home screen, desktop menu bar)

### 5.2 Sync Enhancements
- [ ] Google Calendar 2-way sync
- [ ] Apple Calendar sync
- [ ] JSON/CSV export improvements
- [ ] Shareable reminder links

---

## Phase 6: Scale & Harden
**Goal**: Production-grade infrastructure and monitoring.

### 6.1 Infrastructure
- [ ] Migrate to container orchestration if traffic justifies (K8s or Fly.io machines)
- [ ] Blue/green deployment automation
- [ ] Database read replicas
- [ ] Redis cluster mode
- [ ] CDN for static assets
- [ ] DDoS protection (Cloudflare)

### 6.2 Observability
- [ ] OpenTelemetry distributed tracing
- [ ] Grafana dashboards (API latency, notification delivery rate, job queue depth)
- [ ] Alerting: PagerDuty/Opsgenie for critical failures
- [ ] SLA monitoring (99.9% uptime target)

### 6.3 Security Hardening
- [ ] Penetration testing
- [ ] SOC 2 readiness assessment (if B2B path)
- [ ] Data encryption at rest
- [ ] Audit logging

---

## Phase 7: Integrations & Growth
**Goal**: Ecosystem connections and growth features.

- [ ] OAuth login (Google, Apple, Microsoft)
- [ ] Slack integration (remind in DMs)
- [ ] Email notification fallback
- [ ] Zapier/Make webhooks
- [ ] Public API for third-party integrations
- [ ] Multi-language support (i18n)
- [ ] Shared reminders (family/roommate)
- [ ] Location-based reminders (geofencing)

---

## Exit Criteria Per Phase

| Phase | Done When |
|-------|-----------|
| 1 | API deployed, web app live, can create reminder and receive push notification in browser |
| 2 | Desktop app downloadable and installable on macOS + Windows + Linux, notifications work |
| 3 | Android app on Google Play (at least open beta), push notifications work |
| 4 | iOS app on App Store (at least TestFlight), push notifications work |
| 5 | All advanced features shipped and tested |
| 6 | Infrastructure hardened, monitoring in place, blue/green working |
| 7 | At least 2 integrations live, i18n for 3+ languages |
