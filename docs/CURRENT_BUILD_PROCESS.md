# Oh Right! — Current Build Process & Cloud Setup

> How to build locally, set up externalized cloud builds, sign apps for distribution, and where every secret goes.

---

## Table of Contents

1. [Current Local Build Process](#1-current-local-build-process)
2. [Externalize Desktop Builds (GitHub Actions)](#2-externalize-desktop-builds-github-actions)
3. [Self-Hosted Runners — Use Your Own Machines](#3-self-hosted-runners--use-your-own-machines)
4. [Externalize Mobile Builds (EAS)](#4-externalize-mobile-builds-eas)
5. [Code Signing — Step by Step](#5-code-signing--step-by-step)
6. [Complete Secrets Reference](#6-complete-secrets-reference)
7. [Day-to-Day Workflow](#7-day-to-day-workflow)
8. [GitHub Plans — What You Actually Need](#8-github-plans--what-you-actually-need)

---

## 1. Current Local Build Process

### What you do today (on your Mac)

```bash
# Step 1: Install dependencies (one-time, or after package changes)
npm install

# Step 2: Build the shared type library
npm run build -w @ohright/shared

# Step 3: Build the React UI
npm run build -w @ohright/ui

# Step 4: Build the Tauri desktop app (compiles Rust — takes ~30s first time, ~5s incremental)
npx tauri build

# Output:
#   packages/desktop/src-tauri/target/release/bundle/macos/Oh Right!.app
#   packages/desktop/src-tauri/target/release/bundle/dmg/Oh Right!_0.0.1_aarch64.dmg
```

### Run tests

```bash
npm run test -w @ohright/shared    # 102 tests
npm run test -w @ohright/ui        # 16 tests
```

### Run in dev mode (hot-reload)

```bash
# UI only (opens in browser at localhost:1420)
npm run dev

# Full desktop app (Tauri wraps the UI)
npx tauri dev
```

### What's slow locally

| Step | Time | Can externalize? |
|------|------|-----------------|
| `npm install` | 10-20s | No (needed locally) |
| Build shared | 1-2s | Yes (CI does it) |
| Build UI (Vite) | 1-2s | Yes (CI does it) |
| Build Tauri (Rust) | 25-90s | **Yes — GitHub Actions** |
| Build mobile (Expo) | N/A | **Yes — EAS Build** |
| Windows/Linux builds | Can't do locally | **Yes — GitHub Actions** |

---

## 2. Externalize Desktop Builds (GitHub Actions)

### Already configured

The workflow `.github/workflows/release-desktop.yml` builds for **all 4 platforms** when you push a version tag.

### How to use it

```bash
# 1. Make sure everything is committed and pushed
git push origin feat/local-first-native

# 2. Tag a release
git tag v0.1.0

# 3. Push the tag — this triggers the cloud build
git push --tags

# 4. Wait ~10-15 minutes. GitHub builds:
#    - macOS ARM (Apple Silicon) → .dmg
#    - macOS x64 (Intel) → .dmg
#    - Windows → .exe + .msi
#    - Linux → .deb + .AppImage

# 5. Download from: https://github.com/h3nryza/todo_app/releases
```

> **You don't need signing secrets for unsigned builds.** CI will still build and upload unsigned binaries. Signing is only needed to avoid OS warnings when users install.

---

## 3. Self-Hosted Runners — Use Your Own Machines

### Should you? Yes, if you have the hardware

If you have a Mac, a Windows PC, and a Linux box lying around, you can use them as **self-hosted GitHub Actions runners**. This means:

| | GitHub-Hosted Runners | Self-Hosted Runners |
|---|---|---|
| **Cost** | Free: 2,000 min/month, then $0.008/min | **Completely free, unlimited** |
| **Pro plan needed?** | No (free tier works) | **No — works on free GitHub plan** |
| **Speed** | Shared VMs, can queue | Your hardware, instant start |
| **Rust build cache** | Rebuilt each time (~5-10 min) | Cached locally (~30s incremental) |
| **macOS runner** | M1, shared | Your Mac, dedicated |
| **Maintenance** | Zero | Keep machines on + updated |
| **Security** | Sandboxed by GitHub | Your network — keep private repos only |

### The math

With GitHub-hosted runners, each release build takes ~40 min total across all platforms:
- Free tier: 2,000 min/month = ~50 releases/month (plenty)
- After that: ~$0.32 per release

With self-hosted runners: **unlimited releases, $0 forever**. Plus faster builds because Rust and npm caches persist between runs.

### Setup: One machine per OS (5 minutes each)

Each machine needs the GitHub runner agent installed. It's a one-time setup:

#### Step 1: Go to your repo settings

```
https://github.com/h3nryza/todo_app/settings/actions/runners/new
```

Or: **GitHub repo → Settings → Actions → Runners → New self-hosted runner**

#### Step 2: Pick the OS for each machine and follow the instructions

GitHub gives you copy-paste commands. Here's what it looks like:

##### macOS (your MacBook or Mac Mini)

```bash
# Download the runner
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-osx-arm64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-osx-arm64-2.321.0.tar.gz
tar xzf ./actions-runner-osx-arm64-2.321.0.tar.gz

# Configure (GitHub gives you the exact token)
./config.sh --url https://github.com/h3nryza/todo_app --token YOUR_TOKEN_HERE
#   → Name: mac-builder
#   → Labels: self-hosted, macOS, ARM64

# Install as service (runs on boot)
sudo ./svc.sh install
sudo ./svc.sh start

# Verify it's running
sudo ./svc.sh status
```

##### Windows (your Windows PC)

```powershell
# Open PowerShell as Administrator
mkdir C:\actions-runner; cd C:\actions-runner

# Download
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-win-x64-2.321.0.zip -OutFile actions-runner-win-x64-2.321.0.zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD\actions-runner-win-x64-2.321.0.zip", "$PWD")

# Configure
.\config.cmd --url https://github.com/h3nryza/todo_app --token YOUR_TOKEN_HERE
#   → Name: windows-builder
#   → Labels: self-hosted, Windows, X64

# Install as service
.\svc.cmd install
.\svc.cmd start
```

**Also install on Windows:** Node 20, Rust, Visual Studio Build Tools (C++ workload)

##### Linux (any Ubuntu/Debian box)

```bash
mkdir ~/actions-runner && cd ~/actions-runner
curl -o actions-runner-linux-x64-2.321.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.321.0.tar.gz

# Configure
./config.sh --url https://github.com/h3nryza/todo_app --token YOUR_TOKEN_HERE
#   → Name: linux-builder
#   → Labels: self-hosted, Linux, X64

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

**Also install on Linux:**
```bash
sudo apt-get install -y nodejs npm rustc cargo \
  libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libssl-dev
```

#### Step 3: Update the workflow to use your runners

Change `runs-on` in `.github/workflows/release-desktop.yml`:

```yaml
# Before (GitHub-hosted):
runs-on: macos-latest       # → Apple's shared VM
runs-on: windows-latest     # → Microsoft's shared VM
runs-on: ubuntu-22.04       # → Canonical's shared VM

# After (self-hosted):
runs-on: [self-hosted, macOS]     # → Your Mac
runs-on: [self-hosted, Windows]   # → Your Windows PC
runs-on: [self-hosted, Linux]     # → Your Linux box
```

That's it. Same workflow, same tag trigger, but builds run on your machines.

#### Step 4: Verify runners are connected

```
https://github.com/h3nryza/todo_app/settings/actions/runners
```

You should see all 3 runners with a green "Idle" status.

### Hybrid approach (recommended)

You don't have to choose one or the other. Use self-hosted for the platforms you have, and GitHub-hosted for the rest:

```yaml
jobs:
  build-macos-arm:
    runs-on: [self-hosted, macOS]      # Your Mac — fast, cached
  build-macos-x64:
    runs-on: macos-latest              # GitHub-hosted — you only have ARM
  build-windows:
    runs-on: [self-hosted, Windows]    # Your Windows PC
  build-linux:
    runs-on: [self-hosted, Linux]      # Your Linux box
```

### Security note

> Self-hosted runners should only be used on **private repositories** or repos where you trust all contributors. Public repos could have PRs that run malicious code on your machines. If your repo is public, either:
> - Keep using GitHub-hosted runners for PRs (current setup)
> - Only use self-hosted runners for tag-triggered release builds (not PR builds)
> - Set up runner groups with restricted access

### Keep machines running

The runner agent needs the machine to be on and connected to the internet. For always-on builds:
- **Mac Mini** — perfect build server, low power, runs 24/7
- **Old laptop** — plug in, close lid, set "never sleep when plugged in"
- **NUC or mini PC** — small, quiet, cheap

---

## 4. Externalize Mobile Builds (EAS)

### One-time setup

```bash
# Step 1: Install EAS CLI globally
npm install -g eas-cli

# Step 2: Create a free Expo account
eas login
#   → Free tier: 30 builds/month

# Step 3: Link the project
cd packages/mobile
eas init
#   → Creates/links an Expo project ID
#   → Writes project ID into app.json

# Step 4: Verify
eas whoami

# Step 5: Generate access token for CI
#   → Go to: https://expo.dev/accounts/[your-username]/settings/access-tokens
#   → Click "Create Token", name: "github-actions"
#   → Copy token → add to GitHub secrets as: EXPO_TOKEN
```

### Build commands

```bash
cd packages/mobile

# Android APK (testing)
eas build -p android --profile preview

# Android AAB (Play Store)
eas build -p android --profile production

# iOS (App Store / TestFlight)
eas build -p ios --profile production

# Submit to stores
eas submit -p android    # → Google Play
eas submit -p ios        # → App Store / TestFlight
```

### Mobile builds run in CI automatically

The workflow `.github/workflows/release-mobile.yml` triggers on the same `v*` tags as desktop. When you push a tag, **both desktop and mobile build in parallel**:

```mermaid
graph TD
    A["git tag v0.1.0 && git push --tags"] --> B["release-desktop.yml"]
    A --> C["release-mobile.yml"]
    B --> D["macOS .dmg"]
    B --> E["Windows .exe"]
    B --> F["Linux .AppImage"]
    C --> G["Android APK + AAB"]
    C --> H["iOS IPA"]
    G --> I["Auto-submit to Play Store (optional)"]
    H --> J["Auto-submit to App Store (optional)"]
```

---

## 5. Code Signing — Step by Step

### Why sign?

| Platform | Without signing | With signing |
|----------|----------------|-------------|
| **macOS** | "Oh Right! is damaged and can't be opened" | Opens normally |
| **Windows** | "Windows protected your PC" (SmartScreen) | Opens normally |
| **iOS** | Can't install outside TestFlight | App Store distribution |
| **Android** | Requires "Install from unknown sources" | Play Store distribution |
| **Linux** | No issues | No issues |

---

### 5.1 macOS Code Signing + Notarization

#### Prerequisites
- Apple Developer account ($99/year) at [developer.apple.com](https://developer.apple.com)

#### Step 1: Create a Developer ID certificate

```
1. Go to developer.apple.com/account
2. Click "Certificates, IDs & Profiles"
3. Click "+" to create a new certificate
4. Select "Developer ID Application"
5. Follow the steps to create a Certificate Signing Request (CSR):
   - Open Keychain Access on your Mac
   - Menu: Keychain Access → Certificate Assistant → Request a Certificate from a CA
   - Enter your email, select "Saved to disk"
   - Upload the .certSigningRequest file to Apple
6. Download the certificate → double-click to install in Keychain
```

#### Step 2: Export as .p12 for CI

```bash
# 1. Open Keychain Access
# 2. Go to "My Certificates"
# 3. Find "Developer ID Application: Your Name (XXXXXXXXXX)"
# 4. Right-click → "Export..."
# 5. Save as .p12, set a strong password
# 6. Base64-encode it for GitHub Actions:

base64 -i ~/Desktop/OhRight-signing.p12 | pbcopy
# The encoded string is now in your clipboard
```

#### Step 3: Create app-specific password for notarization

```
1. Go to appleid.apple.com
2. Sign in
3. Go to "Sign-In and Security" → "App-Specific Passwords"
4. Click "Generate an App-Specific Password"
5. Label: "Oh Right Notarization"
6. Copy the generated password
```

#### Step 4: Find your Team ID

```
1. Go to developer.apple.com/account
2. Look under "Membership Details"
3. Your Team ID is the 10-character alphanumeric code
```

#### Step 5: Add secrets to GitHub

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret Name | Value |
|-------------|-------|
| `APPLE_CERTIFICATE` | The base64 string from Step 2 |
| `APPLE_CERTIFICATE_PASSWORD` | Password you set in Step 2 |
| `APPLE_SIGNING_IDENTITY` | `Developer ID Application: Your Name (XXXXXXXXXX)` |
| `APPLE_ID` | Your Apple ID email |
| `APPLE_PASSWORD` | App-specific password from Step 3 |
| `APPLE_TEAM_ID` | 10-char Team ID from Step 4 |

#### Step 6: Verify

Push a tag → the CI builds a signed + notarized .dmg that installs without warnings.

```bash
# To verify signing locally:
codesign -dv --verbose=4 "Oh Right!.app"
# Should show: Authority=Developer ID Application: Your Name

# To verify notarization:
spctl -a -vvv "Oh Right!.app"
# Should show: source=Notarized Developer ID
```

---

### 5.2 Windows Code Signing

#### Prerequisites
- Code signing certificate from a CA ($70-200/year)
- Recommended: [SSL.com](https://ssl.com) ($70/yr OV), [Sectigo](https://sectigo.com) ($80/yr), [DigiCert](https://digicert.com) ($200/yr EV)

#### Process

```
1. Purchase an OV or EV code signing certificate
   - OV (Organization Validation): cheaper, but SmartScreen builds reputation slowly
   - EV (Extended Validation): more expensive, but instant SmartScreen trust

2. The CA will verify your identity (takes 1-5 days)

3. Once issued, you'll receive a .pfx or .p12 certificate file

4. Base64-encode it:
   # On macOS/Linux:
   base64 -i certificate.pfx | pbcopy

   # On Windows:
   certutil -encode certificate.pfx encoded.txt

5. Add to GitHub secrets:
   Secret Name: TAURI_SIGNING_PRIVATE_KEY
   Value: the base64-encoded certificate
```

> **Tip:** Start without Windows signing. SmartScreen warnings are annoying but users can click "More info → Run anyway". Get signing when you have paying users.

---

### 5.3 iOS Code Signing (EAS handles it)

EAS Build manages iOS signing automatically. You don't need to create certificates manually.

```bash
# First time: EAS prompts you to log into Apple Developer
eas build -p ios --profile production

# What happens behind the scenes:
# 1. EAS logs into your Apple Developer account
# 2. Creates a Distribution Certificate (if needed)
# 3. Creates a Provisioning Profile (if needed)
# 4. Builds and signs the IPA
# 5. You can submit directly:
eas submit -p ios
```

#### If you want to manage credentials manually:

```bash
eas credentials -p ios

# Options:
# → "Log in to your Apple Developer account"
# → "Use an existing Distribution Certificate" (if you have one)
# → "Let EAS handle it" (recommended)
```

---

### 5.4 Android Code Signing (EAS handles it)

EAS creates and manages an upload keystore automatically for Play Store builds.

```bash
# First production build — EAS creates the keystore:
eas build -p android --profile production

# The keystore is stored securely on EAS servers
# You can download a backup:
eas credentials -p android
# → Select "Download Keystore"
# → SAVE THIS FILE — if lost, you can never update your Play Store app
```

#### For Google Play submission:

```bash
# 1. Create Play Console account: play.google.com/console ($25 one-time)
# 2. Create the app listing
# 3. Submit via EAS:
eas submit -p android

# Or manually: download the AAB from the EAS build URL and upload to Play Console
```

#### Google Play service account (for automated submission):

```
1. Go to Google Cloud Console → create a service account
2. Go to Play Console → Settings → API access → link the service account
3. Grant "Release manager" permissions
4. Download the JSON key file
5. Configure in EAS:
   eas credentials -p android
   → "Set up Google Service Account Key for Play Store submissions"
   → Upload the JSON key
```

---

### 5.5 Signing Timeline (Recommended Order)

```mermaid
graph TD
    A["Phase 1: Testing"] --> B["No signing needed"]
    B --> C["Distribute unsigned via GitHub Releases"]
    C --> D["Phase 2: Early Users"]
    D --> E["macOS signing ($99/yr Apple Dev)"]
    D --> F["Android Play Store ($25 one-time)"]
    E --> G["Phase 3: Public Launch"]
    F --> G
    G --> H["iOS App Store (included in Apple Dev)"]
    G --> I["Windows signing ($70-200/yr)"]
    I --> J["Phase 4: Scale"]
    H --> J
    J --> K["Mac App Store (optional)"]
    J --> L["Microsoft Store (optional)"]
```

**Right now you're in Phase 1.** Everything works without signing — just some OS warnings.

---

## 6. Complete Secrets Reference

### All secrets in one place

| Secret Name | Platform | Where to Set | How to Get | Required When |
|-------------|----------|-------------|-----------|---------------|
| `APPLE_CERTIFICATE` | macOS | GitHub Actions | Keychain Access → export .p12 → `base64 -i cert.p12` | Signed macOS builds |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | GitHub Actions | Password you set when exporting .p12 | Signed macOS builds |
| `APPLE_SIGNING_IDENTITY` | macOS | GitHub Actions | Keychain Access → "My Certificates" → copy name | Signed macOS builds |
| `APPLE_ID` | macOS | GitHub Actions | Your Apple ID email | Notarized macOS builds |
| `APPLE_PASSWORD` | macOS | GitHub Actions | appleid.apple.com → App-Specific Passwords | Notarized macOS builds |
| `APPLE_TEAM_ID` | macOS | GitHub Actions | developer.apple.com/account → Membership | Notarized macOS builds |
| `TAURI_SIGNING_PRIVATE_KEY` | Windows | GitHub Actions | Code signing cert from CA → base64 encode | Signed Windows builds |
| `EXPO_TOKEN` | Mobile | GitHub Actions | expo.dev → Account Settings → Access Tokens | CI mobile builds |
| `GITHUB_TOKEN` | All | (automatic) | Provided by GitHub | Always |

### Where to add GitHub secrets

```
https://github.com/h3nryza/todo_app/settings/secrets/actions

→ Click "New repository secret"
→ Enter name and value
→ Click "Add secret"
```

### Cost summary

| Service | Cost | What you get | When to buy |
|---------|------|-------------|-------------|
| GitHub Actions | **Free** | Desktop builds, CI/CD | Now (already using) |
| EAS Build | **Free** | 30 mobile builds/month | Now (set up above) |
| Apple Developer | $99/year | macOS signing + iOS | When ready for users |
| Google Play Console | $25 one-time | Android distribution | When ready for users |
| Windows code signing | $70-200/year | No SmartScreen warnings | When you have users |

---

## 7. Day-to-Day Workflow

### Development (daily)

```bash
# 1. Write code
# 2. Test locally
npm run test -w @ohright/shared

# 3. Quick desktop test (if needed)
npx tauri dev

# 4. Commit and push
git add . && git commit -m "feat: whatever" && git push
#   → CI runs: lint, type-check, tests (automatic)
```

### Release (when ready)

```bash
# 1. Bump version
./scripts/bump-version.sh 0.1.0

# 2. Commit the version bump
git add -A && git commit -m "chore: bump version to 0.1.0"

# 3. Tag and push — triggers ALL cloud builds (desktop + mobile)
git tag v0.1.0
git push && git push --tags

# 4. Everything happens automatically:
#    Desktop (~10-15 min): .dmg, .exe, .msi, .deb, .AppImage → GitHub Releases
#    Mobile (~15-20 min): APK, AAB, IPA → EAS dashboard + optional store submission
```

### Complete pipeline

```mermaid
graph LR
    A["git push --tags"] --> B["GitHub Actions"]
    A --> C["GitHub Actions"]
    B --> D["release-desktop.yml"]
    C --> E["release-mobile.yml"]
    D --> F["macOS arm64 .dmg"]
    D --> G["macOS x64 .dmg"]
    D --> H["Windows .exe + .msi"]
    D --> I["Linux .deb + .AppImage"]
    E --> J["Android APK + AAB"]
    E --> K["iOS IPA"]
    F --> L["GitHub Release"]
    G --> L
    H --> L
    I --> L
    J --> M["EAS + Play Store"]
    K --> N["EAS + App Store"]
```

### What you never build locally again

Everything. Push a tag → go get coffee → all 7 platform binaries ready when you get back.

---

## 8. GitHub Plans — What You Actually Need

### Short answer: the Free plan is fine

| Feature | Free | Pro ($4/mo) | Team ($4/user/mo) |
|---------|------|-------------|-------------------|
| GitHub Actions minutes | 2,000/month | 3,000/month | 3,000/month |
| Self-hosted runners | **Unlimited, free** | Unlimited, free | Unlimited, free |
| Private repos | **Unlimited** | Unlimited | Unlimited |
| Secrets for Actions | **Unlimited** | Unlimited | Unlimited |
| GitHub Releases | **Unlimited** | Unlimited | Unlimited |
| Max artifact storage | 500 MB | 2 GB | 2 GB |
| Concurrent jobs | 20 | 20 | 20 |

### What Pro gives you that Free doesn't (that matters)

- **More Actions minutes**: 3,000 vs 2,000 — only matters if you do 50+ releases/month on GitHub-hosted runners
- **More artifact storage**: 2 GB vs 500 MB — your .dmg is ~12 MB, so 500 MB is plenty
- **Required reviewers on branches**: nice for teams, irrelevant for solo dev
- **GitHub Pages from private repos**: not needed for this project

### The real answer

```
┌──────────────────────────────────────────────────────────────────┐
│  You need: GitHub Free plan                                      │
│                                                                  │
│  If you use self-hosted runners (your own machines):             │
│    → You get unlimited builds, $0/month, forever                 │
│    → No plan upgrade ever needed                                 │
│                                                                  │
│  If you use GitHub-hosted runners only:                          │
│    → 2,000 min/month = ~50 releases/month                       │
│    → That's ~1.6 releases per day — more than enough             │
│    → If you somehow exceed: Pro ($4/mo) gives 3,000 min          │
│                                                                  │
│  Self-hosted runners + GitHub Free = unlimited free builds       │
└──────────────────────────────────────────────────────────────────┘
```

### Minute usage per release build

| Platform | GitHub-hosted | Self-hosted |
|----------|-------------|-------------|
| macOS arm64 | ~10 min | ~2 min (cached) |
| macOS x64 | ~10 min | N/A (use GitHub) |
| Windows | ~8 min | ~3 min (cached) |
| Linux | ~6 min | ~2 min (cached) |
| **Total per release** | **~34 min** | **~7 min** |
| **Releases per month (free tier)** | **~58** | **Unlimited** |

### Recommendation

```mermaid
graph TD
    A["Do you have spare machines?"] -->|Yes| B["Use self-hosted runners"]
    A -->|No| C["GitHub Free + hosted runners"]
    B --> D["Unlimited builds, $0/month"]
    C --> E["50+ releases/month free"]
    E --> F["Need more?"]
    F -->|"Unlikely"| G["Stay on Free"]
    F -->|"Yes (50+ releases/month)"| H["Upgrade to Pro ($4/mo)"]
```

**Bottom line: Stay on the Free plan. Use self-hosted runners if you have the hardware. You won't need Pro.**
