# RemindMe — Ideas & Future Possibilities

> Brainstormed features and concepts beyond the core MVP. Ordered roughly by user value.

---

## High-Value Ideas (Consider for Early Phases)

### 1. Smart Snooze
Instead of fixed snooze durations, offer contextual options:
- "Later today" (2 hours from now)
- "This evening" (6 PM)
- "Tomorrow morning" (9 AM)
- "Next week" (same day/time, next week)
- Custom: pick date + time

### 2. Quick Capture Widget
A home screen widget (mobile) or menu bar item (macOS) / system tray (Windows) that lets you create a reminder in one line:
- "Pay rent on the 1st monthly" → auto-parses name, date, recurrence
- Natural language parsing using a lightweight NLP library

### 3. Reminder Templates
Pre-built templates users can install with one tap:
- "New Pet Owner" → vet appointments, feeding schedule, medication
- "Homeowner" → mortgage, property tax, HVAC filter, lawn care
- "Freelancer" → invoice clients, quarterly taxes, contract renewals
- Users can share their own templates via export links

### 4. Location-Based Reminders (Phase 3+)
- "Remind me when I arrive at the grocery store" → trigger by geofence
- Requires location permission — optional, clearly explained
- Useful for: shopping lists, picking up prescriptions, returning items

### 5. Shared Reminders
- Share a reminder with a family member or roommate
- Both get notified, either can complete
- Use case: "Someone needs to take the trash out every Tuesday"
- Requires invitation system + shared state

### 6. Reminder Streaks & Habits
- Track how many consecutive times you've completed a recurring reminder
- Visual streak counter: "🔥 15 days — Take medication"
- Gentle nudge if streak is about to break
- Gamification without being annoying — opt-in

### 7. Calendar View
- Monthly/weekly calendar showing when reminders are scheduled
- Visual density indicator: "April 1st has 5 reminders"
- Quick-add from calendar: tap a day → new reminder on that date

### 8. Batch Operations
- Select multiple reminders → pause all, delete all, change category
- Useful for seasonal things: "Pause all garden reminders for winter"

---

## Medium-Value Ideas (Phase 3-4)

### 9. Bill Amount Tracking
- For "Bills" category: optional field to enter the amount paid each time
- Simple spending tracker: "You've paid $1,800 in electricity this year"
- Chart: monthly spending per category

### 10. Dependency Chains
- "After I complete Reminder A, automatically activate Reminder B"
- Use case: "After 'File taxes', activate 'Pay tax bill within 30 days'"

### 11. Voice Input
- "Hey RemindMe, remind me to call the dentist next Monday at 10 AM"
- Web Speech API on web/desktop, native speech on mobile
- Lower priority — keyboard is fine for most users

### 12. Integrations
- **Google Calendar**: 2-way sync of reminders
- **Apple Reminders / iCloud**: Import existing reminders
- **Slack**: Get reminded in Slack DMs
- **Email**: Get reminder notifications via email as fallback
- **Zapier/Make**: Webhook triggers for automation

### 13. Multiple Notification Channels
- Per-reminder setting: notify via push, email, SMS, or all
- Escalation: "If not completed within 1 hour, send email too"

---

## Nice-to-Have Ideas (Phase 5+)

### 14. AI-Assisted Scheduling
- "I have 12 reminders this week, suggest optimal times"
- Spread reminders evenly, avoid clustering
- Learn from user's completion patterns

### 15. Accessibility Features
- Voice-over optimized navigation
- High contrast mode
- Large text mode beyond system settings
- Haptic feedback patterns for different notification types

### 16. Offline-First with Conflict Resolution
- Full offline support with local-first database (Watermelon DB or similar)
- Sync when online with automatic conflict resolution
- Critical for areas with spotty connectivity

### 17. Multi-Language Support (i18n)
- Start with English
- Add: Spanish, French, German, Portuguese, Japanese, Chinese
- Community-contributed translations

### 18. Themed Categories with Custom Icons
- Upload custom icons for categories
- Category themes: color + icon + notification sound
- "Bills" plays a cash register sound, "Health" plays a gentle chime

---

## Anti-Features (Things We Will NOT Build)

These are intentionally excluded to keep the app simple:

| Feature | Why Not |
|---------|---------|
| Task management / project boards | This is a reminder app, not Jira |
| Time tracking | Out of scope — use Toggl |
| Note-taking beyond reminder notes | Out of scope — use Notion/Obsidian |
| Social features / friend lists | This is personal productivity |
| Advertising | No ads, ever |
| Complex permissions / roles | Single-user app (sharing is peer-to-peer) |
