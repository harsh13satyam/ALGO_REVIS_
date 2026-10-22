const express = require('express');
const router = express.Router();
const { getDBStatus } = require('../config/db');

router.get('/', (req, res) => {
  const dbStatus = getDBStatus();
  const isHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    services: {
      scheduler: 'active',
      gemini: !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith('your_'),
      email: (!!process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('xkeysib-your_')) ||
             (!!process.env.EMAIL_USER && !process.env.EMAIL_USER.includes('your_gmail')) ||
             (!!process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_your_')),
      emailProvider: (process.env.BREVO_API_KEY && !process.env.BREVO_API_KEY.startsWith('xkeysib-your_')) ? 'brevo_https' : (process.env.EMAIL_USER ? 'gmail_smtp' : 'mock'),
      whatsapp: !!process.env.WHATSAPP_PHONE_NUMBER_ID && !process.env.WHATSAPP_PHONE_NUMBER_ID.startsWith('your_')
    }
  });
});

router.get('/test-email', async (req, res) => {
  const targetEmail = req.query.to || 'harshsatyamsingh@gmail.com';
  const brevoApiKey = (process.env.BREVO_API_KEY || '').trim().replace(/^["']|["']$/g, '');
  const senderEmail = (process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'harshsatyamsingh@gmail.com').trim().replace(/^["']|["']$/g, '');
  const senderName = process.env.BREVO_SENDER_NAME || 'AlgoRevis';

  try {
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: targetEmail.trim() }],
        subject: 'AlgoRevis Live Debug OTP: 999111',
        htmlContent: '<p>Debug test OTP: <b>999111</b></p>'
      })
    });

    const data = await brevoRes.json().catch(() => ({}));
    return res.status(brevoRes.status).json({
      ok: brevoRes.ok,
      status: brevoRes.status,
      data,
      debug: {
        targetEmail,
        senderEmail,
        keyPrefix: brevoApiKey ? brevoApiKey.substring(0, 15) : 'NONE',
        keyLength: brevoApiKey ? brevoApiKey.length : 0
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
