const DeliveryRecord = require('../models/DeliveryRecord');

/**
 * Generates responsive HTML email template for daily challenge & streak reminder
 */
const buildChallengeEmailHTML = ({ userName, scheduledDate, questionA, questionB, clientUrl, challengeId }) => {
  const challengeUrl = `${clientUrl || 'http://localhost:5173'}?view=daily_challenge&challengeId=${challengeId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your AlgoRevis Daily Challenge</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff; }
    .streak-badge { display: inline-block; background: rgba(255,255,255,0.22); border: 1px solid rgba(255,255,255,0.35); border-radius: 9999px; padding: 6px 16px; font-size: 13px; font-weight: 700; margin-bottom: 12px; letter-spacing: 0.3px; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 10px 0 0; opacity: 0.95; font-size: 14px; line-height: 1.5; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-revision { background: #e0e7ff; color: #4338ca; }
    .badge-ai { background: #ecfdf5; color: #047857; }
    .badge-difficulty { background: #fef3c7; color: #b45309; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .card-title { margin: 12px 0 6px; font-size: 18px; font-weight: 700; color: #0f172a; }
    .card-meta { font-size: 13px; color: #64748b; margin-bottom: 12px; }
    .card-text { font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; }
    .footer { text-align: center; padding: 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="streak-badge">🔥 Protect Your Daily Revision Streak</div>
      <h1>AlgoRevis Daily Challenge</h1>
      <p>📅 ${scheduledDate} • Hi ${userName}, complete your 2 questions today to keep your streak burning!</p>
    </div>

    <div class="content">
      <!-- Question A: Revision -->
      <div class="card">
        <span class="badge badge-revision">Question A • Revision</span>
        <span class="badge badge-difficulty">${questionA.difficulty}</span>
        <h2 class="card-title">${questionA.name}</h2>
        <div class="card-meta">Pattern: <strong>${questionA.pattern}</strong></div>
        <p class="card-text">${questionA.notes ? questionA.notes.slice(0, 160) + '...' : 'Previously solved problem scheduled for active recall.'}</p>
        <a href="${challengeUrl}&q=A" class="btn" target="_blank">Open in AlgoRevis</a>
      </div>

      <!-- Question B: AI Similar Question -->
      <div class="card">
        <span class="badge badge-ai">Question B • AI Generated</span>
        <span class="badge badge-difficulty">${questionB.difficulty}</span>
        <h2 class="card-title">${questionB.title}</h2>
        <div class="card-meta">Pattern: <strong>${questionB.pattern}</strong></div>
        <p class="card-text">${questionB.statement ? questionB.statement.slice(0, 180) + '...' : 'Generated problem designed to test your mastery of this algorithmic pattern.'}</p>
        <a href="${challengeUrl}&q=B" class="btn" target="_blank">Open Code Compiler</a>
      </div>

      <div style="text-align: center; margin-top: 32px;">
        <a href="${challengeUrl}" class="btn" style="background: #0f172a; padding: 14px 28px; font-size: 15px;">Solve Today's Challenge & Maintain Streak</a>
      </div>
    </div>

    <div class="footer">
      <p>AlgoRevis — The Disciplined Curator for Algorithmic Mastery.</p>
      <p>You received this because daily streak email delivery is enabled in your account preferences.</p>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Sends Daily Challenge & Streak email via Brevo HTTPS REST API (Primary)
 * with Resend API and Mock fallbacks.
 */
const sendDailyChallengeEmail = async (user, challenge) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  // 1. Consent, verification & preference checks
  if (!user.isEmailVerified && process.env.NODE_ENV === 'production') {
    return { skipped: true, reason: 'Email ownership has not been verified' };
  }
  if (!user.emailConsent || !user.deliveryPreferences?.emailEnabled) {
    return { skipped: true, reason: 'Email delivery disabled in user preferences' };
  }

  // 2. Stop sending if challenge already completed
  if (challenge.questionA?.completed && challenge.questionB?.completed) {
    return { skipped: true, reason: 'Daily challenge already completed by user' };
  }

  const recipient = user.email;
  const subject = `🔥 [AlgoRevis] Daily Streak Challenge (${challenge.scheduledDate}): ${challenge.questionA.name} & ${challenge.questionB.title}`;
  const html = buildChallengeEmailHTML({
    userName: user.name,
    scheduledDate: challenge.scheduledDate,
    questionA: challenge.questionA,
    questionB: challenge.questionB,
    clientUrl,
    challengeId: challenge._id
  });

  // Test mode mock bypass
  if (process.env.NODE_ENV === 'test') {
    console.log(`📧 [Email Mock - Test Env] Daily streak challenge ready for ${recipient}`);
    const record = new DeliveryRecord({
      user: user._id,
      challenge: challenge._id,
      channel: 'email',
      recipient,
      status: 'mock_sent',
      subjectOrSummary: subject,
      metadata: { mock: true, questionA: challenge.questionA.name, questionB: challenge.questionB.title }
    });
    await record.save();
    return { success: true, status: 'mock_sent', messageId: `mock-email-${Date.now()}` };
  }

  // 3. Primary: Brevo HTTPS REST API (Port 443 - zero cloud firewall block, sends to ANY email)
  const rawBrevoKey = process.env.BREVO_API_KEY || '';
  const brevoApiKey = rawBrevoKey.trim().replace(/^["']|["']$/g, '');
  if (brevoApiKey && !brevoApiKey.startsWith('xkeysib-your_') && brevoApiKey.length > 20) {
    const rawSender = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'harshsatyamsingh@gmail.com';
    const senderEmail = rawSender.trim().replace(/^["']|["']$/g, '');
    const senderName = process.env.BREVO_SENDER_NAME || 'AlgoRevis';

    try {
      console.log(`📧 [AlgoRevis Brevo] Dispatching streak challenge email to ${recipient} (Sender: ${senderName} <${senderEmail}>)...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: recipient, name: user.name || 'AlgoRevis Solver' }],
          subject,
          htmlContent: html
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.messageId) {
        console.log(`✅ [AlgoRevis Brevo] Streak challenge email sent to ${recipient} (MsgID: ${data.messageId})`);
        const record = new DeliveryRecord({
          user: user._id,
          challenge: challenge._id,
          channel: 'email',
          recipient,
          status: 'sent',
          subjectOrSummary: subject,
          providerMessageId: data.messageId,
          metadata: { provider: 'brevo', ...data }
        });
        await record.save();
        return { success: true, status: 'sent', provider: 'brevo', messageId: data.messageId };
      } else {
        console.warn('⚠️ [AlgoRevis Brevo] Brevo API returned error status:', res.status, JSON.stringify(data));
      }
    } catch (brevoErr) {
      console.warn('⚠️ [AlgoRevis Brevo] Request exception:', brevoErr.message);
    }
  }

  // 4. Fallback: Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('re_your_') && resendApiKey.length > 10) {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'AlgoRevis <onboarding@resend.dev>';
    try {
      console.log(`📧 [AlgoRevis Resend] Fallback dispatch to ${recipient}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [recipient],
          subject,
          html
        })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.id) {
        console.log(`✅ [AlgoRevis Resend] Streak challenge email sent to ${recipient} (ID: ${data.id})`);
        const record = new DeliveryRecord({
          user: user._id,
          challenge: challenge._id,
          channel: 'email',
          recipient,
          status: 'sent',
          subjectOrSummary: subject,
          providerMessageId: data.id,
          metadata: { provider: 'resend', ...data }
        });
        await record.save();
        return { success: true, status: 'sent', provider: 'resend', messageId: data.id };
      } else {
        console.warn('⚠️ [AlgoRevis Resend] Resend API error:', JSON.stringify(data));
      }
    } catch (resendErr) {
      console.warn('⚠️ [AlgoRevis Resend] Request exception:', resendErr.message);
    }
  }

  // 5. Fallback: Mock delivery if no active provider succeeded
  console.log(`📧 [Email Fallback] Saving mock delivery record for ${recipient}`);
  const record = new DeliveryRecord({
    user: user._id,
    challenge: challenge._id,
    channel: 'email',
    recipient,
    status: 'mock_sent',
    subjectOrSummary: subject,
    metadata: { mock: true, note: 'No active email provider succeeded' }
  });
  await record.save();

  return { success: true, status: 'mock_sent', messageId: `mock-email-${Date.now()}` };
};

module.exports = {
  sendDailyChallengeEmail,
  buildChallengeEmailHTML
};

