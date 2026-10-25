# 06. API Documentation — AlgoRevis

> 📡 **API Reference Specification**: This document provides an exhaustive, verified specification for all REST API endpoints implemented in the AlgoRevis Express 5 backend.

---

## 🔐 Authentication & Session Endpoints (`/api/auth`)

### 1. Instant User Registration
Creates a new user account without OTP friction and establishes a session.

- **Method**: `POST`
- **Path**: `/api/auth/signup`
- **Auth Required**: No
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex.mercer@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "Account created successfully! Welcome to AlgoRevis.",
    "user": {
      "id": "671bb0e1816e04d49a212345",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "deliveryPreferences": {
        "time": "09:00",
        "reminderTime": "19:00",
        "timezone": "UTC",
        "emailEnabled": true
      }
    }
  }
  ```
- **Cookie Set**: `token=<JWT_TOKEN>; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`

---

### 2. User Login
Authenticates an existing user and issues an HTTP-only JWT session cookie.

- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "alex.mercer@example.com",
    "password": "SecurePassword123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "671bb0e1816e04d49a212345",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com"
    }
  }
  ```

---

### 3. Current User Profile Session
Silent verification endpoint called by React client on initial load.

- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth Required**: Yes (`protect` middleware via Cookie or `Bearer` header)
- **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "671bb0e1816e04d49a212345",
      "name": "Alex Mercer",
      "email": "alex.mercer@example.com",
      "deliveryPreferences": {
        "time": "09:00",
        "reminderTime": "19:00",
        "timezone": "UTC",
        "emailEnabled": true,
        "reminderEmailEnabled": true
      }
    }
  }
  ```
- **Error Response (401 Unauthorized)**:
  ```json
  {
    "message": "Not authorized to access this route"
  }
  ```

---

### 4. Update Delivery Preferences
Updates notification schedules and timezones.

- **Method**: `PUT`
- **Path**: `/api/auth/preferences`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "time": "08:30",
    "reminderTime": "20:00",
    "timezone": "Asia/Kolkata",
    "emailEnabled": true,
    "reminderEmailEnabled": true
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Preferences updated successfully",
    "deliveryPreferences": {
      "time": "08:30",
      "reminderTime": "20:00",
      "timezone": "Asia/Kolkata",
      "emailEnabled": true,
      "reminderEmailEnabled": true
    }
  }
  ```

---

## 📚 Problem Bank Endpoints (`/api/problems`)

### 1. List User Problems
Retrieves the authenticated user's saved problem library with optional folder filtering.

- **Method**: `GET`
- **Path**: `/api/problems`
- **Query Parameters**:
  - `folder` (optional): Filter by pattern folder (e.g. `Sliding Window`)
- **Success Response (200 OK)**:
  ```json
  [
    {
      "_id": "671bb5432111111111111111",
      "name": "Longest Substring Without Repeating Characters",
      "pattern": "Sliding Window",
      "difficulty": "Medium",
      "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
      "allLinks": [
        {
          "title": "LeetCode #3",
          "link": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
          "pattern": "Sliding Window",
          "difficulty": "Medium"
        }
      ],
      "intuition": "Maintain a dynamic window with a hash set tracking unique characters.",
      "intuitionImage": "https://res.cloudinary.com/.../window.png",
      "repetition": 2,
      "interval": 6,
      "easeFactor": 2.6,
      "nextRevisionDate": "2026-10-31T00:00:00.000Z"
    }
  ]
  ```

---

### 2. Create Problem
Saves a new problem into the user's bank.

- **Method**: `POST`
- **Path**: `/api/problems`
- **Request Body**:
  ```json
  {
    "name": "Two Sum",
    "pattern": "Two Pointers & Hash Map",
    "difficulty": "Easy",
    "link": "https://leetcode.com/problems/two-sum/",
    "intuition": "Use a hash map to store complements in single pass O(n).",
    "intuitionImage": "data:image/png;base64,iVBORw0KGgo...",
    "notes": "Remember 0-indexed output."
  }
  ```
- **Success Response (201 Created)**: Returns created problem document.

---

### 3. Folder Operations
- **List Folders**: `GET /api/problems/folders` (returns unique folder names and problem counts).
- **Rename Folder**: `PUT /api/problems/folders/rename` `{ oldName: "DP", newName: "Dynamic Programming" }`.
- **Delete Folder**: `DELETE /api/problems/folders/delete` `{ folderName: "Sliding Window", cascade: true }`.

---

## 🎯 Daily Challenge & Compiler Endpoints (`/api/challenges`)

### 1. Get Today's Daily Challenge
Retrieves or atomically creates today's dual-question challenge.

- **Method**: `GET`
- **Path**: `/api/challenges/today`
- **Auth Required**: Yes
- **Success Response (200 OK)**:
  ```json
  {
    "_id": "671bb9872111111111111111",
    "scheduledDate": "2026-10-25",
    "questionA": {
      "name": "Valid Anagram",
      "pattern": "Hash Map & Frequency Array",
      "difficulty": "Easy",
      "link": "https://leetcode.com/problems/valid-anagram/",
      "notes": "Frequency table approach",
      "completed": false
    },
    "questionB": {
      "title": "Group Anagram Variants",
      "difficulty": "Medium",
      "statement": "Given an array of strings, group the anagrams together...",
      "constraints": ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100"],
      "testCases": [
        { "input": "[\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"]", "expectedOutput": "[[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]" }
      ],
      "completed": false
    },
    "deliveryStatus": {
      "email": { "status": "sent" },
      "reminderEmail": { "status": "pending" }
    }
  }
  ```

---

### 2. Execute & Submit Solution
Runs code against test cases in the sandbox and updates challenge completion.

- **Method**: `POST`
- **Path**: `/api/challenges/:id/submit`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "questionType": "B",
    "language": "javascript",
    "code": "function solution(strs) { /* code */ return output; }"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "allPassed": true,
    "passedCount": 5,
    "totalCount": 5,
    "details": "All 5 test cases passed successfully!",
    "results": [
      { "testCase": 1, "passed": true, "input": "...", "expected": "...", "actual": "...", "executionTimeMs": 2 }
    ]
  }
  ```

---

### 3. Save Code Draft
Autosaves work-in-progress code in the editor.

- **Method**: `POST`
- **Path**: `/api/challenges/:id/draft`
- **Request Body**:
  ```json
  {
    "questionType": "B",
    "code": "function solution() { // in progress }",
    "language": "javascript"
  }
  ```
- **Success Response (200 OK)**: `{ "success": true, "draft": { ... } }`

---

## 🛠️ System Health & Utility Endpoints

### 1. System Health Status
- **Method**: `GET`
- **Path**: `/api/health`
- **Success Response (200 OK)**:
  ```json
  {
    "status": "healthy",
    "uptimeSeconds": 1420,
    "timestamp": "2026-10-25T12:05:00.000Z",
    "environment": "production",
    "database": {
      "connected": true,
      "readyState": 1
    },
    "services": {
      "scheduler": "active",
      "gemini": true,
      "email": true,
      "emailProvider": "brevo_https",
      "whatsapp": false
    }
  }
  ```

### 2. Cloudinary Media Upload
- **Method**: `POST`
- **Path**: `/api/upload/image`
- **Auth Required**: Yes
- **Request Body**: `{ "image": "data:image/png;base64,..." }`
- **Success Response (200 OK)**: `{ "url": "https://res.cloudinary.com/..." }`
