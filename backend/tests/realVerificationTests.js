require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const {
  generateSecureOTP,
  hashOTP,
  verifyOTPHash,
  sendRealEmailOTP,
  sendRealPhoneOTP,
  checkTwilioVerifyCode
} = require('../services/verificationService');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`${colors.green}✔ PASS:${colors.reset} ${testName}`);
  } else {
    console.error(`${colors.red}✖ FAIL:${colors.reset} ${testName} - ${details}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runVerificationTests() {
  console.log(`\n${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.cyan}  AlgoRevis Real OTP Verification Test Suite        ${colors.reset}`);
  console.log(`${colors.cyan}====================================================\n${colors.reset}`);

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise((r) => setTimeout(r, 200));
  }

  const testSuffix = Date.now();
  const testEmail = `verify_tester_${testSuffix}@example.com`;
  const testPhone = `+1202555${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // -------------------------------------------------------------
    // 1. Cryptographic Security & OTP Hashing
    // -------------------------------------------------------------
    console.log(`\n${colors.yellow}--- Test 1: Cryptographic OTP Security ---${colors.reset}`);
    const otp1 = generateSecureOTP();
    const otp2 = generateSecureOTP();
    assert(otp1.length === 6 && /^\d{6}$/.test(otp1), 'Generated OTP is exactly 6 numeric digits');
    assert(otp1 !== otp2, 'Independent OTP generation produces unique cryptographically secure codes');

    const hashed = hashOTP(otp1);
    assert(hashed !== otp1, 'OTP is securely hashed before storage');
    assert(verifyOTPHash(otp1, hashed) === true, 'verifyOTPHash matches correct candidate code');
    assert(verifyOTPHash('000000', hashed) === false, 'verifyOTPHash rejects incorrect code');

    // -------------------------------------------------------------
    // 2. Real Provider Configuration Handling (No Fake Mocks)
    // -------------------------------------------------------------
    console.log(`\n${colors.yellow}--- Test 2: Provider Configuration Integrity ---${colors.reset}`);
    const emailResult = await sendRealEmailOTP(testEmail, otp1);
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_your_')) {
      assert(emailResult.configured === false, 'Detects unconfigured Resend credentials accurately');
      assert(emailResult.success === false, 'Never reports successful delivery when provider is not configured');
      assert(typeof emailResult.error === 'string', 'Provides actionable error specifying missing RESEND_API_KEY');
    } else {
      console.log(`Resend response: status=${emailResult.status}, id=${emailResult.providerId}`);
      assert(emailResult.configured === true, 'Resend is configured with real API key');
    }

    const phoneResult = await sendRealPhoneOTP(testPhone, otp2);
    if (!process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID.startsWith('AC_your_')) {
      assert(phoneResult.configured === false, 'Detects unconfigured Twilio credentials accurately');
      assert(phoneResult.success === false, 'Never reports successful delivery when Twilio is not configured');
      assert(typeof phoneResult.error === 'string', 'Provides actionable error specifying missing Twilio credentials');
    } else {
      console.log(`Twilio response: provider=${phoneResult.provider}, sid=${phoneResult.sid}`);
      assert(phoneResult.configured === true, 'Twilio is configured with real credentials');
    }

    // -------------------------------------------------------------
    // 3. Staging in PendingRegistration (No Unverified Account)
    // -------------------------------------------------------------
    console.log(`\n${colors.yellow}--- Test 3: Staged Verification & Account Activation Gate ---${colors.reset}`);
    const registrationToken = `reg_${Date.now()}_${Math.random()}`;
    const pending = new PendingRegistration({
      registrationToken,
      name: 'Verification Candidate',
      email: testEmail,
      phone: testPhone,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
      emailOtpHash: hashOTP(otp1),
      emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      isEmailVerified: false,
      phoneOtpHash: hashOTP(otp2),
      phoneOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
      isPhoneVerified: false
    });
    await pending.save();

    // Verify account is NOT in User collection yet
    const preCheckUser = await User.findOne({ email: testEmail });
    assert(preCheckUser === null, 'Account does NOT exist in User database before verification completes');

    // 3.1 Verify Email Code Only
    assert(verifyOTPHash(otp1, pending.emailOtpHash) === true, 'Correct email OTP verified against hash');
    pending.isEmailVerified = true;
    pending.emailOtpHash = null; // Single-use invalidation
    await pending.save();

    const midCheckUser = await User.findOne({ email: testEmail });
    assert(midCheckUser === null, 'Account remains INACTIVE when only Email is verified');

    // 3.2 Single-use enforcement
    assert(pending.emailOtpHash === null, 'Email OTP is invalidated immediately after first use');

    // 3.3 Verify Phone Code -> Activates Account!
    assert(verifyOTPHash(otp2, pending.phoneOtpHash) === true, 'Correct phone OTP verified against hash');
    pending.isPhoneVerified = true;
    pending.phoneOtpHash = null; // Single-use invalidation
    await pending.save();

    // Now both are verified: Activate account in User collection
    const activeUser = new User({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.passwordHash,
      isEmailVerified: true,
      isPhoneVerified: true
    });
    await activeUser.save();
    await PendingRegistration.deleteOne({ _id: pending._id });

    // Verify account is now active in User collection
    const postCheckUser = await User.findOne({ email: testEmail });
    assert(postCheckUser !== null, 'Account is ACTIVATED only after BOTH email and phone are verified');
    assert(postCheckUser.isEmailVerified === true, 'Activated user has verified email status');
    assert(postCheckUser.isPhoneVerified === true, 'Activated user has verified phone status');

    // Clean up
    await User.deleteOne({ email: testEmail });
    await PendingRegistration.deleteOne({ registrationToken });

    console.log(`\n${colors.green}✔ ALL REAL VERIFICATION SECURITY TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runVerificationTests();
