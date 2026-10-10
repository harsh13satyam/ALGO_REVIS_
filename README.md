# 🚀 AlgoRevis — The Disciplined Curator

**AlgoRevis** is an intelligent, full-stack Data Structures & Algorithms (DSA) revision and practice platform designed for disciplined software engineers. It bridges spaced-repetition revision, interactive code execution, and AI-powered variant generation to ensure you master and retain problem-solving patterns.

---

## ✨ Key Features & Capabilities

### 1. 🎲 Interactive Random Practice & Compiler Workspace
- **Dual-Pane Practice Workspace:** View problem statements, constraints, and examples on one side while coding in an integrated editor on the other.
- **Polyglot Code Sandbox:** Run and test code in both **JavaScript** and **Python** directly in the browser with execution timers and standard input/output capture.
- **Automated Test Runner:** Validate solutions against public and edge test cases with real-time pass/fail feedback and diff diagnostics.
- **Submission History:** Persistent logging of user attempts, statuses, runtimes, and completion timestamps.

### 2. 🤖 Context-Aware AI Question Generation
- **Semantic Category Detection:** Rather than relying on generic placeholders, the AI engine dynamically detects the problem archetype (Two Sum / Hash Maps, Sliding Window, Two Pointers, Binary Search, Dynamic Programming, Graphs, Stacks).
- **Custom Problem Variants:** Generates complementary "Question B" variations with calibrated difficulty, structured constraints, test cases, and hidden benchmark reference implementations.
- **Variant Rotation:** Intelligent avoidance of repeated AI challenges for the same topic.

### 3. 🔗 Multi-URL Dual Platform Links
- **Duplicate Name Tolerance:** Allows users to store problems sharing the same title (e.g., across different patterns or platforms) without database collision.
- **Side-by-Side Links:** When multiple links exist for a problem (e.g., LeetCode, GeeksforGeeks, Codeforces), all links are displayed concurrently in the compiler toolbar and problem header.

### 4. 📚 Curated Industry DSA Sheets (`DsaSheetsView`)
- **Striver's A2Z DSA Sheet:** Comprehensive coverage from basic arrays through advanced graph theory and DP.
- **CSES Problem Set:** Competitive programming classics (Sorting, Searching, Tree Algorithms, Dynamic Programming).
- **Fraz's SDE Sheet:** Core interview questions frequently tested at top tech companies.
- **Direct Library Integration:** One-click "+ Add to Revision" imports sheet problems directly into your personal revision folders, or opens them instantly in the compiler workspace.

### 5. ⏱️ Timed DSA Mock Assessments (`MockTestsView`)
- **Assessment Tracks:** FAANG Interview Sprint, Binary Search & Optimization, Advanced Data Structures, and Dynamic Programming Mastery.
- **Active Countdown Timers:** Simulates real interview time constraints with live timer indicators and per-question score breakdown.
- **Instant Workspace Launch:** Jump directly from the assessment into the code execution environment.

### 6. 📊 Revision Mode & Pattern Topics Grouping
- **Topics Breakdown:** Aggregates your entire problem collection by algorithmic pattern/folder with problem counts, completion status, and difficulty distribution.
- **Search & Filter:** Instant keyword search across topics and difficulties (Easy, Medium, Hard).
- **Direct Practice Actions:** Jump straight into pattern-focused revision with a single click.

### 7. 📁 Folder & Problem Management
- Organize problems by custom algorithmic patterns (e.g., *Sliding Window*, *Intervals*, *Monotonic Stack*).
- Attach custom notes, difficulty tags, external problem links, and base64 problem screenshots.
- Bulk folder rename and cascade deletion capabilities.

### 8. 🔒 Secure Zero-Friction Authentication
- **Secure Password Hashing:** Salted `bcryptjs` encryption (cost factor 10) on user credentials.
- **Persistent Sessions:** JSON Web Tokens (JWT) stored in HTTP-only cookies with `/api/auth/me` silent session verification on reload.
- **No-Friction Registration:** Clean, instantaneous signup requiring only Full Name, Email, and Password—no email/phone OTP blockers.
- **Collision-Free Phone Indexing:** MongoDB `partialFilterExpression` ensures users who register without a phone number never trigger null duplicate key index collisions.

### 9. ⏰ Automated Notification Scheduler
- Background cron scheduler (`scheduler.js`) delivering daily revision challenge reminders.
- Multi-channel notification pipeline supporting Resend Email API and Twilio SMS/WhatsApp notifications with mock fallbacks for local development.

---

## 🛠️ Tech Stack

| Domain | Technology | Description |
|---|---|---|
| **Frontend** | React 19, Vite 8 | Modern reactive client architecture with modular components |
| **Styling** | TailwindCSS v4 | Material 3 tokenized design system and custom signature gradients |
| **Backend** | Node.js, Express 5 | Asynchronous RESTful API backend with modular routing |
| **Database** | MongoDB Atlas, Mongoose 9 | Document store with partial indexes and schema validation |
| **Security** | JWT, bcryptjs, cookie-parser | Encrypted credentials and secure cookie-based session management |
| **Sandbox Execution** | Node.js isolated sandbox | Sandboxed JavaScript and Python runtime code execution |
| **External Services** | Resend API, Twilio API | Email dispatch and SMS/WhatsApp notifications |

---

## 🚀 Setup & Installation Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ LTS recommended)
- MongoDB Atlas cluster or local MongoDB instance

### 1. Environment Configuration
Create a `.env` file inside the `backend` folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secure_jwt_secret_key
# Optional Notification Keys:
RESEND_API_KEY=your_resend_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```
*The server will start on `http://localhost:5000` with MongoDB connected and background scheduler running.*

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Vite will launch the client application at `http://localhost:5173`.*

---

## 🧪 Testing

AlgoRevis includes comprehensive automated integration and HTTP route tests:

```bash
cd backend
npm test
```
This runs:
- `tests/randomPracticeIntegrationTests.js`: Validates question selection, AI variant generation, sandbox code runner, test case verification, and attempt logging.
- `tests/httpRouteTests.js`: Validates auth endpoints, problems CRUD, daily challenges, and external webhooks.

---

## 👨‍💻 Authors & Credits

**AlgoRevis** is developed by **Harsh and Prithvi Raj** ([@harsh13satyam](https://github.com/harsh13satyam)).
