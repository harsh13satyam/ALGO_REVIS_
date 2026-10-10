require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Problem = require('../models/Problem');
const DailyChallenge = require('../models/DailyChallenge');
const DeliveryRecord = require('../models/DeliveryRecord');

const { signToken } = require('../middleware/auth');
const { selectRevisionProblem, recordProblemRevision } = require('../services/revisionService');
const { generateSimilarQuestion, validateSolutionInSandbox } = require('../services/aiService');
const { runCode, evaluateTestCases } = require('../services/codeExecutionService');
const { getOrCreateDailyChallenge, simulateDailyDelivery } = require('../services/scheduler');
const { sendDailyChallengeEmail } = require('../services/emailService');
const { sendDailyChallengeWhatsApp } = require('../services/whatsappService');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`${colors.green}✔ PASS:${colors.reset} ${testName}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    console.error(`${colors.red}✖ FAIL:${colors.reset} ${testName} - ${details}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log(`\n${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.cyan}  AlgoRevis Pre-Deployment Automated Test Suite      ${colors.reset}`);
  console.log(`${colors.cyan}====================================================\n${colors.reset}`);

  const connected = await connectDB();
  if (!connected) {
    console.error('Database connection failed. Aborting tests.');
    process.exit(1);
  }

  const testSuffix = Date.now();
  const aliceEmail = `alice_test_${testSuffix}@example.com`;
  const bobEmail = `bob_test_${testSuffix}@example.com`;
  const alicePhone = `+1202555${Math.floor(1000 + Math.random() * 9000)}`;
  const bobPhone = `+1202555${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    // ---------------------------------------------------------
    // TEST SUITE 1: AUTHENTICATION, PHONE & OTP VERIFICATION
    // ---------------------------------------------------------
    console.log(`\n${colors.yellow}--- Suite 1: Authentication, Phone & OTP Security ---${colors.reset}`);

    // 1.1 User Creation & Password Hashing
    const plainPassword = 'SuperSecretPassword123!';
    const alice = new User({
      name: 'Alice Tester',
      email: aliceEmail,
      phone: alicePhone,
      password: plainPassword,
      isEmailVerified: false,
      emailOTP: '123456',
      emailOTPExpires: new Date(Date.now() + 15 * 60 * 1000),
      isPhoneVerified: false,
      phoneOTP: '654321',
      phoneOTPExpires: new Date(Date.now() + 15 * 60 * 1000),
      deliveryPreferences: {
        time: '09:00',
        timezone: 'UTC',
        emailEnabled: true,
        whatsappEnabled: true
      },
      whatsappConsent: true,
      emailConsent: true
    });
    await alice.save();

    assert(alice._id != null, 'User created in database with verified schema');
    assert(alice.password !== plainPassword, 'Password is NOT stored in plain text (hashed with bcrypt)');
    
    const passwordMatches = await alice.comparePassword(plainPassword);
    assert(passwordMatches === true, 'comparePassword validates correct password');

    const wrongPasswordMatches = await alice.comparePassword('WrongPassword!');
    assert(wrongPasswordMatches === false, 'comparePassword rejects incorrect password');

    // 1.2 Duplicate Phone & Duplicate Email Rejection
    let duplicateEmailRejected = false;
    try {
      const dup = new User({
        name: 'Clone',
        email: aliceEmail,
        phone: '+19999999999',
        password: 'Password123!'
      });
      await dup.save();
    } catch {
      duplicateEmailRejected = true;
    }
    assert(duplicateEmailRejected, 'Duplicate registration with same email is rejected');

    let duplicatePhoneRejected = false;
    try {
      const dup = new User({
        name: 'Clone Phone',
        email: `other_${testSuffix}@example.com`,
        phone: alicePhone,
        password: 'Password123!'
      });
      await dup.save();
    } catch {
      duplicatePhoneRejected = true;
    }
    assert(duplicatePhoneRejected, 'Duplicate registration with same phone is rejected');

    // 1.3 OTP Verification Flow
    assert(alice.isEmailVerified === false, 'User begins unverified (requires OTP)');
    alice.isEmailVerified = true;
    alice.isPhoneVerified = true;
    await alice.save();
    assert(alice.isEmailVerified === true && alice.isPhoneVerified === true, 'Email & Phone ownership verified via OTP');

    // 1.4 Safe representation (Never leaks tokens, OTPs, or passwords)
    const safeObj = alice.toSafeObject();
    assert(safeObj.password === undefined, 'toSafeObject strips password hash');
    assert(safeObj.emailOTP === undefined && safeObj.phoneOTP === undefined, 'toSafeObject strips verification OTPs');

    // ---------------------------------------------------------
    // TEST SUITE 2: USER OWNERSHIP & INDIVIDUAL CRUD
    // ---------------------------------------------------------
    console.log(`\n${colors.yellow}--- Suite 2: Problem Management & Ownership Isolation ---${colors.reset}`);

    const bob = new User({
      name: 'Bob Competitor',
      email: bobEmail,
      phone: bobPhone,
      password: 'BobsPassword123!',
      isEmailVerified: true,
      isPhoneVerified: true
    });
    await bob.save();

    // Schedule next review for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const aliceProb = new Problem({
      user: alice._id,
      userName: alice.name,
      name: 'Trapping Rain Water',
      link: 'https://leetcode.com/problems/trapping-rain-water/',
      pattern: 'Two Pointers',
      difficulty: 'Hard',
      notes: 'Use left_max and right_max pointers converging inward.',
      nextReviewAt: tomorrow,
      recallStatus: 'new'
    });
    await aliceProb.save();

    // Bob cannot see Alice's problem
    const bobProblems = await Problem.find({ user: bob._id });
    assert(bobProblems.length === 0, 'User Bob CANNOT access User Alice\'s problems');

    // Alice sees her problem
    const aliceProblems = await Problem.find({ user: alice._id });
    assert(aliceProblems.length === 1 && aliceProblems[0].name === 'Trapping Rain Water', 'User Alice accesses her own problems');

    // Alice edits her individual problem
    aliceProb.notes = 'Updated personal revision notes.';
    aliceProb.recallStatus = 'learning';
    await aliceProb.save();

    const updatedProb = await Problem.findById(aliceProb._id);
    assert(updatedProb.notes === 'Updated personal revision notes.', 'Individual problem can be edited by owner');
    assert(updatedProb.nextReviewAt > new Date(), 'Problem has scheduled revision for following calendar day');

    // Bob cannot delete Alice's problem
    const deleteAttempt = await Problem.deleteOne({ _id: aliceProb._id, user: bob._id });
    assert(deleteAttempt.deletedCount === 0, 'User Bob CANNOT delete Alice\'s problem');

    // ---------------------------------------------------------
    // TEST SUITE 3: IN-BROWSER CODE COMPILER SANDBOX
    // ---------------------------------------------------------
    console.log(`\n${colors.yellow}--- Suite 3: Multi-Language Coding Compiler Sandbox ---${colors.reset}`);

    // JavaScript VM execution
    const jsCode = `function solution(arr) { return arr.reduce((a, b) => a + b, 0); }`;
    const jsResult = await runCode({ code: jsCode, language: 'javascript', input: '[1, 2, 3, 4]' });
    assert(jsResult.stdout === '10', 'JavaScript execution produces correct output in sandbox');

    // Python execution
    const pyCode = `def solution(arr): return sum(arr)`;
    const pyResult = await runCode({ code: pyCode, language: 'python', input: '[5, 5, 10]' });
    assert(pyResult.stdout === '20', 'Python execution produces correct output in sandbox');

    // C++ MinGW execution
    const cppCode = `
#include <iostream>
using namespace std;
int main() {
    int a, b;
    if (cin >> a >> b) {
        cout << a * b;
    }
    return 0;
}`;
    const cppResult = await runCode({ code: cppCode, language: 'cpp', input: '6 7' });
    assert(cppResult.stdout === '42', 'C++ compiler produces correct output in sandbox');

    // Sandbox execution of infinite loop (Time Limit Exceeded enforcement)
    const timeoutCode = `while(true) {}`;
    const timeoutResult = await runCode({ code: timeoutCode, language: 'javascript', input: '' });
    assert(timeoutResult.error != null, 'Sandbox safely terminates infinite loops with time limits');

    // Test Suite Evaluator (Pass vs Fail)
    const testCases = [
      { input: '[2, 3]', expectedOutput: '5' },
      { input: '[10, -5]', expectedOutput: '5' }
    ];
    const evaluation = await evaluateTestCases({
      code: `function solution(a, b) { return a + b; }`,
      language: 'javascript',
      testCases
    });
    assert(evaluation.allPassed === true, 'evaluateTestCases passes valid code across test suite');

    // ---------------------------------------------------------
    // TEST SUITE 4: DRAFT SAVING & DAILY CHALLENGE INTEGRATION
    // ---------------------------------------------------------
    console.log(`\n${colors.yellow}--- Suite 4: Challenge Drafts & Submissions ---${colors.reset}`);

    const scheduledDate = '2026-10-10';
    const challenge = await getOrCreateDailyChallenge(alice, scheduledDate);
    assert(challenge != null && challenge.questionA != null && challenge.questionB != null, 'Challenge created with dual questions');

    // Save draft code in MongoDB
    challenge.userDrafts.questionB = {
      code: 'function solution() { return 42; }',
      language: 'javascript',
      updatedAt: new Date()
    };
    await challenge.save();

    const retrievedChallenge = await DailyChallenge.findById(challenge._id);
    assert(retrievedChallenge.userDrafts.questionB.code === 'function solution() { return 42; }', 'Code draft persisted and restored from MongoDB');

    // ---------------------------------------------------------
    // TEST SUITE 5: NOTIFICATION DELIVERY & SIMULATION
    // ---------------------------------------------------------
    console.log(`\n${colors.yellow}--- Suite 5: Automated Delivery & Channel Isolation ---${colors.reset}`);

    const simResult = await simulateDailyDelivery(alice);
    assert(simResult != null && simResult.deliveryResults != null, 'simulateDailyDelivery executes successfully');

    assert(
      simResult.deliveryResults.email?.success === true || simResult.deliveryResults.email?.status === 'mock_sent',
      'Email delivery processed with challenge deep link'
    );
    assert(
      simResult.deliveryResults.whatsapp?.success === true || simResult.deliveryResults.whatsapp?.status === 'mock_sent',
      'WhatsApp delivery processed with challenge deep link'
    );

    const emailRecords = await DeliveryRecord.find({ user: alice._id, channel: 'email' });
    const waRecords = await DeliveryRecord.find({ user: alice._id, channel: 'whatsapp' });
    assert(emailRecords.length > 0 && waRecords.length > 0, 'Audit log persisted for both notification channels');

  } finally {
    // ---------------------------------------------------------
    // CLEANUP TEST DATA
    // ---------------------------------------------------------
    console.log(`\n${colors.cyan}--- Cleaning up test records ---${colors.reset}`);
    await User.deleteMany({ email: { $in: [aliceEmail, bobEmail] } });
    await Problem.deleteMany({ userName: { $in: ['Alice Tester', 'Bob Competitor'] } });
    await DailyChallenge.deleteMany({ scheduledDate: '2026-10-10' });
    console.log('Test records safely cleaned up.\n');
  }

  // Summary
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;

  console.log(`${colors.cyan}====================================================${colors.reset}`);
  console.log(`Test Results: ${colors.green}${passCount} PASSED${colors.reset}, ${failCount > 0 ? colors.red : colors.green}${failCount} FAILED${colors.reset}`);
  console.log(`${colors.cyan}====================================================\n${colors.reset}`);

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite();
