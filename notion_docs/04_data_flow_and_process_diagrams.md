# 04. Data Flow and Process Diagrams — AlgoRevis

> 🔄 **Workflow & Process Specifications**: This document illustrates the core execution paths, temporal sequences, and data transformations across the AlgoRevis platform using detailed Mermaid sequence and state diagrams.

---

## 1. User Registration & Zero-Friction Authentication Flow

AlgoRevis offers instant signup without mandatory OTP bottlenecks, while maintaining optional phone/email verification:

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant FE as React Client (Signup.jsx)
    participant AuthRouter as Express Router (/api/auth/signup)
    participant UserModel as Mongoose User Model
    participant DB as MongoDB Atlas

    User->>FE: Fill Full Name, Email, Password
    FE->>AuthRouter: POST /api/auth/signup { name, email, password }
    AuthRouter->>UserModel: Check User.findOne({ email })
    UserModel->>DB: Query by email
    DB-->>UserModel: Null (Email available)
    
    AuthRouter->>UserModel: new User({ name, email, password })
    Note over UserModel: Pre-save hook hashes password using bcrypt (cost 10)
    UserModel->>DB: Save User Document
    DB-->>UserModel: Saved Successfully

    AuthRouter->>AuthRouter: signToken(user._id) -> JWT Token
    AuthRouter-->>FE: HTTP 201 Created + Set-Cookie: token=JWT (HttpOnly)
    FE->>FE: Update currentUser state & navigate('dashboard_home')
```

---

## 2. Chrome Extension Scraping & One-Click Sync Flow

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer on LeetCode / GFG
    participant ExtContent as Extension Content Script (content.js)
    participant Adapter as Platform Adapter (leetcode.js)
    participant ExtPopup as Extension Popup UI (popup.js)
    participant Backend as AlgoRevis API (/api/problems)
    participant DB as MongoDB Atlas

    Dev->>ExtPopup: Click "Extract Problem Details"
    ExtPopup->>ExtContent: chrome.tabs.sendMessage({ action: 'EXTRACT_PROBLEM' })
    ExtContent->>Adapter: parsePage()
    Note over Adapter: Scrapes DOM title, difficulty, pattern, statement & submitted code
    Adapter-->>ExtContent: Return Problem Data Object
    ExtContent-->>ExtPopup: Return extracted fields
    
    Dev->>ExtPopup: Review / Add Intuition Note & Click "Save to AlgoRevis"
    ExtPopup->>Backend: POST /api/problems (Authorization: Bearer <token>)
    Backend->>DB: Problem.create({ ...problemData, user: req.user._id })
    DB-->>Backend: Saved Document
    Backend-->>ExtPopup: HTTP 201 Created { success: true, problem }
    ExtPopup-->>Dev: Display "Saved Successfully!" Checkmark
```

---

## 3. Daily Challenge Generation (SM-2 Spaced Repetition + Gemini AI)

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as Background Cron Worker (scheduler.js)
    participant RevService as Revision Service (SM-2)
    participant AIService as AI Service (aiService.js)
    participant Gemini as Google Gemini AI API
    participant DB as MongoDB Atlas

    Scheduler->>DB: Find users due for delivery
    DB-->>Scheduler: List of Users
    
    Scheduler->>RevService: selectRevisionProblem(user)
    RevService->>DB: Query Problem.find({ user, nextRevisionDate: <= today })
    DB-->>RevService: Due Problem Found (Question A)
    
    Scheduler->>AIService: generateSimilarQuestion(pattern, difficulty, name)
    
    alt Gemini AI Available
        AIService->>Gemini: POST generateContent(prompt)
        Gemini-->>AIService: Return JSON { title, statement, testCases, solution }
    else Timeout / Failure (> 15s)
        AIService->>AIService: Fallback to Curated Archetype Library
    end

    Scheduler->>DB: DailyChallenge.create({ user, scheduledDate, questionA, questionB })
    DB-->>Scheduler: DailyChallenge Document Saved
```

---

## 4. In-Browser Polyglot Code Sandbox Execution Flow

```mermaid
sequenceDiagram
    autonumber
    actor Coder as User in Compiler Workspace
    participant Editor as Monaco Editor (DailyChallengeView.jsx)
    participant CompRouter as Compiler Router (/api/challenges/:id/submit)
    participant Sandbox as Execution Sandbox (codeExecutionService.js)
    participant Engine as Node.js VM / Python Process

    Coder->>Editor: Click "Run Code" or "Submit Solution"
    Editor->>CompRouter: POST /api/challenges/:id/submit { questionType: 'B', language, code }
    CompRouter->>Sandbox: evaluateTestCases(code, language, testCases)

    loop For each test case
        Sandbox->>Engine: Spawn isolated runtime with stdin = testCase.input
        Engine->>Engine: Execute solution with 5,000ms watchdog
        Engine-->>Sandbox: Capture stdout, stderr, execution time
        Sandbox->>Sandbox: Normalize output & assert against expectedOutput
    end

    Sandbox-->>CompRouter: Return { allPassed, passedCount, totalCount, results: [...] }
    CompRouter->>CompRouter: Record PracticeAttempt & update DailyChallenge state
    CompRouter-->>Editor: HTTP 200 OK with detailed test assertion diffs
    Editor-->>Coder: Render Test Results & Visual Diff Indicators
```

---

## 5. Dual-Notification Delivery Pipeline (2 Emails Per Day)

AlgoRevis enforces a strict **2-email-per-day rhythm** to guarantee that daily practice habits are formed and preserved:

```mermaid
stateDiagram-v2
    [*] --> SchedulerTick: Every 60 seconds
    
    state "Check User Local Time" as TimeCheck
    SchedulerTick --> TimeCheck

    state "09:00 AM Morning Release" as MorningRelease {
        [*] --> CheckMorningSent
        CheckMorningSent --> DeliverMorningEmail: Status pending/failed
        CheckMorningSent --> SkipMorning: Status already sent
        DeliverMorningEmail --> BrevoMorning: POST https://api.brevo.com/v3/smtp/email
        BrevoMorning --> SaveSentRecord: Success (201 Created)
    }

    state "07:00 PM Evening Streak Alert" as EveningAlert {
        [*] --> CheckChallengeCompletion
        CheckChallengeCompletion --> SkipEvening: Both Q-A & Q-B Completed
        CheckChallengeCompletion --> DeliverEveningReminder: Questions Still Pending
        DeliverEveningReminder --> BrevoEvening: POST https://api.brevo.com/v3/smtp/email
        BrevoEvening --> SaveReminderRecord: Success (201 Created)
    }

    TimeCheck --> MorningRelease: currentTime >= morningTime (09:00)
    TimeCheck --> EveningAlert: currentTime >= reminderTime (19:00)
```
