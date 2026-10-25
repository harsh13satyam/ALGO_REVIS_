require('dotenv').config();
const { connectDB } = require('../config/db');
const User = require('../models/User');
const DeliveryRecord = require('../models/DeliveryRecord');
const { broadcastConfirmationEmail, PRODUCTION_CLIENT_URL } = require('../services/emailService');

const buildBroadcastHTML = (userName, email) => {
  const compilerUrl = `${process.env.CLIENT_URL || PRODUCTION_CLIENT_URL}?view=daily_challenge`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlgoRevis Email Delivery Confirmed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 36px 24px; text-align: center; color: #ffffff; }
    .badge { display: inline-block; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; padding: 6px 16px; font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; }
    .content { padding: 32px 24px; }
    .feature-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
    .feature-title { font-weight: 700; color: #0f172a; margin-bottom: 4px; font-size: 15px; }
    .feature-desc { font-size: 14px; color: #475569; margin: 0; line-height: 1.5; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; text-align: center; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">🚀 System Notice • Brevo Integration Live</div>
      <h1>Email Delivery & Streaks Confirmed!</h1>
      <p style="margin: 8px 0 0; opacity: 0.95; font-size: 14px;">Hi ${userName}, your AlgoRevis notifications are fully active.</p>
    </div>

    <div class="content">
      <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-top: 0;">
        This test message confirms that our email engine is officially delivering streak updates and daily challenges directly to your inbox (<strong>${email}</strong>).
      </p>

      <div class="feature-box">
        <div class="feature-title">📅 1. Morning Daily Release (09:00 AM)</div>
        <p class="feature-desc">You'll receive 2 curated algorithmic problems each morning: 1 Revision problem from your past solved library + 1 AI-generated variation.</p>
      </div>

      <div class="feature-box">
        <div class="feature-title">⚡ 2. Evening Streak Protection Alert (07:00 PM)</div>
        <p class="feature-desc">If today's problems are still pending in the evening, you will receive an alert to remind you before midnight so your streak remains unbroken.</p>
      </div>

      <div class="feature-box">
        <div class="feature-title">💻 3. Direct In-Browser Compiler Access</div>
        <p class="feature-desc">All email action buttons now take you straight to the AlgoRevis website and live compiler—no localhost redirects.</p>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${compilerUrl}" class="btn" target="_blank">Open AlgoRevis Live Compiler</a>
      </div>
    </div>

    <div class="footer">
      <p>AlgoRevis — The Disciplined Curator for Algorithmic Mastery.</p>
      <p>Recipient: ${email} • Sent via Brevo HTTPS Delivery</p>
    </div>
  </div>
</body>
</html>
  `;
};

async function broadcastToAllRegisteredUsers() {
  await connectDB();

  console.log('Fetching registered users from MongoDB...');
  const usersInDb = await User.find({}).lean();

  // Deduplicate and filter out dummy example.com test accounts
  const emailMap = new Map();

  for (const u of usersInDb) {
    const email = (u.email || '').toLowerCase().trim();
    if (!email || email.endsWith('@example.com')) continue;
    if (!emailMap.has(email)) {
      emailMap.set(email, {
        _id: u._id,
        name: u.name || 'AlgoRevis Coder',
        email
      });
    }
  }

  // Ensure harshsatyam236@gmail.com is also included so user receives on both accounts
  if (!emailMap.has('harshsatyam236@gmail.com')) {
    emailMap.set('harshsatyam236@gmail.com', {
      _id: null,
      name: 'Harsh Satyam',
      email: 'harshsatyam236@gmail.com'
    });
  }

  const recipients = Array.from(emailMap.values());
  console.log(`Found ${recipients.length} real email recipient(s) to notify:`);
  recipients.forEach((r, idx) => console.log(`  ${idx + 1}. ${r.name} <${r.email}>`));

  console.log('\n--- Starting Brevo Broadcast ---');
  const results = [];

  for (const user of recipients) {
    const subject = `🔥 [AlgoRevis] Live Email Delivery & Streak Reminders Activated!`;
    const htmlContent = buildBroadcastHTML(user.name, user.email);

    console.log(`Sending to ${user.name} <${user.email}>...`);
    try {
      const res = await broadcastConfirmationEmail(user, subject, htmlContent);
      console.log(`  -> Status: ${res.status}, Provider: ${res.provider}, MessageId: ${res.messageId}`);
      results.push({ email: user.email, success: res.success, status: res.status, messageId: res.messageId });
    } catch (err) {
      console.error(`  -> Failed for ${user.email}:`, err.message);
      results.push({ email: user.email, success: false, error: err.message });
    }
    // Small 300ms pause between sends
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n--- Broadcast Complete ---');
  console.log(`Total sent: ${results.filter(r => r.success).length}/${results.length}`);
  process.exit(0);
}

broadcastToAllRegisteredUsers();
