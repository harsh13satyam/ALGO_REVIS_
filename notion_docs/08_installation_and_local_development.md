# 08. Installation and Local Development — AlgoRevis

> 💻 **Developer Onboarding Guide**: This document provides end-to-end instructions for cloning, configuring, and launching the full AlgoRevis stack locally (Backend, Frontend, and Chrome Extension).

---

## 1. Prerequisites & Required Tools

Before setting up AlgoRevis, ensure your development workstation meets the following requirements:

| Tool | Minimum Version | Recommended | Verification Command |
|---|---|---|---|
| **Node.js** | `v18.0.0` | `v20.x` or `v22.x` (LTS) | `node -v` |
| **npm** | `9.x` | `10.x` | `npm -v` |
| **Git** | `2.30+` | Latest | `git --version` |
| **MongoDB** | `v6.0+` or MongoDB Atlas Cluster | MongoDB Atlas M0 Free Cluster | (Cloud URI or local `mongod`) |
| **Browser** | Chromium-based | Google Chrome, Brave, or Edge | For loading Manifest V3 extension |

---

## 2. Repository Cloning

```bash
git clone https://github.com/harsh13satyam/ALGO_REVIS_.git
cd ALGO_REVIS_
```

---

## 3. Backend Setup

### Step 3.1: Configure Environment Variables
Navigate to the `backend` folder and create a `.env` file:

```bash
cd backend
```

Create `.env` with the following configuration:

```env
# Server Port
PORT=5000

# MongoDB Atlas URI (Replace with your actual cluster credentials)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.vdyvoi8.mongodb.net/?appName=Cluster0

# JWT Encryption Secret
JWT_SECRET=super_secure_jwt_secret_key_algo_revis_2026

# Production or Local Client URL
CLIENT_URL=http://localhost:5173

# --- External Services Configuration (Optional for Mock/Dev Mode) ---

# Brevo Transactional Email API (Port 443 HTTPS SMTP)
BREVO_API_KEY=xkeysib-your_brevo_api_key_here
BREVO_SENDER_EMAIL=your_verified_sender@gmail.com
BREVO_SENDER_NAME=AlgoRevis

# Resend API (Fallback Email Provider)
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=AlgoRevis <onboarding@resend.dev>

# Google Gemini Generative AI (For context-aware Question B variant generation)
GEMINI_API_KEY=your_gemini_api_key_here

# Cloudinary CDN (For image uploads and intuition diagrams)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Twilio Verify & WhatsApp (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid
```

> 💡 **Dev Mode Fallbacks**: If you do not have Brevo, Gemini, or Cloudinary keys, the backend automatically runs in **fallback mode**:
> - Missing Gemini API key → Automatically selects from the internal curated archetype problem library.
> - Missing Brevo key → Logs mock email deliveries to the database with `status: 'mock_sent'`.
> - Missing Cloudinary keys → Stores visual diagrams as base64 data-URIs directly in MongoDB.

### Step 3.2: Install Backend Dependencies & Start Server
```bash
npm install
npm start
```
*The server will start on `http://localhost:5000` with the background scheduler running.*

---

## 4. Frontend Setup

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server will boot on `http://localhost:5173`. Open your browser to access the AlgoRevis user interface.

---

## 5. Chrome Extension Setup (Manifest V3)

AlgoRevis includes a companion Chrome extension that scrapes problem statements, constraints, and solutions directly from LeetCode, GeeksforGeeks, and Codeforces.

### Step 5.1: Load Extension into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button.
4. Select the `algorevis-extension` folder inside your cloned repository (`d:\algo_revis\algorevis-extension`).
5. The **AlgoRevis Curator** extension icon will appear in your Chrome toolbar.

### Step 5.2: Toggle Backend Environment in Extension
1. Click the AlgoRevis extension icon in your browser toolbar.
2. Open the **Settings** gear icon.
3. Set the **API Base URL**:
   - For Local Development: `http://localhost:5000`
   - For Cloud Production: `https://algorevis-backend.onrender.com`
4. Click **Save Settings**.

---

## 6. Running Automated Test Suites

AlgoRevis includes an automated integration and pre-deployment test suite. From the `backend` folder, run:

```bash
# Run HTTP Route & Auth End-to-End Tests
node tests/httpRouteTests.js

# Run Random Practice, Compiler & Gemini AI Integration Tests
node tests/randomPracticeIntegrationTests.js

# Run Pre-Deployment Verification Suite
node tests/preDeploymentTests.js

# Run Chrome Extension Integration Tests
node tests/extensionIntegrationTests.js
```
