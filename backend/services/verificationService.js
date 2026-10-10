const crypto = require('crypto');
let twilioClient = null;

try {
  const twilio = require('twilio');
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
} catch (e) {
  console.warn('Twilio library not loaded:', e.message);
}

/**
 * Returns a cryptographically secure 6-digit numeric OTP
 */
const generateSecureOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

/**
 * Hashes an OTP using SHA-256 for secure database storage
 */
const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
};

/**
 * Verifies submitted candidate OTP against stored hash
 */
const verifyOTPHash = (candidateOTP, storedHash) => {
  if (!candidateOTP || !storedHash) return false;
  const candidateHash = hashOTP(candidateOTP);
  try {
    return crypto.timingSafeEqual(Buffer.from(candidateHash), Buffer.from(storedHash));
  } catch {
    return candidateHash === storedHash;
  }
};

/**
 * Sends a real verification email via Resend API
 */
const sendRealEmailOTP = async (email, otp) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'AlgoRevis <onboarding@resend.dev>';

  if (!apiKey || apiKey.startsWith('re_your_')) {
    return {
      success: false,
      configured: false,
      error: 'RESEND_API_KEY is not configured in backend/.env. Please configure your Resend API Key.'
    };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `Your AlgoRevis Verification Code: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #4338ca; margin: 0;">AlgoRevis</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Account Verification</p>
            </div>
            <p style="color: #1e293b; font-size: 15px;">Use the following code to verify your email address:</p>
            <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b; font-family: monospace;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 13px;">This code will expire in <strong>10 minutes</strong>. Never share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">If you did not request this code, you can safely ignore this email.</p>
          </div>
        `
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = data.message || `Resend HTTP error ${res.status}: ${res.statusText}`;
      return {
        success: false,
        configured: true,
        error: errMsg
      };
    }

    return {
      success: true,
      configured: true,
      providerId: data.id,
      status: 'delivered_to_provider'
    };
  } catch (err) {
    return {
      success: false,
      configured: true,
      error: `Network failure contacting Resend: ${err.message}`
    };
  }
};

/**
 * Sends a real SMS verification OTP via Twilio Verify or Twilio Programmable SMS
 */
const sendRealPhoneOTP = async (phone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || (!verifySid && !fromPhone) || accountSid.startsWith('AC_your_')) {
    return {
      success: false,
      configured: false,
      error: 'Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID or TWILIO_PHONE_NUMBER) are not configured in backend/.env.'
    };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    if (verifySid && !verifySid.startsWith('VA_your_')) {
      // 1. Preferred: Twilio Verify Service
      const verification = await client.verify.v2.services(verifySid).verifications.create({
        to: phone,
        channel: 'sms'
      });

      return {
        success: true,
        configured: true,
        provider: 'twilio_verify',
        sid: verification.sid,
        status: verification.status
      };
    } else {
      // 2. Programmable SMS using server-side OTP
      const message = await client.messages.create({
        body: `Your AlgoRevis verification code is ${otp}. Valid for 10 minutes.`,
        from: fromPhone,
        to: phone
      });

      return {
        success: true,
        configured: true,
        provider: 'twilio_sms',
        sid: message.sid,
        status: message.status
      };
    }
  } catch (err) {
    return {
      success: false,
      configured: true,
      error: `Twilio SMS error [${err.code || 'ERR'}]: ${err.message}`
    };
  }
};

/**
 * Validates phone OTP with Twilio Verify service if enabled
 */
const checkTwilioVerifyCode = async (phone, code) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const verifySid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !verifySid || verifySid.startsWith('VA_your_')) {
    return { isVerifyService: false };
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);
    const check = await client.verify.v2.services(verifySid).verificationChecks.create({
      to: phone,
      code: String(code).trim()
    });

    return {
      isVerifyService: true,
      valid: check.status === 'approved',
      status: check.status
    };
  } catch (err) {
    return {
      isVerifyService: true,
      valid: false,
      error: `Twilio verification check error: ${err.message}`
    };
  }
};

module.exports = {
  generateSecureOTP,
  hashOTP,
  verifyOTPHash,
  sendRealEmailOTP,
  sendRealPhoneOTP,
  checkTwilioVerifyCode
};
