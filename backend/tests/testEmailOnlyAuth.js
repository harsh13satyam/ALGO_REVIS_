require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const PendingRegistration = require('../models/PendingRegistration');
const { verifyOTPHash } = require('../services/verificationService');

async function testEmailOnlyOTP() {
  await connectDB();

  const testEmail = `test_otp_${Date.now()}@gmail.com`;
  console.log(`Testing Email-Only Registration for: ${testEmail}`);

  // Clean previous
  await User.deleteMany({ email: testEmail });
  await PendingRegistration.deleteMany({ email: testEmail });

  // 1. Simulate registration initiate request
  const testOtp = '654321';
  const crypto = require('crypto');
  const salt = await require('bcryptjs').genSalt(10);
  const passwordHash = await require('bcryptjs').hash('Password123!', salt);
  const registrationToken = crypto.randomBytes(32).toString('hex');

  const pending = new PendingRegistration({
    registrationToken,
    name: 'Email Tester',
    email: testEmail,
    phone: null,
    passwordHash,
    emailOtpHash: crypto.createHash('sha256').update(testOtp).digest('hex'),
    emailOtpExpires: new Date(Date.now() + 10 * 60 * 1000),
    isEmailVerified: false,
    isPhoneVerified: true
  });
  await pending.save();
  console.log('✔ Staged in PendingRegistration (phone is null)');

  // 2. Simulate verify-email-code
  const found = await PendingRegistration.findOne({ registrationToken });
  if (!found) throw new Error('Pending registration not found');

  const valid = verifyOTPHash(testOtp, found.emailOtpHash);
  if (!valid) throw new Error('OTP hash mismatch');
  console.log('✔ Correct OTP validated against hash');

  // Activate
  const newUser = new User({
    name: found.name,
    email: found.email,
    password: found.passwordHash,
    isEmailVerified: true,
    isPhoneVerified: false,
    emailConsent: true
  });
  await newUser.save();
  await PendingRegistration.deleteOne({ _id: found._id });
  console.log('✔ User activated in MongoDB without phone number');

  const activated = await User.findOne({ email: testEmail });
  if (!activated) throw new Error('User not found in database');
  console.log('✔ Activated user isEmailVerified =', activated.isEmailVerified);
  console.log('✔ Activated user phone =', activated.phone);

  // Clean up
  await User.deleteOne({ _id: activated._id });
  console.log('✔ Cleaned up test record');
  console.log('\n🎉 ALL EMAIL-ONLY OTP TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
}

testEmailOnlyOTP().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
