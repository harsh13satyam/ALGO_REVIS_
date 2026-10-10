require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB } = require('../config/db');

async function runHttpTests() {
  console.log('\n--- Running HTTP Route End-to-End Tests ---');

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise(r => setTimeout(r, 200));
  }

  // Start temporary test server on port 5999
  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(5999, resolve));
  const baseUrl = 'http://localhost:5999';

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthData = await healthRes.json();
    console.log(`[Health Route] Status: ${healthRes.status}, Health: ${healthData.status}`);
    if (healthRes.status !== 200 || healthData.status !== 'healthy') {
      throw new Error('Health check failed');
    }

    // 2. Unauthenticated request to protected route
    const unauthRes = await fetch(`${baseUrl}/api/problems`);
    console.log(`[Auth Protection] Unauthenticated /api/problems status: ${unauthRes.status}`);
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 but got ${unauthRes.status}`);
    }

    // 3. Register Initiate via HTTP (Real verification flow)
    const initEmail = `init_test_${Date.now()}@example.com`;
    const initPhone = `+1202${Math.floor(1000000 + Math.random() * 9000000)}`;
    const initRes = await fetch(`${baseUrl}/api/auth/register-initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Register Initiate Tester',
        email: initEmail,
        phone: initPhone,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const initData = await initRes.json();
    console.log(`[Auth Register Initiate] Status: ${initRes.status}, Token: ${!!initData.registrationToken}`);
    if (initRes.status !== 200 || !initData.registrationToken) {
      throw new Error('Register initiate HTTP test failed');
    }

    // 4. Signup via HTTP
    const email = `http_test_${Date.now()}@example.com`;
    const phone = `+1202${Math.floor(1000000 + Math.random() * 9000000)}`;
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'HTTP Tester',
        email,
        phone,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const signupData = await signupRes.json();
    console.log(`[Auth Signup] Status: ${signupRes.status}, Message: ${signupData.message}`);
    if (signupRes.status !== 201) throw new Error('Signup failed');

    // Extract cookie or token
    const token = signupData.token;

    // 4. Authenticated request with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    console.log(`[Auth Me] Status: ${meRes.status}, User: ${meData.user?.name}`);
    if (meRes.status !== 200 || meData.user?.email !== email) throw new Error('Auth me check failed');

    // 5. Create problem via HTTP
    const createProblemRes = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Binary Search Variant',
        pattern: 'Binary Search',
        difficulty: 'Easy',
        notes: 'Classic binary search with boundary check.'
      })
    });
    const createData = await createProblemRes.json();
    console.log(`[Problems Create] Status: ${createProblemRes.status}, Problem: ${createData.problem?.name}`);
    if (createProblemRes.status !== 201) throw new Error('Problem creation failed');

    // 6. Today's Challenge via HTTP
    const challengeRes = await fetch(`${baseUrl}/api/challenges/today`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const challengeData = await challengeRes.json();
    console.log(`[Challenges Today] Status: ${challengeRes.status}, Q1: "${challengeData.questionA?.name}", Q2: "${challengeData.questionB?.title}"`);
    if (challengeRes.status !== 200) throw new Error('Fetch challenge failed');

    // 7. Simulate Delivery via HTTP
    const simRes = await fetch(`${baseUrl}/api/challenges/simulate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const simData = await simRes.json();
    console.log(`[Challenges Simulate] Status: ${simRes.status}, Delivery: Email=${simData.deliveryResults?.email?.status}, WA=${simData.deliveryResults?.whatsapp?.status}`);
    if (simRes.status !== 200) throw new Error('Simulate challenge failed');

    // 8. WhatsApp Webhook Verification via HTTP
    const waVerifyRes = await fetch(`${baseUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=algorevis_wa_verify_token&hub.challenge=test_challenge_12345`);
    const waChallengeText = await waVerifyRes.text();
    console.log(`[WhatsApp Webhook Verify] Status: ${waVerifyRes.status}, Response: ${waChallengeText}`);
    if (waVerifyRes.status !== 200 || waChallengeText !== 'test_challenge_12345') {
      throw new Error('WhatsApp webhook verification failed');
    }

    // Cleanup
    const User = require('../models/User');
    const Problem = require('../models/Problem');
    const DailyChallenge = require('../models/DailyChallenge');
    await User.deleteOne({ email });
    await Problem.deleteMany({ userName: 'HTTP Tester' });
    await DailyChallenge.deleteMany({ user: meData.user?._id });

    console.log('\n✔ ALL HTTP ROUTE TESTS PASSED!\n');
  } finally {
    testServer.close();
    process.exit(0);
  }
}

runHttpTests().catch(err => {
  console.error('HTTP Test Failure:', err);
  process.exit(1);
});
