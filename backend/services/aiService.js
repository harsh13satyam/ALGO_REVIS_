const vm = require('vm');

/**
 * Validates a JavaScript solution against test cases in an isolated VM sandbox
 */
const validateSolutionInSandbox = (solutionCode, testCases) => {
  if (!solutionCode || !testCases || testCases.length === 0) {
    return { passed: false, details: 'Missing solution code or test cases' };
  }

  try {
    const sandbox = {};
    const context = vm.createContext(sandbox);

    // Compile script
    const script = new vm.Script(solutionCode);
    script.runInContext(context, { timeout: 1000 });

    if (typeof sandbox.solution !== 'function') {
      return { passed: false, details: 'Exported function `solution` not found in reference code' };
    }

    // Run test cases
    for (let i = 0; i < testCases.length; i++) {
      const { input, expectedOutput } = testCases[i];
      let parsedArgs;
      try {
        parsedArgs = JSON.parse(input);
        if (!Array.isArray(parsedArgs)) parsedArgs = [parsedArgs];
      } catch {
        parsedArgs = [input];
      }

      const result = sandbox.solution.apply(null, parsedArgs);
      const strResult = JSON.stringify(result);
      const strExpected = expectedOutput ? expectedOutput.trim() : '';

      // Normalize comparison
      const normalizedResult = (strResult || '').replace(/\s+/g, '');
      const normalizedExpected = strExpected.replace(/\s+/g, '');

      if (normalizedResult !== normalizedExpected && String(result) !== strExpected) {
        return {
          passed: false,
          details: `Test case ${i + 1} failed: input ${input}, expected ${expectedOutput}, got ${result}`
        };
      }
    }

    return { passed: true, details: `All ${testCases.length} test cases passed in sandbox` };
  } catch (error) {
    return { passed: false, details: `Sandbox runtime error: ${error.message}` };
  }
};

/**
 * Rich, pre-validated algorithmic problem library categorized by semantic technique.
 * Guarantees that similar questions generated for "Two Sum" or other specific problems
 * are genuinely related to that algorithmic technique rather than a single hardcoded question.
 */
const CATEGORIZED_PROBLEMS = {
  TWO_SUM: [
    {
      title: 'Two Sum II - Target Pair (Sorted Variant)',
      pattern: 'Two Pointers & Hash Map',
      difficulty: 'Medium',
      statement: 'Given a 1-indexed array of integers numbers that is already sorted in non-decreasing order, find two numbers such that they add up to a specific target number. Return the indices of the two numbers [index1, index2] as an integer array of length 2 where 1 <= index1 < index2 <= numbers.length.',
      inputFormat: 'A sorted integer array numbers and an integer target.',
      outputFormat: 'An array of two 1-based indices [index1, index2].',
      constraints: [
        '2 <= numbers.length <= 3 * 10^4',
        '-1000 <= numbers[i] <= 1000',
        'numbers is sorted in non-decreasing order.',
        'Exactly one valid solution exists.'
      ],
      examples: [
        { input: 'numbers = [2,7,11,15], target = 9', output: '[1,2]', explanation: 'The sum of 2 and 7 is 9. Therefore index1 = 1, index2 = 2.' },
        { input: 'numbers = [2,3,4], target = 6', output: '[1,3]', explanation: 'The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3.' }
      ],
      starterCode: {
        javascript: 'function solution(numbers, target) {\n  // Write your code here\n  return [1, 2];\n}',
        python: 'def solution(numbers, target):\n    # Write your code here\n    return [1, 2]',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[2,7,11,15], 9]', expectedOutput: '[1,2]' },
        { input: '[[2,3,4], 6]', expectedOutput: '[1,3]' },
        { input: '[[-1,0], -1]', expectedOutput: '[1,2]' }
      ],
      hiddenTestCases: [
        { input: '[[0,0,3,4], 0]', expectedOutput: '[1,2]' }
      ],
      referenceSolution: `function solution(numbers, target) {
  let left = 0, right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
      explanation: 'Use two pointers initialized at the start and end of the sorted array. If the sum is less than target, move left pointer right; if greater, move right pointer left.'
    },
    {
      title: 'Subarray Sum Equals K (Hash Map Variant)',
      pattern: 'Hash Map & Prefix Sum',
      difficulty: 'Medium',
      statement: 'Given an array of integers nums and an integer k, return the total number of continuous subarrays whose sum equals to k.',
      inputFormat: 'An integer array nums and an integer target k.',
      outputFormat: 'An integer representing the count of valid subarrays.',
      constraints: [
        '1 <= nums.length <= 2 * 10^4',
        '-1000 <= nums[i] <= 1000',
        '-10^7 <= k <= 10^7'
      ],
      examples: [
        { input: 'nums = [1,1,1], k = 2', output: '2', explanation: 'Subarrays [nums[0], nums[1]] and [nums[1], nums[2]] sum to 2.' },
        { input: 'nums = [1,2,3], k = 3', output: '2', explanation: 'Subarrays [1,2] and [3] sum to 3.' }
      ],
      starterCode: {
        javascript: 'function solution(nums, k) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(nums, k):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[1,1,1], 2]', expectedOutput: '2' },
        { input: '[[1,2,3], 3]', expectedOutput: '2' },
        { input: '[[1,-1,0], 0]', expectedOutput: '3' }
      ],
      hiddenTestCases: [
        { input: '[[3,4,7,2,-3,1,4,2], 7]', expectedOutput: '4' }
      ],
      referenceSolution: `function solution(nums, k) {
  let count = 0, currentSum = 0;
  const prefixMap = new Map();
  prefixMap.set(0, 1);
  for (let i = 0; i < nums.length; i++) {
    currentSum += nums[i];
    if (prefixMap.has(currentSum - k)) {
      count += prefixMap.get(currentSum - k);
    }
    prefixMap.set(currentSum, (prefixMap.get(currentSum) || 0) + 1);
  }
  return count;
}`,
      explanation: 'Maintain a running prefix sum and count how many times (currentSum - k) has appeared using a hash map in O(N) time.'
    },
    {
      title: 'Target Pair Finder (Hash Map Variant)',
      pattern: 'Hash Map & Two Sum',
      difficulty: 'Easy',
      statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input has exactly one solution, and you may not use the same element twice.',
      inputFormat: 'An integer array nums and an integer target.',
      outputFormat: 'An array of two indices [i, j].',
      constraints: [
        '2 <= nums.length <= 10^4',
        '-10^9 <= nums[i] <= 10^9',
        'Exactly one valid answer exists.'
      ],
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9, so return [0, 1].' }
      ],
      starterCode: {
        javascript: 'function solution(nums, target) {\n  // Write your code here\n  return [];\n}',
        python: 'def solution(nums, target):\n    # Write your code here\n    return []',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[2,7,11,15], 9]', expectedOutput: '[0,1]' },
        { input: '[[3,2,4], 6]', expectedOutput: '[1,2]' },
        { input: '[[3,3], 6]', expectedOutput: '[0,1]' }
      ],
      hiddenTestCases: [
        { input: '[[1,5,8,3], 8]', expectedOutput: '[1,3]' }
      ],
      referenceSolution: `function solution(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      explanation: 'Use a hash map to look up the complement in O(1) time.'
    }
  ],

  SLIDING_WINDOW: [
    {
      title: 'Longest Substring with At Most K Distinct Characters',
      pattern: 'Sliding Window',
      difficulty: 'Medium',
      statement: 'Given a string s and an integer k, return the length of the longest substring of s that contains at most k distinct characters.',
      inputFormat: 'A string s and an integer k.',
      outputFormat: 'An integer representing the maximum length of a valid substring.',
      constraints: [
        '1 <= s.length <= 5 * 10^4',
        '0 <= k <= 50',
        's consists of lowercase English letters.'
      ],
      examples: [
        { input: 's = "eceba", k = 2', output: '3', explanation: 'The substring is "ece" with length 3.' },
        { input: 's = "aa", k = 1', output: '2', explanation: 'The substring is "aa" with length 2.' }
      ],
      starterCode: {
        javascript: 'function solution(s, k) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(s, k):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '["eceba", 2]', expectedOutput: '3' },
        { input: '["aa", 1]', expectedOutput: '2' },
        { input: '["a", 0]', expectedOutput: '0' }
      ],
      hiddenTestCases: [
        { input: '["abaccc", 2]', expectedOutput: '4' }
      ],
      referenceSolution: `function solution(s, k) {
  if (k === 0 || !s || s.length === 0) return 0;
  const map = new Map();
  let maxLen = 0, left = 0;
  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    map.set(char, (map.get(char) || 0) + 1);
    while (map.size > k) {
      const leftChar = s[left];
      map.set(leftChar, map.get(leftChar) - 1);
      if (map.get(leftChar) === 0) map.delete(leftChar);
      left++;
    }
    maxLen = Math.max(maxLen, right - left + 1);
  }
  return maxLen;
}`,
      explanation: 'Maintain a frequency map within a sliding window [left, right]. When the distinct keys exceed k, contract from the left.'
    },
    {
      title: 'Maximum Sum Subarray of Size K',
      pattern: 'Sliding Window',
      difficulty: 'Easy',
      statement: 'Given an array of integers nums and a positive integer k, find the maximum sum of any contiguous subarray of size exactly k.',
      inputFormat: 'An integer array nums and an integer k.',
      outputFormat: 'An integer representing the maximum sum.',
      constraints: [
        '1 <= k <= nums.length <= 10^5',
        '-10^4 <= nums[i] <= 10^4'
      ],
      examples: [
        { input: 'nums = [2,1,5,1,3,2], k = 3', output: '9', explanation: 'Subarray [5,1,3] has maximum sum 9.' }
      ],
      starterCode: {
        javascript: 'function solution(nums, k) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(nums, k):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[2,1,5,1,3,2], 3]', expectedOutput: '9' },
        { input: '[[2,3,4,1,5], 2]', expectedOutput: '7' }
      ],
      hiddenTestCases: [
        { input: '[[1,1,1,1], 2]', expectedOutput: '2' }
      ],
      referenceSolution: `function solution(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];
  let maxSum = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    maxSum = Math.max(maxSum, windowSum);
  }
  return maxSum;
}`,
      explanation: 'Compute sum of first window, then slide window by adding next element and subtracting outgoing element in O(N) time.'
    }
  ],

  TWO_POINTERS: [
    {
      title: 'Container With Most Water (Variant)',
      pattern: 'Two Pointers',
      difficulty: 'Medium',
      statement: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]). Find two lines that together with the x-axis form a container that holds the most water.',
      inputFormat: 'An array of non-negative integers height.',
      outputFormat: 'An integer representing the maximum area of water.',
      constraints: [
        'n == height.length',
        '2 <= n <= 10^5',
        '0 <= height[i] <= 10^4'
      ],
      examples: [
        { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'Lines at index 1 and 8 contain area = min(8, 7) * (8 - 1) = 49.' }
      ],
      starterCode: {
        javascript: 'function solution(height) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(height):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[1,8,6,2,5,4,8,3,7]]', expectedOutput: '49' },
        { input: '[[1,1]]', expectedOutput: '1' }
      ],
      hiddenTestCases: [
        { input: '[[4,3,2,1,4]]', expectedOutput: '16' }
      ],
      referenceSolution: `function solution(height) {
  let left = 0, right = height.length - 1;
  let maxArea = 0;
  while (left < right) {
    const width = right - left;
    const h = Math.min(height[left], height[right]);
    maxArea = Math.max(maxArea, width * h);
    if (height[left] < height[right]) left++;
    else right--;
  }
  return maxArea;
}`,
      explanation: 'Use two pointers from both ends. Move the pointer pointing to the shorter vertical bar inward.'
    }
  ],

  BINARY_SEARCH: [
    {
      title: 'Find Minimum in Rotated Sorted Array',
      pattern: 'Binary Search',
      difficulty: 'Medium',
      statement: 'Suppose an array of length n sorted in ascending order is rotated between 1 and n times. Find the minimum element of this array in O(log n) time.',
      inputFormat: 'An array of unique integers nums.',
      outputFormat: 'An integer representing the minimum element.',
      constraints: [
        'n == nums.length',
        '1 <= n <= 5000',
        '-5000 <= nums[i] <= 5000'
      ],
      examples: [
        { input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'The minimum element is 1.' }
      ],
      starterCode: {
        javascript: 'function solution(nums) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(nums):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[3,4,5,1,2]]', expectedOutput: '1' },
        { input: '[[4,5,6,7,0,1,2]]', expectedOutput: '0' },
        { input: '[[11,13,15,17]]', expectedOutput: '11' }
      ],
      hiddenTestCases: [
        { input: '[[2,1]]', expectedOutput: '1' }
      ],
      referenceSolution: `function solution(nums) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    let mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  return nums[left];
}`,
      explanation: 'Compare mid element with right element to determine which half contains the inflection point.'
    }
  ],

  DYNAMIC_PROGRAMMING: [
    {
      title: 'Maximum Subarray Sum with One Deletion',
      pattern: 'Dynamic Programming',
      difficulty: 'Medium',
      statement: 'Given an array of integers arr, return the maximum sum for a non-empty subarray with at most one element deletion.',
      inputFormat: 'An array of integers arr.',
      outputFormat: 'An integer representing maximum subarray sum.',
      constraints: [
        '1 <= arr.length <= 10^5',
        '-10^4 <= arr[i] <= 10^4'
      ],
      examples: [
        { input: 'arr = [1,-2,0,3]', output: '4', explanation: 'Delete -2 to get subarray [1, 0, 3] with sum 4.' }
      ],
      starterCode: {
        javascript: 'function solution(arr) {\n  // Write your code here\n  return 0;\n}',
        python: 'def solution(arr):\n    # Write your code here\n    return 0',
        cpp: '#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[1,-2,0,3]]', expectedOutput: '4' },
        { input: '[[1,-2,-2,3]]', expectedOutput: '3' },
        { input: '[[-1,-1,-1,-1]]', expectedOutput: '-1' }
      ],
      hiddenTestCases: [
        { input: '[[2,1,-2,1,4]]', expectedOutput: '7' }
      ],
      referenceSolution: `function solution(arr) {
  let n = arr.length;
  let noDelete = arr[0], oneDelete = 0;
  let maxResult = arr[0];
  for (let i = 1; i < n; i++) {
    oneDelete = Math.max(noDelete, oneDelete + arr[i]);
    noDelete = Math.max(arr[i], noDelete + arr[i]);
    maxResult = Math.max(maxResult, noDelete, oneDelete);
  }
  return maxResult;
}`,
      explanation: 'Keep two DP states at each position: max sum without deletion, and max sum with one deletion.'
    }
  ],

  STACK: [
    {
      title: 'Valid Parentheses and Brackets Matcher',
      pattern: 'Stack',
      difficulty: 'Easy',
      statement: 'Given a string s containing just the characters "(", ")", "{", "}", "[" and "]", determine if the input string is valid.',
      inputFormat: 'A string s containing bracket characters.',
      outputFormat: 'A boolean true or false.',
      constraints: [
        '1 <= s.length <= 10^4',
        's consists of parentheses only "()[]{}"'
      ],
      examples: [
        { input: 's = "()[]{}"', output: 'true', explanation: 'All opening brackets are closed in correct order.' },
        { input: 's = "(]"', output: 'false', explanation: 'Closing bracket does not match opening bracket.' }
      ],
      starterCode: {
        javascript: 'function solution(s) {\n  // Write your code here\n  return true;\n}',
        python: 'def solution(s):\n    # Write your code here\n    return True',
        cpp: '#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '["()[]{}"]', expectedOutput: 'true' },
        { input: '["(]"]', expectedOutput: 'false' },
        { input: '["([])"]', expectedOutput: 'true' }
      ],
      hiddenTestCases: [
        { input: '["["]', expectedOutput: 'false' }
      ],
      referenceSolution: `function solution(s) {
  const stack = [];
  const map = { ')': '(', '}': '{', ']': '[' };
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push(ch);
    } else {
      if (stack.pop() !== map[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
      explanation: 'Push open brackets to stack and pop to verify matching when encountering closing brackets.'
    }
  ]
};

/**
 * Detects the algorithmic family based on problem name and folder pattern.
 * Prioritizes the problem name so problems like "two sum" receive genuine Two Sum variants.
 */
function detectProblemCategory(baseProblemName = '', pattern = '') {
  const nameLower = (baseProblemName || '').toLowerCase().trim();
  const patternLower = (pattern || '').toLowerCase().trim();
  const combined = `${nameLower} ${patternLower}`;

  // 1. Two Sum / Target Pair / Subarray Sum family
  if (
    nameLower.includes('two sum') ||
    nameLower.includes('2 sum') ||
    nameLower.includes('3 sum') ||
    nameLower.includes('3sum') ||
    nameLower.includes('pair sum') ||
    nameLower.includes('target sum') ||
    nameLower.includes('two-sum') ||
    nameLower === 'two sum' ||
    (nameLower.includes('sum') && (nameLower.includes('two') || nameLower.includes('pair') || nameLower.includes('target')))
  ) {
    return 'TWO_SUM';
  }

  // 2. Sliding Window
  if (
    combined.includes('sliding') ||
    combined.includes('window') ||
    combined.includes('substring') ||
    combined.includes('distinct character')
  ) {
    return 'SLIDING_WINDOW';
  }

  // 3. Binary Search
  if (
    combined.includes('binary search') ||
    combined.includes('search') ||
    combined.includes('rotated') ||
    combined.includes('peak')
  ) {
    return 'BINARY_SEARCH';
  }

  // 4. Dynamic Programming
  if (
    combined.includes('dp') ||
    combined.includes('dynamic') ||
    combined.includes('stock') ||
    combined.includes('robber') ||
    combined.includes('stairs')
  ) {
    return 'DYNAMIC_PROGRAMMING';
  }

  // 5. Stack
  if (
    combined.includes('stack') ||
    combined.includes('parenthes') ||
    combined.includes('bracket')
  ) {
    return 'STACK';
  }

  // 6. Two Pointers (water/container)
  if (
    combined.includes('container') ||
    combined.includes('water') ||
    combined.includes('trap') ||
    combined.includes('two pointer') ||
    combined.includes('pointer')
  ) {
    return 'TWO_POINTERS';
  }

  // 7. General fallback: if folder mentions hash map, treat as TWO_SUM family
  if (combined.includes('hash') || combined.includes('map')) {
    return 'TWO_SUM';
  }

  return 'TWO_SUM';
}

/**
 * Generates an original similar question tailored to the given problem and pattern.
 * If Gemini API is available, calls Gemini; otherwise retrieves a verified problem
 * matching the question's true technique and rotates to avoid duplicates.
 */
const generateSimilarQuestion = async (pattern = 'General', difficulty = 'Medium', baseProblemName = '', currentQuestionTitle = '') => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    try {
      const prompt = `You are a senior algorithmic problem setter.
Create an original algorithmic coding challenge inspired by: "${baseProblemName || pattern}" (${pattern} pattern).
Target Difficulty: ${difficulty}.
CRITICAL: Return ONLY valid, parseable JSON with NO markdown code fences, NO backticks.
JSON Structure:
{
  "title": "Problem Title",
  "statement": "Detailed problem description",
  "inputFormat": "Input description",
  "outputFormat": "Output description",
  "difficulty": "${difficulty}",
  "pattern": "${pattern}",
  "constraints": ["1 <= n <= 10^5"],
  "examples": [{ "input": "...", "output": "...", "explanation": "..." }],
  "starterCode": { "javascript": "function solution(input) { return 0; }", "python": "def solution(input): return 0", "cpp": "int main() { return 0; }" },
  "testCases": [{ "input": "[...]", "expectedOutput": "..." }],
  "hiddenTestCases": [{ "input": "[...]", "expectedOutput": "..." }],
  "referenceSolution": "function solution(input) { return result; }",
  "explanation": "Intuition"
}`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (parsed.title && parsed.statement && parsed.testCases && parsed.referenceSolution) {
            const validation = validateSolutionInSandbox(parsed.referenceSolution, parsed.testCases);
            if (validation.passed) {
              parsed.validated = true;
              parsed.validationDetails = validation.details;
              return parsed;
            }
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [AI Generation] Gemini API request failed, falling back to curated library:', err.message);
    }
  }

  // Curated resolution based on semantic problem detection
  const categoryKey = detectProblemCategory(baseProblemName, pattern);
  const candidates = CATEGORIZED_PROBLEMS[categoryKey] || CATEGORIZED_PROBLEMS.TWO_SUM;

  // Pick a candidate that is different from current title if possible
  let eligible = candidates.filter(c => c.title !== currentQuestionTitle);
  if (eligible.length === 0) eligible = candidates;

  const selected = eligible[Math.floor(Math.random() * eligible.length)];
  const validation = validateSolutionInSandbox(selected.referenceSolution, selected.testCases);

  return {
    ...selected,
    validated: validation.passed,
    validationDetails: validation.details
  };
};

// Flattened catalog for backward compatibility with tests
const PATTERN_QUESTIONS_CATALOG = {
  'Sliding Window': CATEGORIZED_PROBLEMS.SLIDING_WINDOW[0],
  'Two Pointers': CATEGORIZED_PROBLEMS.TWO_POINTERS[0],
  'Binary Search': CATEGORIZED_PROBLEMS.BINARY_SEARCH[0],
  'Dynamic Programming': CATEGORIZED_PROBLEMS.DYNAMIC_PROGRAMMING[0],
  'Stack': CATEGORIZED_PROBLEMS.STACK[0],
  'General': CATEGORIZED_PROBLEMS.TWO_SUM[0]
};

module.exports = {
  generateSimilarQuestion,
  validateSolutionInSandbox,
  detectProblemCategory,
  CATEGORIZED_PROBLEMS,
  PATTERN_QUESTIONS_CATALOG
};
