# Questions for Human

> Decisions that need your input before we start building.

---

## Critical (Blocks Phase 1)

### Q1: Authentication — Email/Password or OAuth?
Phase 1 plans email + password auth. Do you want to add Google/Apple Sign-In from Day 1 instead? It's more work upfront but better UX on mobile.
- **Option A**: Email/password only (simpler, faster to ship)
- **Option B**: Email/password + Google + Apple Sign-In (better UX, more setup)

### Q2: Hosting Provider Preference?
Recommendations are Railway or Fly.io for API, Vercel for web. Do you have:
- An existing cloud account (AWS, GCP, Azure) you'd prefer to use?
- A domain name in mind? (e.g., `remindme.app`, `remindme.dev`)
- Budget constraints for hosting? (Railway free tier works for dev, ~$5-20/mo for production)

### Q3: App Name — Is "RemindMe" Final?
I've been using "RemindMe" as a working name. Is this the name you want, or do you have something else in mind? This affects:
- Domain registration
- App store listings
- Package naming in code

### Q4: Apple Developer Account
For iOS + macOS app distribution, you need an Apple Developer account ($99/year). Do you have one, or should we plan for that in Phase 2 timeline?

### Q5: Google Play Developer Account
For Android distribution, you need a Google Play Developer account ($25 one-time). Do you have one?

---

## Important (Blocks Phase 2-3)

### Q6: Code Signing Certificates
Desktop apps (Electron) should be code-signed to avoid "unidentified developer" warnings.
- macOS: Requires Apple Developer ID certificate (comes with Apple Developer account)
- Windows: Requires a code signing certificate (~$70-200/year from DigiCert, Sectigo, etc.)
- Do you want to handle code signing from the start, or ship unsigned initially?

### Q7: Firebase Project
Push notifications on Android + iOS use Firebase Cloud Messaging (FCM). Do you have a Firebase/Google Cloud project, or should we create one?

### Q8: Commit Prefix for This Session?
You didn't answer earlier — would you like a commit prefix for this session? (e.g., `feat:`, `[REMIND-001]`, or skip)

---

## Nice to Know (Informs Design Decisions)

### Q9: Target Audience — Just You, or Public Release?
This affects:
- Whether we need user registration at all (single-user vs multi-user)
- Whether we need app store polish
- Whether we need terms of service / privacy policy

### Q10: Notification Urgency
Some reminders are critical ("Take medication at 8 AM") and some are flexible ("Check houseplants sometime this week"). Do you want a priority system that affects notification behavior?
- **High**: Persistent notification, repeat every 5 min until acknowledged
- **Normal**: Standard push notification
- **Low**: Silent notification, just badge update

### Q11: Data Privacy Stance
Where should user data live?
- **Option A**: Our server only (simplest)
- **Option B**: Option to self-host the API (for privacy-conscious users)
- **Option C**: End-to-end encrypted (complex, limits server-side features like scheduling)

### Q12: Design Preferences
- Any specific color scheme or brand colors you have in mind?
- Prefer rounded/soft UI or sharp/angular?
- Any apps whose design you admire? (for reference)

---

## Decision Log

| # | Question | Answer | Date |
|---|----------|--------|------|
| Q1 | Auth strategy | **B** — Email/password + Google + Apple Sign-In | 2026-03-22 |
| Q2 | Hosting | Local dev, Vercel free tier for web, portable Docker API | 2026-03-22 |
| Q3 | App name | "RemindMe" for now, prep for change | 2026-03-22 |
| Q4 | Apple Developer | Phase 2. Compile unsigned .dmg for Mac testing now | 2026-03-22 |
| Q5 | Google Play | Phase 2 | 2026-03-22 |
| Q6 | Code signing | Phase 2 | 2026-03-22 |
| Q7 | Firebase | Needs to be created (new project) | 2026-03-22 |
| Q8 | Commit prefix | Skipped | 2026-03-22 |
| Q9 | Audience | Public release | 2026-03-22 |
| Q10 | Priority system | Yes — user-selectable urgency (critical/normal/low) | 2026-03-22 |
| Q11 | Data privacy | Server-side only (Option A) | 2026-03-22 |
| Q12 | Design prefs | Soft/rounded UI, no fixed colors, best-in-market modern, ready to change | 2026-03-22 |
