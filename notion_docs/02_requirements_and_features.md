# 02. Requirements and Features — AlgoRevis

> 📋 **Requirements Traceability**: This document specifies the functional requirements, non-functional constraints, user stories, and verified implementation status for all features within the AlgoRevis platform.

---

## 1. User Roles & Personas

AlgoRevis defines two clear authorization roles:

1. **Guest / Unauthenticated User**:
   - Access to Landing Page, Feature showcases, Public documentation, and Login/Signup workflows.
   - Restricted from problem banks, daily challenges, code execution sandboxes, and user settings.
2. **Authenticated Coder / User**:
   - Full read/write access to personal problem bank, folder organization, custom notes, and intuition attachments.
   - Access to daily challenge queues, polyglot compiler, AI variant generator, DSA curated sheets, and mock tests.
   - Capability to configure delivery preferences (timezone, morning release time, evening reminder time, email toggles).

---

## 2. Functional Requirements

### FR-01: Problem Capture & Bank Management
- **FR-01.1**: The system must allow users to create problems with Title, Problem URL, Algorithmic Pattern, Difficulty (Easy, Medium, Hard), Intuition, Solution Code, and Notes.
- **FR-01.2**: The system must support multi-URL association (`allLinks`) so that the same problem on multiple coding platforms (LeetCode, GFG, Codeforces) can be tracked concurrently without database collision.
- **FR-01.3**: The system must allow organizing problems into custom pattern folders (e.g., *Sliding Window*, *Intervals*, *Dynamic Programming*).
- **FR-01.4**: The system must support renaming and deleting folders, with cascade deletion or re-categorization options.
- **FR-01.5**: The system must support image attachments for visual intuition (handwritten diagrams, tree drawings) via direct file upload, clipboard paste (`Ctrl+V`), or Cloudinary CDN URLs.

### FR-02: Automated Spaced Repetition (SuperMemo SM-2)
- **FR-02.1**: The system must calculate review intervals based on user recall grades (0 to 5) using the SuperMemo SM-2 algorithm.
- **FR-02.2**: The system must maintain `easeFactor` (minimum 1.3), `repetition` count, and `interval` days on each problem document.
- **FR-02.3**: Problems due for revision (`nextRevisionDate <= today`) must be queued as candidates for the Daily Challenge.

### FR-03: Daily Challenge & AI Variant Generation
- **FR-03.1**: The system must idempotently generate exactly one `DailyChallenge` document per user per scheduled day.
- **FR-03.2**: Question A must be selected from the user's due revision problems; if no problems are due, a problem with the lowest repetition count or highest difficulty must be picked as fallback.
- **FR-03.3**: Question B must be dynamically generated via Google Gemini AI based on Question A's pattern and difficulty.
- **FR-03.4**: If the AI API experiences a network timeout or failure, the system must immediately fall back to a curated library of algorithmic archetypes without disrupting the user experience.
- **FR-03.5**: The user must be able to switch between Question A and Question B with one click and store separate code drafts in the database.

### FR-04: In-Browser Polyglot Code Compiler
- **FR-04.1**: The compiler workspace must support **JavaScript** and **Python** code execution.
- **FR-04.2**: The sandbox must execute user code with custom input and capture standard output (stdout), standard error (stderr), and execution duration in milliseconds.
- **FR-04.3**: The system must execute code against predefined test cases (public examples and hidden benchmark test cases) and return an array of passed/failed assertions with expected vs. actual output diffs.
- **FR-04.4**: The sandbox must enforce a hard 5-second timeout to prevent infinite loops and resource exhaustion attacks.

### FR-05: Multi-Channel Automated Notifications
- **FR-05.1**: The system must run a background scheduler ticking every 60 seconds.
- **FR-05.2**: **Email 1 (Morning Release)**: Sent at the user's configured morning time (default 09:00 AM) containing Question A and Question B with direct links to the live web compiler.
- **FR-05.3**: **Email 2 (Evening Streak Alert)**: Sent at the user's configured reminder time (default 07:00 PM) if both daily challenge problems remain incomplete, alerting the user to protect their streak.
- **FR-05.4**: The primary email provider must be Brevo HTTPS REST API (Port 443) with seamless fallback to Resend API.

### FR-06: Curated DSA Sheets & Mock Assessments
- **FR-06.1**: The system must embed full problem sets for **Striver's A2Z DSA Sheet**, **CSES Problem Set**, and **Fraz's SDE Sheet**.
- **FR-06.2**: Users must be able to import sheet problems directly into their personal revision folders or launch them immediately in the code compiler.
- **FR-06.3**: The system must offer timed mock assessments (e.g., FAANG Interview Sprint, Binary Search Mastery) with live countdown timers and progress tracking.

### FR-07: Chrome Extension (Manifest V3)
- **FR-07.1**: Native DOM adapters must extract problem data from LeetCode, GeeksforGeeks, and Codeforces.
- **FR-07.2**: The extension must support one-click save into the user's AlgoRevis account using JWT authentication.
- **FR-07.3**: The extension must allow toggling between Cloud Production (`https://algorevis-backend.onrender.com`) and Localhost (`http://localhost:5000`).

---

## 3. Non-Functional Requirements (NFR)

| Category | Requirement | Target Metric / Verification |
|---|---|---|
| **Performance** | API Response Time | < 150ms for authenticated CRUD queries |
| **Performance** | Code Sandbox Execution | < 5,000ms hard cutoff; sub-second execution for typical DSA solutions |
| **Availability** | Web App & API Uptime | 99.5% availability hosted on Render Cloud Infrastructure |
| **Security** | Password Cryptography | Salted bcrypt with work factor 10 |
| **Security** | Session Management | HTTP-only, SameSite cookies with strict CORS origins |
| **Portability** | Multi-Platform Browsers | Chrome, Edge, Brave, Safari, Firefox (desktop & mobile responsive) |
| **Data Integrity** | Concurrency Safety | MongoDB unique compound indexes (`user` + `scheduledDate`) preventing race duplicate generation |
| **Resilience** | External Service Fallback | Automatic fallback from Gemini AI to Curated Library; Brevo to Resend |

---

## 4. Verified Feature Matrix

| Feature Module | Detailed Description | Implementation Status | Related Components | Verification |
|---|---|:---:|---|---|
| **Zero-Friction Signup** | Instant registration without mandatory OTP friction; optional verification | **Implemented** | `routes/auth.js`, `models/User.js` | Tested in `httpRouteTests.js` |
| **Collision-Free Phone Index** | `partialFilterExpression` on phone field prevents duplicate null key collisions | **Implemented** | `models/User.js` | Tested in `preDeploymentTests.js` |
| **Problem CRUD & Folders** | Full problem creation, editing, deletion, folder rename & cascade delete | **Implemented** | `routes/problems.js`, `MyFolders.jsx` | Verified via UI & API integration tests |
| **Dual Link Aggregation** | Multi-URL support (`allLinks`) displaying concurrent LeetCode & GFG links | **Implemented** | `DailyChallenge.js`, `DailyChallengeView.jsx` | Verified in daily challenge compiler view |
| **SuperMemo SM-2 Engine** | Spaced-repetition scheduling calculating next revision dates | **Implemented** | `services/revisionService.js` | Verified mathematically in unit tests |
| **Contextual AI Generation** | Semantic category detection and prompt synthesis via Google Gemini | **Implemented** | `services/aiService.js` | Verified with live AI API and curated fallback |
| **In-Browser Polyglot Compiler** | Monaco editor executing JS and Python with test case diffs | **Implemented** | `services/codeExecutionService.js` | Tested in `randomPracticeIntegrationTests.js` |
| **2-Mail Per Day Delivery** | Morning daily challenge + evening streak protection alert via Brevo | **Implemented** | `services/emailService.js`, `scheduler.js` | Verified via live SMTP relay delivery tests |
| **Cloudinary CDN Integration** | Automated upload of intuition screenshots and clipboard image paste | **Implemented** | `services/cloudinaryService.js`, `upload.js` | Verified via `/api/upload/image` endpoint |
| **Chrome Extension (MV3)** | Instant scraping of LeetCode, GeeksforGeeks, and Codeforces | **Implemented** | `algorevis-extension/` | Verified in browser environment |
| **Industry Curated Sheets** | Striver A2Z, CSES, and Fraz SDE sheets with 1-click import | **Implemented** | `frontend/src/DsaSheetsView.jsx` | Verified in live frontend interface |
| **Timed Mock Assessments** | Simulated interview sprints with live countdown timers | **Implemented** | `frontend/src/MockTestsView.jsx` | Verified in live frontend interface |
| **WhatsApp Notifications** | Daily challenge delivery and response webhook via Twilio | **Partially Implemented** | `services/whatsappService.js`, `routes/whatsappWebhook.js` | Code complete; requires active Twilio Sandbox |
| **C++ / Java Sandbox Runner** | Polyglot compilation for C++ and Java in addition to JS/Python | **Planned** | `services/codeExecutionService.js` | JS & Python active; C++/Java queued on roadmap |
