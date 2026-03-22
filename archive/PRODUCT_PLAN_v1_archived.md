# Henry's Personal Productivity Suite - Product Plan

> Generated 2026-02-17 | Multi-role analysis with 4 iteration loops

---

## ROUND 1: PA (Personal Assistant) - Organize & Categorize

### Your Raw Ideas, Structured

You gave me a brain dump. Here's what I heard, organized into **4 distinct product ideas**:

---

### Product A: "TaskFlow" - Hierarchical Todo App
| What you said | What that means |
|---|---|
| "todo's sorted for the day and priorities" | Daily planner view with priority sorting |
| "roll up todo's" | Parent tasks auto-calculate progress from subtasks |
| "add a bunch of comments" | Rich comment threads on tasks |
| "listen to my microphone when I click the button" | Voice-to-text task capture |
| "eventually log Jira's" | Jira integration (push tasks to Jira) |
| "PWA using local storage or cloud sync" | Offline-first, cross-device, your data |
| "I use Obsidian mostly" | Should play nice with Obsidian's markdown files |

### Product B: "Remind Me" - Simple Reminder Engine
| What you said | What that means |
|---|---|
| "set reminder, once or recurring" | One-shot and cron-style reminders |
| "what it is" | Simple: title + when + how often |
| PWA | Push notifications, cross-device |

### Product C: "Inner Circle" - Personal Relationship Manager
| What you said | What that means |
|---|---|
| "automatic reminders to contact friends" | "Stay in touch" nudges |
| "special dates" | Birthdays, anniversaries, milestones |
| "kids names and birthdays" | Store family tree / relationship details |
| "when was the last time you spoke to this person" | Last-contact tracking |
| "remember to speak to this person" | Proactive reach-out reminders |

### Product D: Cross-cutting Requirements
| Requirement | Applies to |
|---|---|
| Free & under your control | All |
| Local-first with cloud sync | All |
| PWA for cross-device | All |
| Simple but growable | All |

---

## ROUND 1: Researcher - What Exists (Build vs Use)

### For TaskFlow (Todo App)

| Existing Tool | Verdict | Why |
|---|---|---|
| **[Vikunja](https://vikunja.io)** | CLOSE BUT NO | Has subtasks, comments, PWA, self-hostable. But NO automatic subtask roll-up, no voice capture, no Jira integration |
| **[Super Productivity](https://super-productivity.com)** | INTERESTING | Has Jira/GitHub/GitLab integration built-in, time tracking, WebDAV sync. But no subtask roll-up, no voice, no PWA (Electron app) |
| **[OpenProject](https://www.openproject.org)** | TOO HEAVY | Has full subtask roll-up. But enterprise-grade, complex, no PWA, overkill for personal use |
| **[Kanboard](https://kanboard.org)** | CLOSE | Has subtask tracking with status roll-up. But dated UI, Kanban-only, no PWA, no voice |
| **Obsidian + [Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks)** | DOESN'T SOLVE IT | Popular but treats tasks as flat items. No subtask hierarchy. [Dataview](https://github.com/blacksmithgu/obsidian-dataview) can approximate roll-up but is read-only and fragile. [Obsidian Bases](https://cauenapier.com/blog/tasksinbases/) is newer but limited |
| **[Logseq](https://logseq.com)** | PARTIAL | Outline-based, hierarchical. Can do task queries. But no true PWA, sync is file-based (conflict-prone) |

**Verdict: BUILD.** No existing free tool combines: PWA + subtask roll-up + comments + voice capture + Jira integration + self-hosted. This is the gap.

### For Remind Me (Reminders)

| Existing Tool | Verdict | Why |
|---|---|---|
| **Vikunja** | COULD WORK | Has reminders (one-time + recurring) built into tasks. PWA. Self-hostable. |
| **[ntfy](https://ntfy.sh)** | DELIVERY ONLY | Excellent self-hosted push notification service. But it delivers notifications, doesn't manage reminder schedules. |
| **Apple/Google Reminders** | NOT YOURS | Not self-hosted, not cross-platform (both), vendor lock-in |

**Verdict: FOLD INTO TASKFLOW.** Reminders are just tasks with a notification time. Build this as a feature of the todo app rather than a separate product.

### For Inner Circle (Personal CRM)

| Existing Tool | Verdict | Why |
|---|---|---|
| **[Monica CRM](https://github.com/monicahq/monica)** | STRONG CANDIDATE | Open source, self-hostable (free). Tracks contacts, birthdays, kids names, spouse, "stay in touch" reminders, activity logging. 21k+ GitHub stars. Active since 2017. |
| **[Clay](https://clay.earth)** | NO | Cloud-only, paid, not self-hostable, reads your email |
| **[Dex](https://getdex.com)** | NO | Freemium (100 contacts), cloud-only, professional networking focus |
| **[SoulCircle](https://blog.soulcircle.app)** | PARTIAL | Birthday tracking and smart reminders. Newer. But unclear on self-hosting |
| **[Covve](https://covve.com)** | NO | Paid ($9.99/mo), cloud-only, 20 contacts on free tier |

**Verdict: USE MONICA or BUILD a lighter version.** Monica does 80% of what you want but it's a PHP/MySQL app (heavier to host) and has no PWA. Two paths:
- **Path A:** Self-host Monica, accept it as a web app (not PWA)
- **Path B:** Build a lighter PWA version of the CRM features you actually need, sharing the same tech stack as TaskFlow

---

## ROUND 2: CX/UI Expert - User Experience Design

### Core UX Principles
1. **One-hand, one-thumb** - Most interaction on mobile. Big tap targets.
2. **Voice-first capture** - Hit mic button, speak, done. Zero typing for capture.
3. **Daily driver** - The home screen is "today." What do I need to do RIGHT NOW?
4. **Progressive disclosure** - Simple surface, depth when needed (comments, roll-up, Jira)
5. **Offline is normal** - Never show a spinner waiting for network. Data is always local.

### TaskFlow - Key Screens

```
+----------------------------------+
|  TODAY          Mon, Feb 17      |
|  [mic] [+]                      |
|                                  |
|  HIGH PRIORITY                   |
|  [x] Ship feature X             |
|      3/4 subtasks done  [>]     |
|  [ ] Review PR #423             |
|      0 comments        [>]     |
|                                  |
|  MEDIUM                          |
|  [ ] Update dependencies         |
|  [ ] Write tests for auth  [J]  |
|                                  |
|  LOW                             |
|  [ ] Clean up README             |
|                                  |
|  COMPLETED TODAY (2)       [v]  |
|                                  |
| [Today] [Inbox] [Projects] [Me] |
+----------------------------------+

[J] = synced to Jira
[>] = has subtasks/comments
[v] = expand collapsed section
```

```
+----------------------------------+
|  < Ship feature X                |
|                                  |
|  Priority: [!!!]  Due: Feb 20   |
|  Project: Q1 Release             |
|  Jira: PROJ-1234        [sync]  |
|                                  |
|  PROGRESS =================== 75%|
|  [x] Design mockups              |
|  [x] Implement frontend          |
|  [x] Write API endpoint          |
|  [ ] Deploy to staging           |
|  [+ Add subtask]                 |
|                                  |
|  COMMENTS (3)                    |
|  > Henry: "Need to check with..."|
|  > Henry: "Updated the design"   |
|  > [voice] 0:34 "The client..." |
|  [Add comment]  [mic]            |
|                                  |
+----------------------------------+
```

### Inner Circle - Key Screens

```
+----------------------------------+
|  INNER CIRCLE                    |
|  [search]                        |
|                                  |
|  REACH OUT TODAY                 |
|  [!] Sarah M. - birthday tmrw!  |
|  [~] Tom K. - 45 days since     |
|      last contact                |
|                                  |
|  UPCOMING                        |
|  Feb 22 - Mike's anniversary     |
|  Mar 3  - Emma turns 5          |
|  Mar 8  - Intl Women's Day      |
|                                  |
|  RECENT CONTACTS                 |
|  James R. - yesterday            |
|  Sarah M. - 3 days ago           |
|  Tom K. - 45 days ago            |
|                                  |
| [Home] [People] [Dates] [Me]    |
+----------------------------------+
```

### Voice Capture Flow
1. User taps mic button (big, obvious, always visible)
2. Recording indicator appears, browser asks mic permission (first time only)
3. Real-time transcript appears as user speaks
4. User taps stop (or pauses for 3 seconds)
5. Transcript becomes task title (or comment text)
6. User can edit, assign priority, hit save
7. Done. 5 seconds from thought to captured task.

---

## ROUND 2: Architect - Technical Architecture

### Recommended Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | **SvelteKit (SPA mode)** + Vite | Smallest bundles, fastest runtime, excellent DX. [Zero-config PWA via @vite-pwa/sveltekit](https://github.com/vite-pwa/sveltekit) |
| **PWA Tooling** | **vite-plugin-pwa** (Workbox) | [Best-in-class PWA generation](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html). Precaching, manifest, service worker |
| **Local Database** | **Dexie.js** (IndexedDB) | [Most ergonomic IndexedDB wrapper](https://dexie.org/). Simple API, reactive queries, proven at scale |
| **Cloud Sync (Phase 2)** | **Dexie Cloud** or **PouchDB + CouchDB** | Dexie Cloud: [free for 3 users](https://dexie.org/cloud/pricing), $0.12/user/mo after, can self-host. PouchDB+CouchDB: fully free, proven sync protocol |
| **Speech-to-Text** | **Web Speech API** (primary) + **Whisper.js** (fallback) | Web Speech: [free, zero-setup, works in Chrome/Safari](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API). [Whisper via Transformers.js](https://github.com/xenova/whisper-web): offline, private, covers Firefox |
| **Push Notifications** | **Web Push API + VAPID** | Free, self-hosted, works on [iOS 16.4+](https://brainhub.eu/library/pwa-on-ios) (must be installed PWA) |
| **Jira Integration** | **[jira.js](https://github.com/MrRefactoring/jira.js)** via small backend proxy | Full TypeScript Jira API wrapper. Needs backend to hide API token |
| **Backend (Phase 2)** | **Pocketbase** | [Single binary](https://pocketbase.io), SQLite-based, auth + API + realtime. Easiest self-hosted backend |
| **Styling** | **Tailwind CSS** | Utility-first, small bundles, great mobile support |

### Architecture Diagram

```
+--------------------------------------------------+
|                    PWA Shell                       |
|  (SvelteKit SPA + Service Worker + Workbox)       |
+--------------------------------------------------+
|                                                    |
|  +-------------+  +-------------+  +------------+ |
|  | TaskFlow    |  | Remind Me   |  | Inner      | |
|  | Module      |  | (built into |  | Circle     | |
|  |             |  |  TaskFlow)  |  | Module     | |
|  +------+------+  +------+------+  +-----+------+ |
|         |                |               |         |
|  +------v----------------v---------------v------+  |
|  |           Dexie.js (IndexedDB)               |  |
|  |  Tasks | Comments | Contacts | Reminders     |  |
|  +------+-----------------------------------+---+  |
|         |                                   |      |
+---------|-----------------------------------|------+
          |                                   |
   +------v------+                   +--------v-----+
   | Dexie Cloud |                   | Web Push     |
   | or CouchDB  |                   | (VAPID)      |
   | (self-host) |                   | via Pocketbase|
   +------+------+                   +--------------+
          |
   +------v------+
   | Jira API    |
   | (via proxy) |
   +-------------+
```

### Data Model

```typescript
// Core entities
interface Task {
  id: string;
  title: string;
  description?: string;        // Markdown
  priority: 'high' | 'medium' | 'low' | 'none';
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  parentId?: string;           // For subtask hierarchy
  projectId?: string;
  dueDate?: Date;
  remindAt?: Date;             // Reminder time
  recurrence?: RecurrenceRule; // Cron-like for recurring
  jiraKey?: string;            // e.g., "PROJ-1234"
  jiraSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  sortOrder: number;
}

interface Comment {
  id: string;
  taskId: string;
  content: string;             // Markdown
  voiceUrl?: string;           // Audio blob URL for voice comments
  voiceTranscript?: string;    // Auto-transcribed text
  createdAt: Date;
}

interface Contact {
  id: string;
  name: string;
  nickname?: string;
  email?: string;
  phone?: string;
  birthday?: string;           // MM-DD format
  anniversary?: string;
  notes?: string;
  tags: string[];              // e.g., ["family", "work", "close-friend"]
  stayInTouchDays?: number;    // Remind if no contact in N days
  lastContactedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactRelationship {
  id: string;
  contactId: string;
  relatedContactId: string;
  type: 'spouse' | 'child' | 'parent' | 'sibling' | 'friend' | 'colleague';
}

interface Interaction {
  id: string;
  contactId: string;
  type: 'call' | 'message' | 'meeting' | 'email' | 'other';
  notes?: string;
  date: Date;
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  triggerAt: Date;
  recurrence?: RecurrenceRule;
  contactId?: string;          // Link to contact for relationship reminders
  taskId?: string;             // Link to task for task reminders
  status: 'pending' | 'fired' | 'snoozed' | 'dismissed';
}

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;            // Every N frequency
  daysOfWeek?: number[];       // 0=Sun, 6=Sat
  endDate?: Date;
}
```

### Key Technical Decisions

1. **Why SvelteKit over React?** Svelte compiles to vanilla JS (no virtual DOM overhead). ~60% smaller bundles than React. Better for PWA where every KB matters for offline caching. [Service worker support is first-class](https://svelte.dev/docs/kit/service-workers).

2. **Why Dexie over PouchDB?** PouchDB is [effectively in maintenance mode](https://news.ycombinator.com/item?id=43850550). Dexie is actively maintained, has simpler API, and Dexie Cloud provides a clean upgrade path to sync.

3. **Why not SQLite/OPFS?** Adds complexity (WASM loading, Cross-Origin-Isolation headers, Web Worker requirements). Dexie/IndexedDB is simpler to start with. SQLite is the upgrade path if you outgrow IndexedDB.

4. **Why Pocketbase for backend?** Single Go binary. Zero dependencies. Built-in auth, REST API, realtime subscriptions, admin UI. [Easiest self-hosted backend in existence](https://pocketbase.io). Can run on a $5/mo VPS or even a Raspberry Pi.

---

## ROUND 3: Product Designer - Feature Roadmap

### Phase 1: MVP - "Daily Driver" (2-3 weeks)
**Goal:** Replace your daily todo workflow

- [ ] Basic task CRUD (create, read, update, delete)
- [ ] Priority levels (high/medium/low/none)
- [ ] Today view with priority sorting
- [ ] Subtask hierarchy (nested tasks)
- [ ] Subtask roll-up (auto-calculated progress %)
- [ ] Comments on tasks (text)
- [ ] PWA manifest + service worker (installable, works offline)
- [ ] Local storage via Dexie.js (IndexedDB)
- [ ] Responsive mobile-first UI

### Phase 2: Voice & Projects (1-2 weeks)
**Goal:** Faster capture, better organization

- [ ] Voice capture via Web Speech API (mic button)
- [ ] Voice comments (record + auto-transcribe)
- [ ] Whisper.js fallback for Firefox/offline
- [ ] Projects/lists for grouping tasks
- [ ] Inbox for uncategorized captures
- [ ] Due dates and basic date views
- [ ] Search across tasks and comments

### Phase 3: Reminders & Notifications (1-2 weeks)
**Goal:** Never forget anything

- [ ] Reminder scheduling (one-time and recurring)
- [ ] Push notifications via Web Push API
- [ ] Notification permission flow
- [ ] Pocketbase backend for push delivery
- [ ] Snooze and dismiss actions
- [ ] Daily digest notification (morning summary)

### Phase 4: Inner Circle - Personal CRM (2-3 weeks)
**Goal:** Stay connected with your people

- [ ] Contact management (name, birthday, details)
- [ ] Relationship linking (spouse, kids, parents)
- [ ] Interaction logging (calls, meetings, messages)
- [ ] "Stay in touch" rules per contact
- [ ] Auto-reminders for birthdays (yearly recurring)
- [ ] "Reach out today" dashboard
- [ ] Last-contacted tracking
- [ ] Special dates calendar view

### Phase 5: Cloud Sync (1-2 weeks)
**Goal:** Same data everywhere

- [ ] Dexie Cloud integration (or CouchDB sync)
- [ ] Authentication (email/password via Pocketbase)
- [ ] Conflict resolution UX
- [ ] Multi-device testing (phone + desktop)

### Phase 6: Jira Integration (1 week)
**Goal:** Bridge personal todos and work tickets

- [ ] Connect Jira account (API token)
- [ ] Push task to Jira (create issue)
- [ ] Pull Jira status back to task
- [ ] Jira badge on synced tasks
- [ ] Backend proxy for Jira API (via Pocketbase or small Node service)

### Phase 7: Obsidian Bridge (1 week)
**Goal:** Keep your Obsidian workflow

- [ ] Export tasks as Markdown (Obsidian-compatible format)
- [ ] Import tasks from Markdown files
- [ ] Obsidian-compatible task format (`- [ ] task @due(2026-02-20)`)

---

## ROUND 3: Program Manager - Dependencies & Risks

### Critical Path
```
Phase 1 (MVP) -> Phase 2 (Voice) -> Phase 3 (Reminders) -> Phase 5 (Sync)
                                         |
                                    Phase 4 (CRM) -> Phase 5 (Sync)
                                                        |
                                                   Phase 6 (Jira)
                                                   Phase 7 (Obsidian)
```

Phases 4, 6, and 7 are independent and can be built in any order after Phase 3.

### Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **iOS PWA notifications unreliable** | Reminders don't fire on iPhone | Use notification scheduling server-side via Pocketbase. Test on real iOS devices early. [Limitations documented here](https://brainhub.eu/library/pwa-on-ios) |
| **Web Speech API not in Firefox** | Voice capture broken for ~4% users | Whisper.js WASM fallback. Feature-detect and degrade gracefully |
| **Dexie Cloud pricing changes** | Sync becomes expensive | Architecture allows swapping to PouchDB+CouchDB (fully free). Keep sync layer abstracted |
| **Scope creep** | Never ships | Phase 1 is the ONLY mandatory phase. Everything else is additive. Ship Phase 1 in 2 weeks |
| **Jira CORS issues** | Can't call Jira from browser | Already planned: backend proxy handles all Jira API calls |
| **IndexedDB storage limits** | Data loss on iOS (7-day eviction) | Prompt user to install as PWA (installed PWAs have persistent storage). Use `navigator.storage.persist()` |

---

## ROUND 4: Final Synthesis - All Roles

### PA's Final Recommendation

You have 4 ideas. Here's how I'd prioritize them:

1. **TaskFlow** (BUILD) - This is your daily driver. Nothing exists that does what you need. Build it as a PWA with Dexie.js.
2. **Reminders** (FOLD IN) - Don't build separately. It's a feature of TaskFlow. Tasks with a `remindAt` field + push notifications.
3. **Inner Circle** (BUILD or USE MONICA) - Two honest options:
   - **If you want it fast:** Self-host [Monica CRM](https://github.com/monicahq/monica). It already does 80% of what you want.
   - **If you want it integrated:** Build as a module in the same PWA as TaskFlow. Same tech stack, shared UI, one app to rule them all.
4. **Jira/Obsidian** (ADD LATER) - These are integrations, not products. Add them after the core is solid.

### Architect's Final Recommendation

**Build ONE PWA with modules.** Not three separate apps.

```
todo-app/
  src/
    lib/
      db/              # Dexie schema, all tables
      components/      # Shared UI components
      speech/          # Voice capture module
      sync/            # Sync abstraction layer
    routes/
      (app)/
        today/         # Daily task view
        inbox/         # Capture inbox
        projects/      # Project/list view
        task/[id]/     # Task detail + comments
        people/        # Contact list
        people/[id]/   # Contact detail
        calendar/      # Dates & reminders view
        settings/      # Jira config, sync, prefs
    app.html
  static/
    manifest.json
  pocketbase/          # Backend (Phase 3+)
```

### UX Expert's Final Recommendation

The app should feel like **Apple Reminders meets Notion meets Monica** - dead simple on the surface, powerful underneath. Key principles:
- Default view is always "Today" - what do I do right now?
- Every screen has a mic button and a + button
- Subtask roll-up should be VISUAL (progress bar, not just numbers)
- People and tasks live side by side (a task can be linked to a person)

### Program Manager's Final Recommendation

**Ship Phase 1 in 2 weeks. Everything else is Phase 2+.**

Start building now. The architecture supports all future phases without rewriting. The tech stack (SvelteKit + Dexie + Vite PWA) is proven, free, and grows with you.

---

## Appendix: Key Resources

### Existing Tools Worth Knowing About
- [Vikunja](https://vikunja.io) - Closest open-source todo app to your needs
- [Super Productivity](https://super-productivity.com) - Has Jira integration already built
- [Monica CRM](https://github.com/monicahq/monica) - Best open-source personal CRM
- [ntfy](https://ntfy.sh) - Self-hosted push notification service

### Tech Stack Documentation
- [Dexie.js Docs](https://dexie.org/) - Local database
- [Dexie Cloud Pricing](https://dexie.org/cloud/pricing) - Sync pricing (free for 3 users)
- [SvelteKit Docs](https://svelte.dev/docs/kit) - Framework
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/frameworks/sveltekit.html) - PWA tooling
- [Web Speech API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Voice capture
- [Whisper Web](https://github.com/xenova/whisper-web) - Offline speech-to-text
- [jira.js](https://github.com/MrRefactoring/jira.js) - Jira API wrapper
- [Pocketbase](https://pocketbase.io) - Self-hosted backend
- [PWA on iOS Limitations](https://brainhub.eu/library/pwa-on-ios) - Know the constraints
- [Obsidian Tasks Plugin](https://github.com/obsidian-tasks-group/obsidian-tasks) - Current Obsidian task management

### Alternative Tech Considered
- [PouchDB + CouchDB](https://pouchdb.com/) - Proven sync, but PouchDB is aging
- [RxDB](https://rxdb.info/) - Powerful but more complex, premium features are paid
- [PowerSync](https://www.powersync.com/) - Excellent offline sync, free tier available
- [Triplit](https://triplit.dev/) - All-in-one local-first database with sync
- [Automerge](https://automerge.org/) / [Yjs](https://yjs.dev/) - CRDTs for collaboration (overkill for Phase 1)
