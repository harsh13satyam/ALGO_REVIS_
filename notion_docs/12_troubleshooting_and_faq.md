# 12. Troubleshooting and FAQ — AlgoRevis

> 🛠️ **Troubleshooting Matrix & Engineering FAQ**: This document provides solutions to real-world edge cases, runtime warnings, and architectural gotchas encountered in AlgoRevis.

---

## 1. Top 5 Runtime Gotchas & Verified Fixes

### 1. "You can only send testing emails to your own email address" (Resend Sandbox Error)
- **Symptom**: Scheduled daily challenge emails fail for users other than the account owner with Resend error `validation_error: 403`.
- **Cause**: Resend's free tier restricts outgoing emails to the account owner's address unless a custom verified domain is linked with DNS DKIM records.
- **Solution**: AlgoRevis incorporates **Brevo HTTPS REST API** (`https://api.brevo.com/v3/smtp/email`) as the primary email provider. Brevo does not enforce a single-recipient sandbox and delivers to any registered user address. Ensure `BREVO_API_KEY` and `BREVO_SENDER_EMAIL` are configured in `.env`.

---

### 2. "E11000 duplicate key error collection: users index: phone_1 dup key: { phone: null }"
- **Symptom**: User registration fails on the second user who does not provide a phone number.
- **Cause**: Standard unique indexes in MongoDB treat `null` as a unique value, causing collisions when multiple documents lack the field.
- **Solution**: Use a **Partial Filter Expression Index** in `backend/models/User.js`:
  ```javascript
  UserSchema.index(
    { phone: 1 },
    { unique: true, partialFilterExpression: { phone: { $type: "string" } } }
  );
  ```
  If this error occurs on an existing database, drop the legacy index via MongoDB Compass:
  ```bash
  db.users.dropIndex("phone_1")
  ```

---

### 3. Render Blocks Outbound SMTP (Connection Timeout on Ports 25 / 465 / 587)
- **Symptom**: Nodemailer hangs or errors with `ETIMEDOUT` when running on Render cloud containers.
- **Cause**: Cloud providers like Render and AWS block standard outbound SMTP ports (25, 465, 587) to prevent spam abuse.
- **Solution**: AlgoRevis dispatches emails via **HTTPS REST API over Port 443** using native `fetch('https://api.brevo.com/v3/smtp/email')`. Port 443 is never blocked by cloud firewalls.

---

### 4. Google Gemini API Network Timeout (> 15s)
- **Symptom**: Creating a daily challenge takes too long or throws an abort exception during peak AI traffic.
- **Cause**: External LLM generation latency or temporary API rate limits.
- **Solution**: `aiService.js` incorporates a robust timeout guard (15s) and an automated fallback:
  ```javascript
  try {
    const aiQuestion = await Promise.race([
      callGeminiAPI(prompt),
      new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), 15000))
    ]);
  } catch (err) {
    console.warn('⚠️ Falling back to curated archetype library...');
    return getCuratedArchetypeQuestion(pattern, difficulty);
  }
  ```

---

### 5. Email Button Links Redirect to `localhost:5173` Instead of Website
- **Symptom**: Clicking "Solve Challenge" on a mobile phone opens `http://localhost:5173` and fails.
- **Cause**: `CLIENT_URL` was defaulting to localhost when omitted from `.env`.
- **Solution**: Set `CLIENT_URL=https://algorevis-app.onrender.com` in `backend/.env` and Render dashboard. In `emailService.js`, the default fallback is set to `PRODUCTION_CLIENT_URL = 'https://algorevis-app.onrender.com'`.

---

## 2. Frequently Asked Questions (FAQ)

### Q1: Can I use AlgoRevis without configuring Brevo or Gemini API keys?
**Yes.** AlgoRevis was architected with full offline/mock capability. If API keys are omitted:
- AI Question generation seamlessly selects from our curated archetype library.
- Daily challenge emails are stored in MongoDB with `status: 'mock_sent'`.
- Intuition images are saved as base64 data-URIs if Cloudinary is not configured.

### Q2: How does the Chrome Extension scrape code from LeetCode's dynamic Monaco Editor?
LeetCode no longer uses standard textarea DOM inputs. The AlgoRevis extension (`algorevis-extension/scripts/adapters/leetcode.js`) inspects the dynamic React fiber nodes and Monaco editor model instances inside the DOM, extracting the raw solution buffer cleanly without clipboard manipulation.

### Q3: How does AlgoRevis handle users in different global timezones?
Each user document stores `deliveryPreferences.timezone` (e.g. `'Asia/Kolkata'`, `'America/New_York'`). The 60-second scheduler tick dynamically calculates local time using standard `Intl.DateTimeFormat`:
```javascript
const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false });
```
This guarantees that 09:00 AM problem delivery occurs at 09:00 AM in the user's specific timezone.
