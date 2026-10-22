const crypto = require('crypto');
const nodemailer = require('nodemailer');
let twilioClient = null;

let gmailTransporter = null;

const getGmailTransporter = () => {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (
    !user ||
    !pass ||
    user.includes('your_gmail_address') ||
    pass.includes('your_16_char_app_password') ||
    pass.includes('your_app_password')
  ) {
    return null;
  }

  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.trim(),
        // Automatically strip whitespace if user copies 16-char app password with spaces (e.g. 'abcd efgh ijkl mnop')
        pass: pass.trim().replace(/\s+/g, '')
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 5000
    });
  }
  return gmailTransporter;
};

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
 * Sends a real verification email via Nodemailer (Gmail SMTP) or Resend fallback
 */
const sendRealEmailOTP = async (email, otp) => {
  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; padding: 12px; background: #eef2ff; border-radius: 12px; margin-bottom: 12px;">
          <span style="font-size: 28px;">⚡</span>
        </div>
        <h2 style="color: #3730a3; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">AlgoRevis</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px; font-weight: 500;">Account Verification</p>
      </div>
      <p style="color: #1e293b; font-size: 15px; line-height: 1.5;">Welcome to AlgoRevis! Use the verification code below to verify your email address:</p>
      <div style="background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%); padding: 22px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px dashed #c7d2fe;">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #312e81; font-family: 'Courier New', Courier, monospace;">${otp}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This code will expire in <strong style="color: #334155;">10 minutes</strong>. Never share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
      <p style="color: #94a3b8; font-size: 12px; text-align: center; line-height: 1.4;">If you did not request this verification code, you can safely ignore this email.</p>
    </div>
  `;

  // 1. Primary for Cloud: Brevo HTTPS REST API (Port 443 - never blocked by Render, sends to ANY email)
  const rawBrevoKey = process.env.BREVO_API_KEY || '';
  const brevoApiKey = rawBrevoKey.trim().replace(/^["']|["']$/g, '');
  if (brevoApiKey && !brevoApiKey.startsWith('xkeysib-your_') && brevoApiKey.length > 20) {
    const rawSender = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'harshsatyamsingh@gmail.com';
    const senderEmail = rawSender.trim().replace(/^["']|["']$/g, '');
    const senderName = process.env.BREVO_SENDER_NAME || 'AlgoRevis';
    try {
      console.log(`[AlgoRevis Brevo] Dispatching OTP email to ${email.trim()} via Brevo HTTPS API (Sender: ${senderEmail})...`);
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: email.trim() }],
          subject: `Your AlgoRevis Verification Code: ${otp}`,
          htmlContent: htmlContent
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.messageId) {
        console.log(`[AlgoRevis Brevo] Email OTP successfully sent to ${email} (MessageID: ${data.messageId})`);
        return {
          success: true,
          configured: true,
          provider: 'brevo_api',
          providerId: data.messageId,
          status: 'delivered'
        };
      } else {
        console.error('[AlgoRevis Brevo] Error response from Brevo API:', res.status, JSON.stringify(data));
      }
    } catch (brevoErr) {
      console.error('[AlgoRevis Brevo] Request exception:', brevoErr.message);
    }
  }

  // 2. Nodemailer with Gmail SMTP (fast timeout for cloud hosts)
  const transporter = getGmailTransporter();
  if (transporter) {
    try {
      const emailUser = process.env.EMAIL_USER || process.env.GMAIL_USER;
      const fromAddress = process.env.EMAIL_FROM || `AlgoRevis <${emailUser.trim()}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Your AlgoRevis Verification Code: ${otp}`,
        html: htmlContent
      });

      console.log(`[AlgoRevis Nodemailer] Email OTP successfully sent to ${email} (MessageID: ${info.messageId})`);
      return {
        success: true,
        configured: true,
        provider: 'gmail_smtp',
        providerId: info.messageId,
        status: 'delivered'
      };
    } catch (smtpErr) {
      console.warn('[AlgoRevis Nodemailer] SMTP Error (will attempt Resend API fallback):', smtpErr.message);
      // Fall through to Resend API fallback below instead of hanging or aborting
    }
  }

  // 2. Fallback: Resend API (if configured with custom verified domain)
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey && !resendApiKey.startsWith('re_your_')) {
    const fromEmail = process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'AlgoRevis <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `Your AlgoRevis Verification Code: ${otp}`,
          html: htmlContent
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data.message || `Resend error: ${res.statusText}`;
        console.warn('[AlgoRevis Resend] Warning:', errMsg);
        // Notice: If Resend fails because of unverified domain, log fallback
        console.log(`\n======================================================\n[AlgoRevis OTP Fallback] Verification code for ${email}: ${otp}\n(Add EMAIL_USER & EMAIL_PASS to backend/.env to send via Gmail to any email!)\n======================================================\n`);
        return {
          success: true,
          configured: false,
          devFallback: true,
          error: errMsg,
          provider: 'resend_sandbox_restricted'
        };
      }

      return {
        success: true,
        configured: true,
        provider: 'resend',
        providerId: data.id,
        status: 'delivered_to_provider'
      };
    } catch (resendErr) {
      console.error('[AlgoRevis Resend] Request failed:', resendErr.message);
    }
  }

  // 3. Fallback for Local Dev / Testing before entering credentials
  console.log(`\n======================================================\n[AlgoRevis OTP Dev] Verification code for ${email}: ${otp}\n(Set EMAIL_USER and EMAIL_PASS in backend/.env for real Gmail delivery)\n======================================================\n`);
  return {
    success: true,
    configured: false,
    devMode: true,
    message: 'OTP generated. Check server console or configure EMAIL_USER and EMAIL_PASS in backend/.env'
  };
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
