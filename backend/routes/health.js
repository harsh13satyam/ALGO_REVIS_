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
      whatsapp: !!process.env.WHATSAPP_PHONE_NUMBER_ID && !process.env.WHATSAPP_PHONE_NUMBER_ID.startsWith('your_')
    }
  });
});

module.exports = router;
