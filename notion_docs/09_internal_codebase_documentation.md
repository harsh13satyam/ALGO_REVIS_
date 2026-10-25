# 09. Internal Codebase Documentation — AlgoRevis

> 📂 **Source Code Architecture & Navigation**: This document provides an architectural walkthrough of the repository, key files, core services, and frontend view components for incoming engineers.

---

## 1. Repository Directory Structure

```
algo_revis/
├── algorevis-extension/            # Chrome Extension (Manifest V3)
│   ├── manifest.json               # Extension configuration & host permissions
│   ├── popup/                      # Popup UI (HTML, CSS, JS)
│   └── scripts/                    # Background worker & content scripts
│       ├── background.js           # Extension lifecycle & storage management
│       ├── content.js              # DOM injection & scraper controller
│       └── adapters/               # Platform-specific scraping adapters
│           ├── leetcode.js         # LeetCode DOM & React fiber extractor
│           ├── geeksforgeeks.js    # GFG article & problem DOM extractor
│           └── codeforces.js       # Codeforces problem extractor
├── backend/                        # Node.js & Express 5 API Backend
│   ├── server.js                   # Application entry point & middleware wiring
│   ├── config/                     # Database & cloud connection configurations
│   ├── middleware/                 # JWT authentication & request protection
│   ├── models/                     # Mongoose 9 MongoDB Schema definitions
│   ├── routes/                     # Express route controllers (/auth, /problems, etc.)
│   ├── services/                   # Business logic, SM-2, AI, Compiler, Email
│   └── tests/                      # Automated end-to-end integration test suites
├── frontend/                       # React 19 + Vite 8 SPA Client
│   ├── index.html                  # HTML entry point with Google Fonts
│   ├── vite.config.js              # Vite bundler & dev proxy configuration
│   └── src/                        # React source components & styling
│       ├── main.jsx                # React DOM mounting
│       ├── App.jsx                 # View state router & deep link handler
│       ├── api.js                  # Axios/Fetch HTTP client with cookie credentials
│       ├── DailyChallengeView.jsx  # Split-screen compiler & practice workspace
│       ├── DsaSheetsView.jsx       # Striver A2Z, CSES, Fraz DSA sheets engine
│       ├── MockTestsView.jsx       # Timed mock interview simulation tests
│       ├── RevisionModeDashboard.jsx # Topic pattern cards & streak tracker
│       ├── MyFolders.jsx           # Pattern folder manager & problem tables
│       ├── AddNewProblemForm.jsx   # Problem capture form with clipboard image paste
│       └── UserProfileModals.jsx   # Profile, preferences, and certificate modals
└── notion_docs/                    # Authoritative Notion documentation workspace
```

---

## 2. Core Backend Services (`backend/services/`)

### 1. `aiService.js` — Semantic Archetype Detection & Gemini Generator
- **Responsibility**: Ingests user problems, classifies them into distinct algorithmic archetypes (e.g. *Two Pointers & Hash Map*, *Sliding Window*, *Intervals*, *Binary Search*, *Dynamic Programming*), constructs zero-shot prompts for Google Gemini AI, validates the returned JSON, and caches test cases.
- **Key Functions**:
  - `detectPatternArchetype(pattern, difficulty, name)`: Normalizes user tags into standard archetypes.
  - `generateSimilarQuestion(pattern, difficulty, name)`: Synthesizes Question B with calibrated constraints and test cases.
  - `getCuratedArchetypeQuestion(archetype, difficulty)`: Deterministic fallback providing high-quality problems during AI timeouts.

### 2. `codeExecutionService.js` — Polyglot Code Sandbox
- **Responsibility**: Sandboxed execution of JavaScript and Python code against unit test assertions.
- **Key Functions**:
  - `runCode(code, language, customInput)`: Executes single code snippet and captures stdout/stderr.
  - `evaluateTestCases(code, language, testCases)`: Injects an automated evaluation harness, iterates through public and hidden test cases, measures execution time per test, and formats visual diffs.

### 3. `revisionService.js` — SuperMemo SM-2 Interval Calculator
- **Responsibility**: Implements the spaced repetition algorithm to schedule future revision dates.
- **Key Formula**:
  - Ease Factor update: $EF' = EF + (0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02))$, with a minimum threshold of $1.3$.
  - Interval progression: $I(1) = 1\text{ day}$, $I(2) = 6\text{ days}$, $I(n) = I(n-1) \times EF'$.
- **Key Functions**:
  - `calculateNextInterval(quality, currentRepetition, currentEaseFactor, currentInterval)`
  - `selectRevisionProblem(user)`: Queues due problems for the daily challenge.

### 4. `emailService.js` — Brevo HTTPS REST Transactional Engine
- **Responsibility**: Dispatches responsive HTML emails over Port 443 with live compiler deep links.
- **Key Functions**:
  - `sendDailyChallengeEmail(user, challenge)`: Morning release (09:00 AM) with Question A and Question B.
  - `sendStreakReminderEmail(user, challenge)`: Evening alert (07:00 PM) for pending daily challenges.
  - `buildChallengeEmailHTML()` & `buildStreakReminderHTML()`: Mobile-responsive HTML email builders.

### 5. `scheduler.js` — 60-Second Background Cron Worker
- **Responsibility**: Automated polling loop evaluating users whose scheduled delivery times have arrived.
- **Key Functions**:
  - `runSchedulerTick()`: Evaluates local time against user preferences; triggers morning release and evening streak reminder.
  - `deliverChallenge(user, challenge, options)`: Dispatches email and WhatsApp notifications.
  - `simulateDailyDelivery(user, options)`: Instant dev trigger for testing deliveries.

---

## 3. Core Frontend Views (`frontend/src/`)

| View Component | Purpose | Key Interactive Elements |
|---|---|---|
| **`DailyChallengeView.jsx`** | Dual-pane practice workspace & compiler | Monaco code editor, JS/Python language selector, "Run Code", "Submit Solution", test diffs, Question A/B tabs |
| **`DsaSheetsView.jsx`** | Curated industry sheets engine | Tabbed sheets (Striver A2Z, CSES, Fraz SDE), category toggles, "+ Add to Revision" one-click import |
| **`MockTestsView.jsx`** | Timed interview assessment simulator | Track cards (FAANG Sprint, DP Mastery), countdown timers, scoring breakdown |
| **`RevisionModeDashboard.jsx`** | Topic-based revision overview | Topic cards with difficulty counters, mastery progress bar, daily streak indicator |
| **`MyFolders.jsx`** | Problem bank & folder organization | Search bar, folder selector, problem table with multi-platform links, folder rename/delete modals |
| **`AddNewProblemForm.jsx`** | Manual problem entry | Title, pattern, difficulty, intuition, clipboard paste (`Ctrl+V`) for screenshot attachments |
| **`LandingPage.jsx`** | Marketing & feature showcase | Hero section, interactive compiler demo, feature carousels, FAQ, direct sign-in triggers |
