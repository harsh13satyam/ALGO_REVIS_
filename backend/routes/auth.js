const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { requireAuth, signToken, setAuthCookie, clearAuthCookie } = require('../middleware/auth');
const rateLimiter = require('../middleware/rateLimiter');
const {
  generateSecureOTP,
  hashOTP,
  verifyOTPHash,
  sendRealEmailOTP,
  sendRealPhoneOTP,
  checkTwilioVerifyCode
} = require('../services/verificationService');

const authLimiter = rateLimiter({ windowMs: 60 * 1000, max: 20 });
const otpLimiter = rateLimiter({ windowMs: 5 * 60 * 1000, max: 10, message: 'Too many OTP requests. Please wait a few minutes.' });

/**
 * Activates a pending registration once email is verified (and phone if provided)
 */
const activatePendingRegistration = async (pending, res) => {
  const userPayload = {
    name: pending.name,
    email: pending.email,
    password: pending.passwordHash,
    isEmailVerified: true,
    isPhoneVerified: Boolean(pending.isPhoneVerified && pending.phone),
    emailConsent: true,
    whatsappConsent: false
  };

  if (pending.phone) {
    userPayload.phone = pending.phone;
  }

  const newUser = new User(userPayload);
  await newUser.save();
  await PendingRegistration.deleteOne({ _id: pending._id });

  const token = signToken(newUser);
  setAuthCookie(res, token);
  return { user: newUser, token };
};

// =========================================================================
// REAL PRE-REGISTRATION VERIFICATION WORKFLOW
// =========================================================================

/**
 * POST /api/auth/register-initiate
 * Validates fields, generates secure email OTP, dispatches real email
 * via Nodemailer (Gmail SMTP), and stages PendingRegistration.
 * Phone is completely optional.
 */
router.post('/register-initiate', authLimiter, async (req, res) => {
  try {
    let { name, email, phone, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (confirmPassword !== undefined && confirmPassword !== '' && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    email = email.trim().toLowerCase();
    name = name.trim();
    const cleanPhone = phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    if (cleanPhone && !/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Phone number must include country code in E.164 format (e.g. +919876543210 or +12025550123)' });
    }

    // 1. Check for existing active accounts
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'An active account with this email address already exists. Please login instead.' });
    }

    if (cleanPhone) {
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        return res.status(400).json({ message: 'An active account with this phone number already exists' });
      }
    }

    // 2. Hash password securely
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Generate independent secure OTP
    const emailOtp = generateSecureOTP();

    // 4. Send real Email OTP via Nodemailer / Gmail SMTP
    const emailResult = await sendRealEmailOTP(email, emailOtp);

    // 5. Send real SMS OTP only if phone is provided
    let phoneResult = { success: false, configured: false };
    let phoneOtp = null;
    if (cleanPhone) {
      phoneOtp = generateSecureOTP();
      phoneResult = await sendRealPhoneOTP(cleanPhone, phoneOtp);
    }

    // 6. Stage PendingRegistration in database
    const registrationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const deleteFilter = [{ email }];
    if (cleanPhone) deleteFilter.push({ phone: cleanPhone });
    await PendingRegistration.deleteMany({ $or: deleteFilter });

    const pending = new PendingRegistration({
      registrationToken,
      name,
      email,
      phone: cleanPhone || null,
      passwordHash,
      emailOtpHash: hashOTP(emailOtp),
      emailOtpExpires: expires,
      emailOtpAttempts: 0,
      emailOtpLastSentAt: new Date(),
      isEmailVerified: false,
      phoneVerificationSid: phoneResult.sid || null,
      phoneOtpHash: phoneOtp ? hashOTP(phoneOtp) : null,
      phoneOtpExpires: cleanPhone ? expires : null,
      phoneOtpAttempts: 0,
      phoneOtpLastSentAt: cleanPhone ? new Date() : null,
      isPhoneVerified: !cleanPhone
    });

    await pending.save();

    res.status(200).json({
      message: 'Verification code sent to your email address.',
      registrationToken,
      email,
      emailStatus: {
        sent: emailResult.success,
        configured: emailResult.configured,
        error: emailResult.error || null,
        recipient: email
      },
      phoneRequired: Boolean(cleanPhone),
      cooldownSeconds: 60
    });
  } catch (error) {
    console.error('Registration initiate error:', error);
    res.status(500).json({ message: 'Server error initiating verification: ' + error.message });
  }
});

/**
 * POST /api/auth/verify-email-code
 * Validates submitted email OTP. Activates user immediately in email-only mode!
 */
router.post('/verify-email-code', otpLimiter, async (req, res) => {
  try {
    const { registrationToken, code } = req.body;
    if (!registrationToken || !code) {
      return res.status(400).json({ message: 'Registration token and 6-digit code are required' });
    }

    const pending = await PendingRegistration.findOne({ registrationToken });
    if (!pending) {
      return res.status(404).json({ message: 'Verification session expired or invalid. Please start registration again.' });
    }

    if (pending.isEmailVerified) {
      return res.status(200).json({
        verified: true,
        isEmailVerified: true,
        isPhoneVerified: pending.isPhoneVerified,
        accountActivated: true,
        message: 'Email address is already verified'
      });
    }

    if (pending.emailOtpAttempts >= 5) {
      return res.status(400).json({ message: 'Maximum email verification attempts exceeded. Please request a new code.' });
    }

    if (!pending.emailOtpExpires || pending.emailOtpExpires < new Date()) {
      return res.status(400).json({ message: 'Email verification code has expired. Please request a new code.' });
    }

    pending.emailOtpAttempts += 1;

    const isValid = verifyOTPHash(code, pending.emailOtpHash);
    if (!isValid) {
      await pending.save();
      return res.status(400).json({ message: 'Invalid email verification code. Please check and try again.' });
    }

    pending.isEmailVerified = true;
    pending.emailOtpHash = null; // Invalidate single use
    await pending.save();

    // Check if phone is not required OR phone is already verified -> Activate Account!
    if (pending.isPhoneVerified || !pending.phone) {
      const { user, token } = await activatePendingRegistration(pending, res);
      return res.status(200).json({
        verified: true,
        isEmailVerified: true,
        isPhoneVerified: Boolean(pending.phone && pending.isPhoneVerified),
        accountActivated: true,
        message: 'Email verified successfully! Welcome to AlgoRevis.',
        user: user.toSafeObject(),
        name: user.name,
        token
      });
    }

    return res.status(200).json({
      verified: true,
      isEmailVerified: true,
      isPhoneVerified: false,
      accountActivated: false,
      message: 'Email address verified! Please verify your phone number to complete registration.'
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({ message: 'Server error verifying email code' });
  }
});

/**
 * POST /api/auth/verify-phone-code
 * Validates submitted SMS OTP with Twilio Verify or local hash.
 * Activates user if email is already verified.
 */
router.post('/verify-phone-code', otpLimiter, async (req, res) => {
  try {
    const { registrationToken, code } = req.body;
    if (!registrationToken || !code) {
      return res.status(400).json({ message: 'Registration token and 6-digit code are required' });
    }

    const pending = await PendingRegistration.findOne({ registrationToken });
    if (!pending) {
      return res.status(404).json({ message: 'Verification session expired or invalid. Please start registration again.' });
    }

    if (pending.isPhoneVerified) {
      return res.status(200).json({
        verified: true,
        isEmailVerified: pending.isEmailVerified,
        isPhoneVerified: true,
        accountActivated: false,
        message: 'Phone number is already verified'
      });
    }

    if (pending.phoneOtpAttempts >= 5) {
      return res.status(400).json({ message: 'Maximum phone verification attempts exceeded. Please request a new code.' });
    }

    pending.phoneOtpAttempts += 1;

    let isValid = false;

    // 1. If Twilio Verify was used
    const twilioCheck = await checkTwilioVerifyCode(pending.phone, code);
    if (twilioCheck.isVerifyService) {
      if (!twilioCheck.valid) {
        await pending.save();
        return res.status(400).json({ message: twilioCheck.error || 'Invalid phone verification code.' });
      }
      isValid = true;
    } else {
      // 2. Server-side hash check
      if (!pending.phoneOtpExpires || pending.phoneOtpExpires < new Date()) {
        return res.status(400).json({ message: 'Phone verification code has expired. Please request a new code.' });
      }
      isValid = verifyOTPHash(code, pending.phoneOtpHash);
      if (!isValid) {
        await pending.save();
        return res.status(400).json({ message: 'Invalid phone verification code. Please check and try again.' });
      }
    }

    pending.isPhoneVerified = true;
    pending.phoneOtpHash = null; // Invalidate single use
    await pending.save();

    // Check if both channels are verified -> Activate Account!
    if (pending.isEmailVerified) {
      const { user, token } = await activatePendingRegistration(pending, res);
      return res.status(200).json({
        verified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        accountActivated: true,
        message: 'Both channels verified! Account successfully activated.',
        user: user.toSafeObject(),
        token
      });
    }

    return res.status(200).json({
      verified: true,
      isEmailVerified: false,
      isPhoneVerified: true,
      accountActivated: false,
      message: 'Phone number verified! Please verify your email address to complete registration.'
    });
  } catch (error) {
    console.error('Verify phone code error:', error);
    res.status(500).json({ message: 'Server error verifying phone code' });
  }
});

/**
 * POST /api/auth/resend-email-code
 */
router.post('/resend-email-code', otpLimiter, async (req, res) => {
  try {
    const { registrationToken } = req.body;
    const pending = await PendingRegistration.findOne({ registrationToken });
    if (!pending) {
      return res.status(404).json({ message: 'Verification session expired. Please start registration again.' });
    }

    const now = Date.now();
    if (pending.emailOtpLastSentAt && (now - new Date(pending.emailOtpLastSentAt).getTime()) < 60000) {
      const remaining = Math.ceil((60000 - (now - new Date(pending.emailOtpLastSentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${remaining}s before requesting a new email code.` });
    }

    const newOtp = generateSecureOTP();
    const result = await sendRealEmailOTP(pending.email, newOtp);

    pending.emailOtpHash = hashOTP(newOtp);
    pending.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pending.emailOtpAttempts = 0;
    pending.emailOtpLastSentAt = new Date();
    await pending.save();

    res.status(200).json({
      sent: result.success,
      configured: result.configured,
      error: result.error || null,
      cooldownSeconds: 60
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resending email code' });
  }
});

/**
 * POST /api/auth/resend-phone-code
 */
router.post('/resend-phone-code', otpLimiter, async (req, res) => {
  try {
    const { registrationToken } = req.body;
    const pending = await PendingRegistration.findOne({ registrationToken });
    if (!pending) {
      return res.status(404).json({ message: 'Verification session expired. Please start registration again.' });
    }

    const now = Date.now();
    if (pending.phoneOtpLastSentAt && (now - new Date(pending.phoneOtpLastSentAt).getTime()) < 60000) {
      const remaining = Math.ceil((60000 - (now - new Date(pending.phoneOtpLastSentAt).getTime())) / 1000);
      return res.status(429).json({ message: `Please wait ${remaining}s before requesting a new SMS code.` });
    }

    const newOtp = generateSecureOTP();
    const result = await sendRealPhoneOTP(pending.phone, newOtp);

    pending.phoneVerificationSid = result.sid || null;
    pending.phoneOtpHash = hashOTP(newOtp);
    pending.phoneOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    pending.phoneOtpAttempts = 0;
    pending.phoneOtpLastSentAt = new Date();
    await pending.save();

    res.status(200).json({
      sent: result.success,
      configured: result.configured,
      error: result.error || null,
      cooldownSeconds: 60
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resending phone code' });
  }
});

// =========================================================================
// STANDARD AUTHENTICATION & LOGIN
// =========================================================================

// POST /api/auth/signup - Direct creation endpoint (simple registration without OTP)
router.post('/signup', authLimiter, async (req, res) => {
  try {
    let { name, email, phone, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters long' });
    }
    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (confirmPassword !== undefined && confirmPassword !== '' && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    email = email.trim().toLowerCase();
    name = name.trim();
    const cleanPhone = phone && typeof phone === 'string' && phone.trim() ? phone.trim() : null;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'An account with this email address already exists' });
    }

    if (cleanPhone) {
      const existingPhone = await User.findOne({ phone: cleanPhone });
      if (existingPhone) {
        return res.status(400).json({ message: 'An account with this phone number already exists' });
      }
    }

    const userPayload = {
      name,
      email,
      password,
      isEmailVerified: true,
      isPhoneVerified: true,
      emailConsent: true,
      whatsappConsent: false
    };

    if (cleanPhone) {
      userPayload.phone = cleanPhone;
    }

    const newUser = new User(userPayload);

    await newUser.save();

    const token = signToken(newUser);
    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully! Welcome to AlgoRevis.',
      user: newUser.toSafeObject(),
      name: newUser.name,
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration: ' + error.message });
  }
});

// POST /api/auth/login - Secure login with credential verification
router.post('/login', authLimiter, async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      const pending = await PendingRegistration.findOne({ email });
      if (pending) {
        return res.status(400).json({ message: 'Account not verified yet. Please enter the verification code sent to your email to activate it.' });
      }
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      message: 'Login successful',
      user: user.toSafeObject(),
      name: user.name,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/logout - Clear HTTP-only session cookie
router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - Verify active persistent session
router.get('/me', requireAuth, async (req, res) => {
  res.status(200).json({
    user: req.user.toSafeObject(),
    name: req.user.name
  });
});

// POST /api/auth/send-email-otp - Real email dispatch for active sessions
router.post('/send-email-otp', requireAuth, otpLimiter, async (req, res) => {
  try {
    const user = req.user;
    const otp = generateSecureOTP();
    user.emailOTP = hashOTP(otp);
    user.emailOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.otpLastRequestedAt = new Date();
    await user.save();

    const result = await sendRealEmailOTP(user.email, otp);
    if (!result.success) {
      return res.status(502).json({
        message: result.error || 'Failed to dispatch verification email via provider',
        configured: result.configured
      });
    }

    res.status(200).json({
      message: `Verification code sent to ${user.email}`,
      configured: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending email OTP: ' + error.message });
  }
});

// POST /api/auth/verify-email-otp - Verify Email OTP for active sessions
router.post('/verify-email-otp', requireAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Please provide the 6-digit verification code' });
    }

    if (!user.emailOTP || !user.emailOTPExpires || user.emailOTPExpires < new Date()) {
      return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
    }

    const isValid = verifyOTPHash(otp, user.emailOTP);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isEmailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Email address verified successfully!',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying email address' });
  }
});

// POST /api/auth/send-phone-otp - Real phone dispatch for active sessions
router.post('/send-phone-otp', requireAuth, otpLimiter, async (req, res) => {
  try {
    const user = req.user;
    const otp = generateSecureOTP();
    user.phoneOTP = hashOTP(otp);
    user.phoneOTPExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.otpLastRequestedAt = new Date();
    await user.save();

    const result = await sendRealPhoneOTP(user.phone, otp);
    if (!result.success) {
      return res.status(502).json({
        message: result.error || 'Failed to dispatch verification SMS via provider',
        configured: result.configured
      });
    }

    res.status(200).json({
      message: `Verification code sent to ${user.phone}`,
      configured: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Error sending phone OTP: ' + error.message });
  }
});

// POST /api/auth/verify-phone-otp - Verify Phone OTP for active sessions
router.post('/verify-phone-otp', requireAuth, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    if (!otp || typeof otp !== 'string') {
      return res.status(400).json({ message: 'Please provide the 6-digit verification code' });
    }

    let isValid = false;

    // Check with Twilio Verify first if active
    const twilioCheck = await checkTwilioVerifyCode(user.phone, otp);
    if (twilioCheck.isVerifyService) {
      isValid = twilioCheck.valid;
    } else {
      if (!user.phoneOTP || !user.phoneOTPExpires || user.phoneOTPExpires < new Date()) {
        return res.status(400).json({ message: 'Verification code has expired. Please request a new code.' });
      }
      isValid = verifyOTPHash(otp, user.phoneOTP);
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isPhoneVerified = true;
    user.phoneOTP = null;
    user.phoneOTPExpires = null;
    await user.save();

    res.status(200).json({
      message: 'Phone number verified successfully!',
      user: user.toSafeObject()
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying phone number' });
  }
});

// PUT /api/auth/preferences - Update notification & delivery preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const {
      deliveryPreferences,
      phone,
      whatsappConsent,
      emailConsent
    } = req.body;

    if (deliveryPreferences) {
      if (deliveryPreferences.time && /^([01]\d|2[0-3]):([0-5]\d)$/.test(deliveryPreferences.time)) {
        user.deliveryPreferences.time = deliveryPreferences.time;
      }
      if (deliveryPreferences.timezone && typeof deliveryPreferences.timezone === 'string') {
        user.deliveryPreferences.timezone = deliveryPreferences.timezone;
      }
      if (typeof deliveryPreferences.emailEnabled === 'boolean') {
        user.deliveryPreferences.emailEnabled = deliveryPreferences.emailEnabled;
      }
      if (typeof deliveryPreferences.whatsappEnabled === 'boolean') {
        user.deliveryPreferences.whatsappEnabled = deliveryPreferences.whatsappEnabled;
      }
    }

    if (typeof phone === 'string' && /^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      if (user.phone !== phone.trim()) {
        user.phone = phone.trim();
        user.isPhoneVerified = false;
      }
    }
    if (typeof whatsappConsent === 'boolean') {
      user.whatsappConsent = whatsappConsent;
    }
    if (typeof emailConsent === 'boolean') {
      user.emailConsent = emailConsent;
    }

    await user.save();

    res.status(200).json({
      message: 'Preferences updated successfully',
      user: user.toSafeObject()
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({ message: 'Server error updating preferences' });
  }
});

module.exports = router;
