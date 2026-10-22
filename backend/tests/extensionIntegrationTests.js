/**
 * Automated End-to-End Integration Tests for AlgoRevis Chrome Extension & Backend
 */
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');
const { app } = require('../server');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Problem = require('../models/Problem');

// Import platform adapters
const { extractLeetCodeData } = require('../../algorevis-extension/scripts/adapters/leetcode');
const { extractGeeksforGeeksData } = require('../../algorevis-extension/scripts/adapters/geeksforgeeks');
const { extractCodeforcesData } = require('../../algorevis-extension/scripts/adapters/codeforces');

// Helper to simulate browser DOM environment
function setupMockDOM(config) {
  global.window = {
    location: {
      href: config.href || 'https://leetcode.com',
      pathname: config.pathname || '/',
      hostname: config.hostname || 'leetcode.com'
    }
  };

  global.document = {
    title: config.title || '',
    querySelector: (selector) => config.selectors?.[selector] || null,
    querySelectorAll: (selector) => config.allSelectors?.[selector] || []
  };
}

async function runExtensionTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING ALGOREVIS EXTENSION INTEGRATION TESTS');
  console.log('======================================================\n');

  // --------------------------------------------------------------------------
  // PART 1: TEST PLATFORM ADAPTERS
  // --------------------------------------------------------------------------
  console.log('--- Testing Platform Adapters ---');

  // Test 1: LeetCode Adapter
  setupMockDOM({
    href: 'https://leetcode.com/problems/two-sum/description/',
    pathname: '/problems/two-sum/description/',
    hostname: 'leetcode.com',
    title: 'Two Sum - LeetCode',
    selectors: {
      'div[data-cy="question-title"]': { textContent: '1. Two Sum' },
      'div[class*="text-olive"]': { textContent: 'Easy' },
      'button[id*="headlessui-listbox-button"]': { textContent: 'Python3' }
    },
    allSelectors: {
      '.monaco-editor .view-lines .view-line': [
        { textContent: 'class Solution:' },
        { textContent: '    def twoSum(self, nums: List[int], target: int) -> List[int]:' },
        { textContent: '        seen = {}' },
        { textContent: '        for i, n in enumerate(nums):' },
        { textContent: '            diff = target - n' },
        { textContent: '            if diff in seen: return [seen[diff], i]' },
        { textContent: '            seen[n] = i' }
      ]
    }
  });

  const lcData = extractLeetCodeData();
  console.log(`[LeetCode Adapter] Platform: ${lcData.platform}, Title: "${lcData.problemTitle}", Diff: ${lcData.difficulty}, Lang: ${lcData.language}, CodeLines: ${lcData.code.split('\n').length}`);
  if (
    !lcData.isSupported ||
    lcData.platform !== 'LeetCode' ||
    lcData.problemTitle !== '1. Two Sum' ||
    lcData.difficulty !== 'Easy' ||
    lcData.language !== 'Python3' ||
    !lcData.code.includes('def twoSum') ||
    lcData.problemUrl !== 'https://leetcode.com/problems/two-sum/'
  ) {
    throw new Error('LeetCode adapter test failed!');
  }
  console.log('✅ LeetCode adapter passed');

  // Test 2: GeeksforGeeks Adapter
  setupMockDOM({
    href: 'https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1',
    pathname: '/problems/kadanes-algorithm-1587115620/1',
    hostname: 'geeksforgeeks.org',
    title: 'Kadane\'s Algorithm | Practice | GeeksforGeeks',
    selectors: {
      'h3.problem-tab__title': { textContent: 'Kadane\'s Algorithm' },
      '.problem-tab__difficulty': { textContent: 'Medium' },
      '.header-language': { textContent: 'C++' }
    },
    allSelectors: {
      '.ace_editor .ace_line': [
        { textContent: 'long long maxSubarraySum(int arr[], int n) {' },
        { textContent: '    long long max_so_far = arr[0], curr_max = arr[0];' },
        { textContent: '    for (int i = 1; i < n; i++) {' },
        { textContent: '        curr_max = max((long long)arr[i], curr_max + arr[i]);' },
        { textContent: '        max_so_far = max(max_so_far, curr_max);' },
        { textContent: '    }' },
        { textContent: '    return max_so_far;' },
        { textContent: '}' }
      ]
    }
  });

  const gfgData = extractGeeksforGeeksData();
  console.log(`[GFG Adapter] Platform: ${gfgData.platform}, Title: "${gfgData.problemTitle}", Diff: ${gfgData.difficulty}, Lang: ${gfgData.language}, CodeLines: ${gfgData.code.split('\n').length}`);
  if (
    !gfgData.isSupported ||
    gfgData.platform !== 'GeeksforGeeks' ||
    gfgData.problemTitle !== 'Kadane\'s Algorithm' ||
    gfgData.difficulty !== 'Medium' ||
    !gfgData.code.includes('maxSubarraySum')
  ) {
    throw new Error('GeeksforGeeks adapter test failed!');
  }
  console.log('✅ GeeksforGeeks adapter passed');

  // Test 3: Codeforces Adapter
  setupMockDOM({
    href: 'https://codeforces.com/problemset/problem/4/A',
    pathname: '/problemset/problem/4/A',
    hostname: 'codeforces.com',
    title: 'Problem - 4A - Codeforces',
    selectors: {
      '.problem-statement .header .title': { textContent: 'A. Watermelon' },
      'span[title="Difficulty"]': { textContent: '*800' },
      'textarea[name="source"]': { value: '#include <iostream>\nusing namespace std;\nint main() { int w; cin >> w; if (w > 2 && w % 2 == 0) cout << "YES"; else cout << "NO"; }' }
    }
  });

  const cfData = extractCodeforcesData();
  console.log(`[Codeforces Adapter] Platform: ${cfData.platform}, Title: "${cfData.problemTitle}", Diff: ${cfData.difficulty}, Id: ${cfData.problemId}`);
  if (
    !cfData.isSupported ||
    cfData.platform !== 'Codeforces' ||
    cfData.problemTitle !== 'Watermelon' ||
    cfData.problemId !== '4A' ||
    cfData.difficulty !== 'Easy' ||
    !cfData.code.includes('main()')
  ) {
    throw new Error('Codeforces adapter test failed!');
  }
  console.log('✅ Codeforces adapter passed');

  // Test 4: Unsupported Page
  setupMockDOM({
    href: 'https://github.com/trending',
    pathname: '/trending',
    hostname: 'github.com',
    title: 'Trending repositories on GitHub'
  });
  const unsuppData = extractLeetCodeData();
  if (unsuppData.isSupported) {
    throw new Error('Expected unsupported for non-problem page');
  }
  console.log('✅ Unsupported platform detection passed');

  // --------------------------------------------------------------------------
  // PART 2: TEST BACKEND API & PERSISTENCE
  // --------------------------------------------------------------------------
  console.log('\n--- Testing Extension Backend HTTP Routes ---');

  await connectDB();
  while (mongoose.connection.readyState !== 1) {
    await new Promise(r => setTimeout(r, 200));
  }

  // Temporary test server
  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(5998, resolve));
  const baseUrl = 'http://localhost:5998';

  const testEmail1 = `ext_user1_${Date.now()}@example.com`;
  const testEmail2 = `ext_user2_${Date.now()}@example.com`;
  let token1 = null;
  let token2 = null;
  let user1 = null;
  let savedProblemId = null;

  try {
    // 1. Create User 1 via signup
    const signupRes1 = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Extension Tester One',
        email: testEmail1,
        password: 'Password123!'
      })
    });
    const signupData1 = await signupRes1.json();
    if (signupRes1.status !== 201 || !signupData1.token) {
      throw new Error('User 1 signup failed: ' + JSON.stringify(signupData1));
    }
    token1 = signupData1.token;
    user1 = signupData1.user;
    console.log(`✅ [Auth Signup] User 1 created: ${user1.name}`);

    // 2. Create User 2 for ownership & data isolation testing
    const signupRes2 = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Extension Tester Two',
        email: testEmail2,
        password: 'Password123!'
      })
    });
    const signupData2 = await signupRes2.json();
    token2 = signupData2.token;
    console.log('✅ [Auth Signup] User 2 created for security tests');

    // 3. Test /api/auth/login with extension credentials
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail1,
        password: 'Password123!'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200 || !loginData.token) {
      throw new Error('Extension login failed: ' + JSON.stringify(loginData));
    }
    console.log('✅ [Extension Login] Successful login, returned Bearer token');

    // 4. Test /api/auth/me session verification with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const meData = await meRes.json();
    if (meRes.status !== 200 || meData.user?.email !== testEmail1) {
      throw new Error('/api/auth/me failed with Bearer token');
    }
    console.log(`✅ [Extension Session] /api/auth/me verified for "${meData.user.name}"`);

    // 5. Test Check endpoint BEFORE saving problem: should return exists: false
    const targetUrl = 'https://leetcode.com/problems/two-sum/';
    const checkBeforeRes = await fetch(`${baseUrl}/api/problems/check?url=${encodeURIComponent(targetUrl)}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const checkBeforeData = await checkBeforeRes.json();
    if (checkBeforeRes.status !== 200 || checkBeforeData.exists !== false) {
      throw new Error('Check endpoint expected exists: false before save');
    }
    console.log('✅ [Duplicate Check Before Save] Correctly returned exists: false');

    // 6. Save problem via extension POST /api/problems
    const saveRes = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Two Sum',
        link: targetUrl,
        difficulty: 'Easy',
        platform: 'LeetCode',
        problemId: 'two-sum',
        language: 'Python3',
        code: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        if target - n in seen: return [seen[target - n], i]\n        seen[n] = i',
        approach: 'Hash Map',
        intuition: 'Store each number and its index in a hash map for O(1) lookup of compliment.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
        notes: 'Pay attention to 0-indexing and duplicate elements.'
      })
    });
    const saveData = await saveRes.json();
    if (saveRes.status !== 201 || !saveData.problem?._id) {
      throw new Error('Problem save failed: ' + JSON.stringify(saveData));
    }
    savedProblemId = saveData.problem._id;
    console.log(`✅ [Problem Save] Saved Problem: "${saveData.problem.name}" (ID: ${savedProblemId})`);

    // Verify persisted fields in MongoDB
    const dbProblem = await Problem.findById(savedProblemId);
    if (
      !dbProblem ||
      dbProblem.platform !== 'LeetCode' ||
      dbProblem.language !== 'Python3' ||
      dbProblem.approach !== 'Hash Map' ||
      dbProblem.pattern !== 'Hash Map' ||
      dbProblem.timeComplexity !== 'O(n)' ||
      !dbProblem.code.includes('def twoSum')
    ) {
      throw new Error('Persisted problem fields mismatch in database!');
    }
    console.log('✅ [MongoDB Persistence] All extension-specific schema fields successfully verified in database');

    // 7. Test Check endpoint AFTER saving problem: should return exists: true
    const checkAfterRes = await fetch(`${baseUrl}/api/problems/check?url=${encodeURIComponent(targetUrl)}`, {
      headers: { 'Authorization': `Bearer ${token1}` }
    });
    const checkAfterData = await checkAfterRes.json();
    if (checkAfterRes.status !== 200 || checkAfterData.exists !== true || checkAfterData.problem?._id !== savedProblemId) {
      throw new Error('Check endpoint expected exists: true with problem ID');
    }
    console.log('✅ [Duplicate Check After Save] Correctly returned exists: true with problem record');

    // 8. Test Duplicate Prevention: Attempting to save same link without update flag should return 409
    const dupRes = await fetch(`${baseUrl}/api/problems`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Two Sum Duplicate',
        link: targetUrl,
        pattern: 'Hash Map'
      })
    });
    if (dupRes.status !== 409) {
      throw new Error(`Expected 409 Conflict on duplicate save, got ${dupRes.status}`);
    }
    console.log('✅ [Duplicate Prevention] Re-saving existing problem URL safely rejected with 409 Conflict');

    // 9. Test Update Problem via PUT & PATCH /api/problems/:id
    const patchRes = await fetch(`${baseUrl}/api/problems/${savedProblemId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token1}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timeComplexity: 'O(n) amortized',
        notes: 'Updated notes with memory optimization tips.'
      })
    });
    const patchData = await patchRes.json();
    if (patchRes.status !== 200 || patchData.problem?.timeComplexity !== 'O(n) amortized') {
      throw new Error('PATCH problem update failed');
    }
    console.log('✅ [Problem Update] Successfully updated problem using PATCH');

    // 10. Security & Ownership Check: User 2 must NOT be able to modify or delete User 1's problem
    const unauthorizedUpdateRes = await fetch(`${baseUrl}/api/problems/${savedProblemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token2}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Hacked Name' })
    });
    if (unauthorizedUpdateRes.status !== 404) {
      throw new Error(`Expected 404 unauthorized update for User 2, got ${unauthorizedUpdateRes.status}`);
    }

    const unauthorizedDeleteRes = await fetch(`${baseUrl}/api/problems/${savedProblemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token2}` }
    });
    if (unauthorizedDeleteRes.status !== 404) {
      throw new Error(`Expected 404 unauthorized delete for User 2, got ${unauthorizedDeleteRes.status}`);
    }
    console.log('✅ [Security & Data Isolation] User 2 denied access to User 1 problem (404 Unauthorized)');

    // 11. Cleanup
    await Problem.deleteMany({ user: { $in: [user1._id, signupData2.user?._id] } });
    await User.deleteMany({ email: { $in: [testEmail1, testEmail2] } });
    console.log('✅ [Cleanup] Test records purged from database');

    console.log('\n======================================================');
    console.log('🎉 ALL EXTENSION ADAPTER & API TESTS PASSED!');
    console.log('======================================================\n');
  } finally {
    testServer.close();
    process.exit(0);
  }
}

runExtensionTests().catch(err => {
  console.error('\n❌ Extension Test Failure:', err);
  process.exit(1);
});
