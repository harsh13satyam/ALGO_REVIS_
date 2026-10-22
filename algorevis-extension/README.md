# AlgoRevis Chrome Extension (Manifest V3)

Production-ready Chrome extension for [AlgoRevis](https://algorevis-app.onrender.com/), allowing users to save DSA coding problems, solution code, intuition, approaches, time/space complexity, and revision notes directly from **LeetCode**, **GeeksforGeeks**, and **Codeforces** without manually copying and pasting into the website.

---

## 🚀 Features

- **Manifest V3 Architecture**: Built adhering to modern Chrome extension standards with declarative service workers and secure permissions.
- **Multi-Platform Support**:
  - **LeetCode**: Detects title, slug, difficulty (Easy/Medium/Hard), language, and extracts code directly from the Monaco editor.
  - **GeeksforGeeks**: Detects title, canonical URL, difficulty, language, and extracts code from Ace/Monaco editors.
  - **Codeforces**: Detects problem title, rating/difficulty, problem identifier (e.g. `4A`), and extracts code or provides manual paste.
- **Editable Auto-Captured Fields**: Every auto-detected field (title, URL, difficulty, language, code) is directly editable in the popup.
- **Manual Code Entry Fallback**: If an unsupported page is detected or an editor has custom wrappers, users can enter or paste code directly. The UI marks the source with a clear `✍ Manual Entry` badge.
- **Learning & Revision Notes**:
  - Algorithmic Approach selector (Two Pointers, Sliding Window, Dynamic Programming, Hash Map, Binary Search, Graph, etc.).
  - Intuition ("Aha!" moment) field.
  - Time & Space Complexity fields with one-click quick tags (`O(1)`, `O(log n)`, `O(n)`, `O(n log n)`, `O(n²)`).
  - Personal edge-case notes.
- **Smart Duplicate Detection & Updating**:
  - Checks if the current problem already exists in the user's library.
  - If already saved, alerts the user and smoothly switches the primary action to **Update in AlgoRevis**, preserving the original review schedule while updating code and notes.
- **Seamless AlgoRevis Authentication**:
  - Sign in with existing AlgoRevis credentials.
  - Persistent session management stored securely in `chrome.storage.local`.
  - Automatic expired-token detection with safe re-login prompt.
- **Configurable Backend Target**:
  - Toggle between Cloud Production (`https://algorevis-app.onrender.com`) and Localhost (`http://localhost:5000`) with one click via the settings drawer.

---

## 📁 Directory Structure

```
algorevis-extension/
├── manifest.json                  # Manifest V3 specification
├── popup/
│   ├── popup.html                 # Extension popup markup
│   ├── popup.css                  # Minimal developer-focused dark UI
│   └── popup.js                   # Popup logic, auth, API calls, and form handling
├── scripts/
│   ├── background.js              # Background service worker (defaults & messaging)
│   ├── content.js                 # Content script injected into problem pages
│   └── adapters/
│       ├── leetcode.js            # LeetCode DOM & Monaco editor extractor
│       ├── geeksforgeeks.js       # GeeksforGeeks DOM & Ace/Monaco extractor
│       └── codeforces.js          # Codeforces DOM & submit form extractor
├── icons/                         # Extension icons (16, 32, 48, 128)
└── README.md
```

---

## 🛠️ Installation Instructions (Chrome Developer Mode)

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in the address bar.
3. In the top right corner, toggle **Developer mode** to **ON**.
4. Click the **Load unpacked** button in the top left.
5. In the file picker, select the `algorevis-extension` folder:
   ```
   d:\algo_revis\algorevis-extension
   ```
6. The extension **AlgoRevis - DSA Practice & Revision Companion** will appear in your installed extensions list.
7. Click the Chrome Extensions puzzle-piece icon in your toolbar and pin **AlgoRevis**.

---

## 🧑‍💻 How to Use

1. Click the **AlgoRevis** extension icon.
2. If not logged in, enter your existing AlgoRevis account email and password (or click the link to create an account on the website).
3. Open any problem page on:
   - **LeetCode**: `https://leetcode.com/problems/two-sum/`
   - **GeeksforGeeks**: `https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1`
   - **Codeforces**: `https://codeforces.com/problemset/problem/4/A`
4. Click the AlgoRevis extension icon.
5. The extension will automatically detect the platform, problem name, canonical URL, difficulty, programming language, and current editor code.
6. Select your **Approach / Pattern** (e.g. *Two Pointers*, *Sliding Window*), write your **Intuition**, click your **Time / Space Complexity**, and add any notes.
7. Click **Save Problem to AlgoRevis**.
8. The problem is scheduled for spaced repetition revision and immediately appears under **My Folders** on the AlgoRevis website!

---

## 🔒 Security & Permissions

- **`activeTab`**: Only accesses the DOM of the active problem tab when you click the extension.
- **`storage`**: Securely caches your JWT Bearer token and current user profile locally.
- **`scripting`**: Injects extraction logic on-demand if a tab was opened prior to extension installation.
- **Narrow Host Permissions**:
  - Restricts access strictly to `leetcode.com`, `geeksforgeeks.org`, `codeforces.com`, and `algorevis-app.onrender.com` / `localhost:5000`.
- **Zero Sensitive Data Access**: Never reads cookies, saved passwords, or unrelated private browser history.

---

## ⚠️ Known Limitations & Edge Cases

1. **Monaco Virtual Scrolling**:
   On extremely long files (>300 lines) on LeetCode without user interaction, Monaco may virtualize lines outside the viewport. The extension reads all rendered lines; if needed, simply select all (`Ctrl+A` / `Cmd+A`) and copy-paste into the code field.
2. **Codeforces Inline Editors**:
   Codeforces does not have an active code editor directly on the problem description page unless the submit section is open. When saving from a Codeforces problem description page, the extension automatically prompts for manual solution paste.
3. **Render Cold Starts**:
   If the AlgoRevis Render web service is spun down due to inactivity, the initial save or login request may take 15–30 seconds. The extension displays an informative status message instead of failing silently.

---

## 📦 Chrome Web Store Preparation Checklist

Before packaging for the Chrome Web Store:
1. Verify `version` in `manifest.json`.
2. Ensure `icons/` contain sharp PNG icons for 16x16, 32x32, 48x48, and 128x128.
3. Ensure no local console logs with sensitive data exist.
4. Compress the folder into a `.zip` archive containing only the extension files:
   ```bash
   zip -r algorevis-extension.zip manifest.json icons/ popup/ scripts/
   ```
5. Upload `.zip` to the [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
