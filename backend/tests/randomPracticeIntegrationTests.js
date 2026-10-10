require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Problem = require('../models/Problem');
const DailyChallenge = require('../models/DailyChallenge');
const PracticeAttempt = require('../models/PracticeAttempt');
const AIGeneratedQuestion = require('../models/AIGeneratedQuestion');

async function runRandomPracticeTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING RANDOM PRACTICE & AI WORKSPACE INTEGRATION TESTS');
  console.log('======================================================');

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise(r => setTimeout(r, 200));
  }

  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(5998, resolve));
  const baseUrl = 'http://localhost:5998';

  try {
    // 1. Create two isolated test users
    const user1Email = `practice_user1_${Date.now()}@example.com`;
    const user2Email = `practice_user2_${Date.now()}@example.com`;

    const user1Res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Practice User 1',
        email: user1Email,
        phone: `+1202${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const user1Data = await user1Res.json();
    const token1 = user1Data.token;

    const user2Res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Practice User 2',
        email: user2Email,
        phone: `+1202${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password123!',
        confirmPassword: 'Password123!'
      })
    });
    const user2Data = await user2Res.json();
    const token2 = user2Data.token;

    console.log('✅ [Auth] Test users created successfully.');

    // 2. Save multiple problems in different folders for User 1
    const p1 = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Two Sum Target',
        link: 'https://leetcode.com/problems/two-sum/',
        pattern: 'Hash Map',
        difficulty: 'Easy',
        notes: 'Use map for complement',
        description: 'Find two numbers that add up to target.'
      })
    });
    const p1Data = await p1.json();

    const p2 = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Longest K Distinct Substring',
        link: 'https://leetcode.com/problems/longest-substring-with-at-most-k-distinct-characters/',
        pattern: 'Sliding Window',
        difficulty: 'Medium',
        notes: 'Sliding window with frequency counter',
        description: 'Find longest substring with at most k distinct characters.'
      })
    });
    const p2Data = await p2.json();

    const p3 = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        name: 'Minimum in Rotated Array',
        link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
        pattern: 'Binary Search',
        difficulty: 'Medium',
        notes: 'Compare mid with right pointer',
        description: 'Find min element in rotated sorted array.'
      })
    });
    const p3Data = await p3.json();

    // User 2 saves a private problem
    const pUser2 = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
      body: JSON.stringify({
        name: 'User 2 Secret Binary Tree Problem',
        link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
        pattern: 'Trees',
        difficulty: 'Hard',
        notes: 'Post order DFS',
        description: 'Confidential problem for user 2.'
      })
    });
    const pUser2Data = await pUser2.json();

    console.log('✅ [Problems] Saved 3 questions for User 1 across different folders, 1 question for User 2.');

    // 3. Test Random Question selection for User 1
    const randRes = await fetch(`${baseUrl}/api/challenges/random`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const randData = await randRes.json();

    if (randRes.status !== 200 || !randData.challenge || !randData.challenge.questionA) {
      throw new Error(`Random question retrieval failed: ${JSON.stringify(randData)}`);
    }

    console.log(`✅ [Random Question] Selected: "${randData.challenge.questionA.name}" (Pattern: ${randData.challenge.questionA.pattern})`);
    if (randData.challenge.questionA.name === 'User 2 Secret Binary Tree Problem') {
      throw new Error('Data breach: User 1 received User 2 private problem!');
    }

    const firstSelectedId = randData.challenge.questionA.problemId;

    // 4. Test Non-Repeating Selection with excludeId
    const randExcludeRes = await fetch(`${baseUrl}/api/challenges/random?excludeId=${firstSelectedId}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const randExcludeData = await randExcludeRes.json();
    console.log(`✅ [Non-Repeating] Selected different question: "${randExcludeData.challenge.questionA.name}"`);
    if (randExcludeData.challenge.questionA.problemId === firstSelectedId && randData.totalSaved > 1) {
      throw new Error('Non-repeating logic failed: returned excluded problem when alternatives exist');
    }

    // 5. Test Folder Filtering
    const folderRes = await fetch(`${baseUrl}/api/challenges/random?folder=Sliding%20Window`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const folderData = await folderRes.json();
    console.log(`✅ [Folder Filter] Filtered to "Sliding Window", got: "${folderData.challenge.questionA.name}"`);
    if (folderData.challenge.questionA.pattern !== 'Sliding Window') {
      throw new Error(`Folder filter mismatch: expected Sliding Window, got ${folderData.challenge.questionA.pattern}`);
    }

    // 6. Test AI Similar Question Generation
    const challengeId = randData.challenge._id;
    const aiGenRes = await fetch(`${baseUrl}/api/challenges/generate-similar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        challengeId,
        sourceQuestionId: randData.challenge.questionA.problemId
      })
    });
    const aiGenData = await aiGenRes.json();

    if (aiGenRes.status !== 200 || !aiGenData.challenge?.questionB?.title) {
      throw new Error(`AI generation failed: ${JSON.stringify(aiGenData)}`);
    }

    console.log(`✅ [AI Question Generated] Title: "${aiGenData.challenge.questionB.title}" (Difficulty: ${aiGenData.challenge.questionB.difficulty})`);
    console.log(`   - Constraints: ${aiGenData.challenge.questionB.constraints.length} item(s)`);
    console.log(`   - Examples: ${aiGenData.challenge.questionB.examples.length} item(s)`);
    console.log(`   - Test Cases: ${aiGenData.challenge.questionB.testCases.length} item(s)`);

    // Verify stored in AIGeneratedQuestion collection
    const storedAiRecord = await AIGeneratedQuestion.findOne({ user: user1Data.user._id, title: aiGenData.challenge.questionB.title });
    if (!storedAiRecord) {
      throw new Error('AI generated question was not persisted in AIGeneratedQuestion model');
    }
    console.log('✅ [Persistence] Validated that AI question is saved in MongoDB AIGeneratedQuestion collection.');

    // 7. Test Sandbox Code Execution (Run Code)
    const runRes = await fetch(`${baseUrl}/api/challenges/run-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        code: `function solution(arr, k) { return 42; }`,
        language: 'javascript',
        customInput: '[[1, 2, 3], 2]'
      })
    });
    const runData = await runRes.json();
    console.log(`✅ [Run Code] Output: "${runData.stdout}", ExecutionTime: ${runData.executionTimeMs}ms`);
    if (runData.stdout !== '42') {
      throw new Error(`Run Code output mismatch, expected 42, got ${runData.stdout}`);
    }

    // 8. Test Submit Solution for Question B (with working reference solution)
    const workingCode = aiGenData.challenge.questionB.referenceSolution;
    const submitRes = await fetch(`${baseUrl}/api/challenges/submit-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token1}` },
      body: JSON.stringify({
        challengeId,
        questionType: 'B',
        code: workingCode,
        language: 'javascript'
      })
    });
    const submitData = await submitRes.json();
    console.log(`✅ [Submit Solution Q-B] AllPassed: ${submitData.allPassed}, PassedCount: ${submitData.passedCount}/${submitData.totalCount}`);
    if (!submitData.allPassed) {
      throw new Error(`Submission failed for validated reference solution: ${JSON.stringify(submitData)}`);
    }

    // Verify PracticeAttempt was recorded in database
    const attemptRecord = await PracticeAttempt.findOne({ challengeId, questionType: 'B' });
    if (!attemptRecord || attemptRecord.submissionStatus !== 'passed') {
      throw new Error('PracticeAttempt record was not saved accurately in MongoDB');
    }
    console.log(`✅ [Practice Attempt Logged] Source: ${attemptRecord.questionSource}, Title: "${attemptRecord.questionTitle}", Status: ${attemptRecord.submissionStatus}`);

    // 9. Test Practice History Endpoint
    const historyRes = await fetch(`${baseUrl}/api/challenges/practice-history`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const historyData = await historyRes.json();
    console.log(`✅ [Practice History] Retrieved ${historyData.attempts.length} attempt(s) and ${historyData.completedChallenges.length} completed challenge(s).`);
    if (historyData.attempts.length === 0) {
      throw new Error('Practice history did not return recorded attempts');
    }

    // 10. Security & Ownership verification: User 2 cannot submit against User 1's challenge
    const unauthorizedSubmit = await fetch(`${baseUrl}/api/challenges/submit-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token2}` },
      body: JSON.stringify({
        challengeId,
        questionType: 'B',
        code: workingCode,
        language: 'javascript'
      })
    });
    console.log(`✅ [Security & Ownership] User 2 unauthorized submit status: ${unauthorizedSubmit.status}`);
    if (unauthorizedSubmit.status !== 404 && unauthorizedSubmit.status !== 403) {
      throw new Error(`Security vulnerability: User 2 received status ${unauthorizedSubmit.status} on User 1 challenge`);
    }

    // Clean up test data
    await User.deleteMany({ email: { $in: [user1Email, user2Email] } });
    await Problem.deleteMany({ user: { $in: [user1Data.user._id, user2Data.user._id] } });
    await DailyChallenge.deleteMany({ user: { $in: [user1Data.user._id, user2Data.user._id] } });
    await PracticeAttempt.deleteMany({ user: { $in: [user1Data.user._id, user2Data.user._id] } });
    await AIGeneratedQuestion.deleteMany({ user: { $in: [user1Data.user._id, user2Data.user._id] } });

    console.log('\n======================================================');
    console.log('🎉 ALL RANDOM PRACTICE & AI WORKSPACE TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    testServer.close();
  }
}

runRandomPracticeTests()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  });
