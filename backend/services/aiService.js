const vm = require('vm');

/**
 * Validates a JavaScript solution against test cases in an isolated VM sandbox.
 * Supports arrays, ListNode (singly linked lists), and TreeNode (binary trees).
 */
const validateSolutionInSandbox = (solutionCode, testCases) => {
  if (!solutionCode || !testCases || testCases.length === 0) {
    return { passed: false, details: 'Missing solution code or test cases' };
  }

  function ListNode(val, next) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
  }

  function TreeNode(val, left, right) {
    this.val = (val === undefined ? 0 : val);
    this.left = (left === undefined ? null : left);
    this.right = (right === undefined ? null : right);
  }

  function arrayToList(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const dummy = new ListNode(0);
    let cur = dummy;
    for (let i = 0; i < arr.length; i++) {
      cur.next = new ListNode(arr[i]);
      cur = cur.next;
    }
    return dummy.next;
  }

  function listToArray(head) {
    const res = [];
    const visited = new Set();
    let cur = head;
    while (cur && !visited.has(cur)) {
      visited.add(cur);
      res.push(cur.val !== undefined ? cur.val : cur);
      cur = cur.next;
    }
    return res;
  }

  function arrayToTree(arr) {
    if (!Array.isArray(arr) || arr.length === 0 || arr[0] === null) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < arr.length) {
      const node = queue.shift();
      if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
        node.left = new TreeNode(arr[i]);
        queue.push(node.left);
      }
      i++;
      if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
        node.right = new TreeNode(arr[i]);
        queue.push(node.right);
      }
      i++;
    }
    return root;
  }

  function treeToArray(root) {
    if (!root) return [];
    const res = [];
    const queue = [root];
    while (queue.length > 0) {
      const node = queue.shift();
      if (node) {
        res.push(node.val);
        queue.push(node.left);
        queue.push(node.right);
      } else {
        res.push(null);
      }
    }
    while (res.length > 0 && res[res.length - 1] === null) {
      res.pop();
    }
    return res;
  }

  try {
    const sandbox = {
      ListNode,
      TreeNode,
      arrayToList,
      listToArray,
      arrayToTree,
      treeToArray,
      Math,
      Date,
      JSON,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set
    };
    const context = vm.createContext(sandbox);

    // Compile script
    const script = new vm.Script(solutionCode);
    script.runInContext(context, { timeout: 1500 });

    if (typeof sandbox.solution !== 'function') {
      return { passed: false, details: 'Exported function `solution` not found in reference code' };
    }

    const solStr = sandbox.solution.toString();
    const isListProb = solStr.includes('.next') || solStr.includes('ListNode') || solutionCode.includes('ListNode');
    const isTreeProb = (solStr.includes('.left') || solStr.includes('.right') || solStr.includes('TreeNode')) && !isListProb;

    // Run test cases
    for (let i = 0; i < testCases.length; i++) {
      const { input, expectedOutput } = testCases[i];
      let parsedArgs;
      try {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed)) {
          parsedArgs = [parsed];
        } else if (sandbox.solution.length === 1 && parsed.length === 1 && Array.isArray(parsed[0])) {
          parsedArgs = parsed;
        } else if (sandbox.solution.length === 1 && parsed.length > 1) {
          parsedArgs = [parsed];
        } else {
          parsedArgs = parsed;
        }
      } catch {
        parsedArgs = [input];
      }

      // Convert arguments for list or tree problems
      const finalArgs = parsedArgs.map((arg, idx) => {
        if (idx === 0 && isListProb && Array.isArray(arg)) {
          return arrayToList(arg);
        }
        if (idx === 0 && isTreeProb && Array.isArray(arg)) {
          return arrayToTree(arg);
        }
        return arg;
      });

      let result;
      try {
        result = sandbox.solution.apply(null, finalArgs);
      } catch (applyErr) {
        // Fallback to unconverted arguments
        result = sandbox.solution.apply(null, parsedArgs);
      }

      if (result && typeof result === 'object' && ('next' in result || ('val' in result && !('left' in result)))) {
        result = listToArray(result);
      } else if (result && typeof result === 'object' && ('left' in result || 'right' in result)) {
        result = treeToArray(result);
      }

      const strResult = JSON.stringify(result);
      const strExpected = expectedOutput ? expectedOutput.trim() : '';

      // Normalize comparison
      const normalizedResult = (strResult || '').replace(/\s+/g, '');
      const normalizedExpected = strExpected.replace(/\s+/g, '');

      if (normalizedResult !== normalizedExpected && String(result) !== strExpected) {
        return {
          passed: false,
          details: `Test case ${i + 1} failed: input ${input}, expected ${expectedOutput}, got ${strResult}`
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
  ],
  LINKED_LIST: [
    {
      title: 'Reverse Nodes in Singly Linked List',
      pattern: 'Linked List',
      difficulty: 'Easy',
      statement: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
      inputFormat: 'An array representing the singly linked list node values.',
      outputFormat: 'An array representing the reversed linked list.',
      constraints: [
        'The number of nodes in the list is the range [0, 5000].',
        '-5000 <= Node.val <= 5000'
      ],
      examples: [
        { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: 'The list is reversed from 1->2->3->4->5 to 5->4->3->2->1.' },
        { input: 'head = [1,2]', output: '[2,1]', explanation: 'Reversing two elements swaps their positions.' }
      ],
      starterCode: {
        javascript: 'function solution(head) {\n  // Write your code here\n  // head can be treated as ListNode or array\n  let prev = null, curr = head;\n  while (curr) {\n    let nextTemp = curr.next;\n    curr.next = prev;\n    prev = curr;\n    curr = nextTemp;\n  }\n  return prev;\n}',
        python: 'def solution(head):\n    # Write your code here\n    prev = None\n    curr = head\n    while curr:\n        nxt = curr.next\n        curr.next = prev\n        prev = curr\n        curr = nxt\n    return prev',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[1, 2, 3, 4, 5]', expectedOutput: '[5, 4, 3, 2, 1]' },
        { input: '[1, 2]', expectedOutput: '[2, 1]' },
        { input: '[1]', expectedOutput: '[1]' },
        { input: '[]', expectedOutput: '[]' },
        { input: '[10, 20, 30]', expectedOutput: '[30, 20, 10]' }
      ],
      hiddenTestCases: [
        { input: '[9, 8, 7, 6, 5]', expectedOutput: '[5, 6, 7, 8, 9]' },
        { input: '[-1, -2, -3]', expectedOutput: '[-3, -2, -1]' },
        { input: '[0, 0, 1]', expectedOutput: '[1, 0, 0]' }
      ],
      referenceSolution: `function solution(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
      explanation: 'Iterate through the linked list maintaining a prev pointer and redirecting curr.next to prev at each step in O(N) time and O(1) extra space.'
    },
    {
      title: 'Middle of the Singly Linked List',
      pattern: 'Linked List & Fast/Slow Pointers',
      difficulty: 'Easy',
      statement: 'Given the head of a singly linked list, return the middle node of the linked list. If there are two middle nodes, return the second middle node.',
      inputFormat: 'An array representing node values in the list.',
      outputFormat: 'An array representing the nodes from middle node to the end of the list.',
      constraints: [
        'The number of nodes in the list is in the range [1, 100].',
        '1 <= Node.val <= 100'
      ],
      examples: [
        { input: 'head = [1,2,3,4,5]', output: '[3,4,5]', explanation: 'The middle node of the list is node 3.' },
        { input: 'head = [1,2,3,4,5,6]', output: '[4,5,6]', explanation: 'Since the list has two middle nodes with values 3 and 4, we return the second one.' }
      ],
      starterCode: {
        javascript: 'function solution(head) {\n  // Write your code here\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n  }\n  return slow;\n}',
        python: 'def solution(head):\n    # Write your code here\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n    return slow',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[1, 2, 3, 4, 5]', expectedOutput: '[3, 4, 5]' },
        { input: '[1, 2, 3, 4, 5, 6]', expectedOutput: '[4, 5, 6]' },
        { input: '[1]', expectedOutput: '[1]' },
        { input: '[1, 2]', expectedOutput: '[2]' },
        { input: '[10, 20, 30, 40, 50, 60, 70]', expectedOutput: '[40, 50, 60, 70]' }
      ],
      hiddenTestCases: [
        { input: '[5, 4, 3, 2, 1]', expectedOutput: '[3, 2, 1]' },
        { input: '[100, 200]', expectedOutput: '[200]' },
        { input: '[7, 8, 9]', expectedOutput: '[8, 9]' }
      ],
      referenceSolution: `function solution(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
      explanation: 'Use two pointers: slow advances 1 step while fast advances 2 steps. When fast reaches end, slow is at the middle in O(N) time and O(1) space.'
    },
    {
      title: 'Remove Duplicates from Sorted Linked List',
      pattern: 'Linked List',
      difficulty: 'Easy',
      statement: 'Given the head of a sorted linked list, delete all duplicates such that each element appears only once. Return the linked list sorted as well.',
      inputFormat: 'A sorted array of integers representing the linked list.',
      outputFormat: 'An array representing the linked list with duplicates removed.',
      constraints: [
        'The number of nodes in the list is in the range [0, 300].',
        '-100 <= Node.val <= 100',
        'The list is guaranteed to be sorted in ascending order.'
      ],
      examples: [
        { input: 'head = [1,1,2]', output: '[1,2]', explanation: 'Duplicate node 1 is removed.' },
        { input: 'head = [1,1,2,3,3]', output: '[1,2,3]', explanation: 'Duplicate nodes 1 and 3 are removed.' }
      ],
      starterCode: {
        javascript: 'function solution(head) {\n  // Write your code here\n  let curr = head;\n  while (curr && curr.next) {\n    if (curr.val === curr.next.val) {\n      curr.next = curr.next.next;\n    } else {\n      curr = curr.next;\n    }\n  }\n  return head;\n}',
        python: 'def solution(head):\n    curr = head\n    while curr and curr.next:\n        if curr.val == curr.next.val:\n            curr.next = curr.next.next\n        else:\n            curr = curr.next\n    return head',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[1, 1, 2]', expectedOutput: '[1, 2]' },
        { input: '[1, 1, 2, 3, 3]', expectedOutput: '[1, 2, 3]' },
        { input: '[1, 1, 1, 1]', expectedOutput: '[1]' },
        { input: '[1]', expectedOutput: '[1]' },
        { input: '[]', expectedOutput: '[]' }
      ],
      hiddenTestCases: [
        { input: '[1, 2, 3, 4, 5]', expectedOutput: '[1, 2, 3, 4, 5]' },
        { input: '[-3, -3, -1, 0, 0, 2]', expectedOutput: '[-3, -1, 0, 2]' },
        { input: '[5, 5, 5, 6, 6, 7]', expectedOutput: '[5, 6, 7]' }
      ],
      referenceSolution: `function solution(head) {
  let curr = head;
  while (curr && curr.next) {
    if (curr.val === curr.next.val) {
      curr.next = curr.next.next;
    } else {
      curr = curr.next;
    }
  }
  return head;
}`,
      explanation: 'Traverse the sorted list: whenever current node value equals next node value, skip next node by pointing curr.next to curr.next.next.'
    }
  ],
  TREES: [
    {
      title: 'Invert Binary Tree',
      pattern: 'Tree Traversal & Recursion',
      difficulty: 'Easy',
      statement: 'Given the root of a binary tree, invert the tree (swap the left and right child of every node recursively), and return its root.',
      inputFormat: 'A level-order array representing the binary tree.',
      outputFormat: 'A level-order array representing the inverted binary tree.',
      constraints: [
        'The number of nodes in the tree is in the range [0, 100].',
        '-100 <= Node.val <= 100'
      ],
      examples: [
        { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]', explanation: 'Every left child becomes right child and vice versa.' },
        { input: 'root = [2,1,3]', output: '[2,3,1]', explanation: 'Left child 1 and right child 3 are swapped.' }
      ],
      starterCode: {
        javascript: 'function solution(root) {\n  // Write your code here\n  if (!root) return null;\n  const temp = root.left;\n  root.left = solution(root.right);\n  root.right = solution(temp);\n  return root;\n}',
        python: 'def solution(root):\n    if not root: return None\n    root.left, root.right = solution(root.right), solution(root.left)\n    return root',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[4, 2, 7, 1, 3, 6, 9]', expectedOutput: '[4, 7, 2, 9, 6, 3, 1]' },
        { input: '[2, 1, 3]', expectedOutput: '[2, 3, 1]' },
        { input: '[]', expectedOutput: '[]' },
        { input: '[1]', expectedOutput: '[1]' },
        { input: '[1, 2]', expectedOutput: '[1, null, 2]' }
      ],
      hiddenTestCases: [
        { input: '[5, 3, 8, 1, 4]', expectedOutput: '[5, 8, 3, null, null, 4, 1]' },
        { input: '[10, 5, 15]', expectedOutput: '[10, 15, 5]' },
        { input: '[1, null, 2]', expectedOutput: '[1, 2]' }
      ],
      referenceSolution: `function solution(root) {
  if (!root) return null;
  const temp = root.left;
  root.left = solution(root.right);
  root.right = solution(temp);
  return root;
}`,
      explanation: 'Recursively invert both left and right subtrees and swap them in O(N) time and O(H) call stack space.'
    },
    {
      title: 'Maximum Depth of Binary Tree',
      pattern: 'Tree & Depth-First Search',
      difficulty: 'Easy',
      statement: 'Given the root of a binary tree, return its maximum depth. A binary tree\'s maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.',
      inputFormat: 'A level-order array representing the binary tree.',
      outputFormat: 'An integer representing the maximum tree depth.',
      constraints: [
        'The number of nodes in the tree is in the range [0, 10^4].',
        '-100 <= Node.val <= 100'
      ],
      examples: [
        { input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'Path 3 -> 20 -> 15 has 3 nodes.' },
        { input: 'root = [1,null,2]', output: '2', explanation: 'Path 1 -> 2 has 2 nodes.' }
      ],
      starterCode: {
        javascript: 'function solution(root) {\n  // Write your code here\n  if (!root) return 0;\n  return 1 + Math.max(solution(root.left), solution(root.right));\n}',
        python: 'def solution(root):\n    if not root: return 0\n    return 1 + max(solution(root.left), solution(root.right))',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[3, 9, 20, null, null, 15, 7]', expectedOutput: '3' },
        { input: '[1, null, 2]', expectedOutput: '2' },
        { input: '[]', expectedOutput: '0' },
        { input: '[1]', expectedOutput: '1' },
        { input: '[1, 2, 3, 4, null, null, 5]', expectedOutput: '3' }
      ],
      hiddenTestCases: [
        { input: '[1, 2, null, 3, null, 4]', expectedOutput: '4' },
        { input: '[5, 4, 8, 11, null, 13, 4]', expectedOutput: '4' },
        { input: '[10]', expectedOutput: '1' }
      ],
      referenceSolution: `function solution(root) {
  if (!root) return 0;
  return 1 + Math.max(solution(root.left), solution(root.right));
}`,
      explanation: 'Use recursive post-order traversal: the depth at any node is 1 + max(depth(left), depth(right)).'
    }
  ],
  GRAPHS: [
    {
      title: 'Flood Fill Image Region',
      pattern: 'Graph & Depth-First Search',
      difficulty: 'Easy',
      statement: 'An image is represented by an m x n integer grid image where image[i][j] represents the pixel value. You are also given three integers sr, sc, and color. Perform a flood fill on the image starting from pixel image[sr][sc]. Return the modified image.',
      inputFormat: 'A 2D integer array image, start row sr, start column sc, and new color.',
      outputFormat: 'The modified 2D integer grid.',
      constraints: [
        'm == image.length, n == image[i].length',
        '1 <= m, n <= 50',
        '0 <= image[i][j], color < 65536',
        '0 <= sr < m, 0 <= sc < n'
      ],
      examples: [
        { input: 'image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, color = 2', output: '[[2,2,2],[2,2,0],[2,0,1]]', explanation: 'All connected 1s sharing the center pixel are filled with 2.' }
      ],
      starterCode: {
        javascript: 'function solution(image, sr, sc, color) {\n  // Write your code here\n  const initColor = image[sr][sc];\n  if (initColor === color) return image;\n  const m = image.length, n = image[0].length;\n  function dfs(r, c) {\n    if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] !== initColor) return;\n    image[r][c] = color;\n    dfs(r + 1, c);\n    dfs(r - 1, c);\n    dfs(r, c + 1);\n    dfs(r, c - 1);\n  }\n  dfs(sr, sc);\n  return image;\n}',
        python: 'def solution(image, sr, sc, color):\n    # Write your code here\n    init = image[sr][sc]\n    if init == color: return image\n    m, n = len(image), len(image[0])\n    def dfs(r, c):\n        if 0 <= r < m and 0 <= c < n and image[r][c] == init:\n            image[r][c] = color\n            dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)\n    dfs(sr, sc)\n    return image',
        cpp: '#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}'
      },
      testCases: [
        { input: '[[[1,1,1],[1,1,0],[1,0,1]], 1, 1, 2]', expectedOutput: '[[2,2,2],[2,2,0],[2,0,1]]' },
        { input: '[[[0,0,0],[0,0,0]], 0, 0, 0]', expectedOutput: '[[0,0,0],[0,0,0]]' },
        { input: '[[[1]], 0, 0, 3]', expectedOutput: '[[3]]' },
        { input: '[[[1,2],[3,4]], 0, 1, 5]', expectedOutput: '[[1,5],[3,4]]' },
        { input: '[[[0,1],[1,0]], 1, 0, 2]', expectedOutput: '[[0,1],[2,0]]' }
      ],
      hiddenTestCases: [
        { input: '[[[2,2],[2,2]], 0, 0, 4]', expectedOutput: '[[4,4],[4,4]]' },
        { input: '[[[1,1,1],[1,0,1],[1,1,1]], 0, 0, 9]', expectedOutput: '[[9,9,9],[9,0,9],[9,9,9]]' },
        { input: '[[[5,5,5]], 0, 1, 1]', expectedOutput: '[[1,1,1]]' }
      ],
      referenceSolution: `function solution(image, sr, sc, color) {
  const initColor = image[sr][sc];
  if (initColor === color) return image;
  const m = image.length, n = image[0].length;
  function dfs(r, c) {
    if (r < 0 || r >= m || c < 0 || c >= n || image[r][c] !== initColor) return;
    image[r][c] = color;
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }
  dfs(sr, sc);
  return image;
}`,
      explanation: 'Start DFS from the source pixel, checking 4-directionally for matching color and updating to new color.'
    }
  ]
};

/**
 * Detects the algorithmic family based on problem name and folder pattern.
 * Prioritizes explicit technique detection so Linked List, Trees, and Graphs receive genuine matching questions.
 */
function detectProblemCategory(baseProblemName = '', pattern = '') {
  const nameLower = (baseProblemName || '').toLowerCase().trim();
  const patternLower = (pattern || '').toLowerCase().trim();
  const combined = `${nameLower} ${patternLower}`;

  // 1. Linked List family (prioritized to ensure linked list questions never get misclassified)
  if (
    combined.includes('linked list') ||
    combined.includes('linkedlist') ||
    combined.includes('listnode') ||
    combined.includes('reverse list') ||
    combined.includes('reverse-linked-list') ||
    combined.includes('reorder list') ||
    combined.includes('middle of the linked') ||
    combined.includes('merge two sorted lists') ||
    combined.includes('remove nth node') ||
    (combined.includes('cycle') && combined.includes('list')) ||
    combined.includes('palindrome linked') ||
    combined.includes('singly') ||
    combined.includes('doubly')
  ) {
    return 'LINKED_LIST';
  }

  // 2. Trees / BST family
  if (
    combined.includes('tree') ||
    combined.includes('bst') ||
    combined.includes('binary tree') ||
    combined.includes('treenode') ||
    combined.includes('inorder') ||
    combined.includes('preorder') ||
    combined.includes('postorder') ||
    combined.includes('level order') ||
    combined.includes('lca') ||
    combined.includes('ancestor') ||
    combined.includes('invert tree') ||
    combined.includes('max depth')
  ) {
    return 'TREES';
  }

  // 3. Graphs family
  if (
    combined.includes('graph') ||
    combined.includes('island') ||
    combined.includes('bfs') ||
    combined.includes('dfs') ||
    combined.includes('topological') ||
    combined.includes('course schedule') ||
    combined.includes('adjacency') ||
    combined.includes('flood fill')
  ) {
    return 'GRAPHS';
  }

  // 4. Two Sum / Target Pair / Subarray Sum family
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

  // 5. Sliding Window
  if (
    combined.includes('sliding') ||
    combined.includes('window') ||
    combined.includes('substring') ||
    combined.includes('distinct character')
  ) {
    return 'SLIDING_WINDOW';
  }

  // 6. Binary Search
  if (
    combined.includes('binary search') ||
    combined.includes('search') ||
    combined.includes('rotated') ||
    combined.includes('peak')
  ) {
    return 'BINARY_SEARCH';
  }

  // 7. Dynamic Programming
  if (
    combined.includes('dp') ||
    combined.includes('dynamic') ||
    combined.includes('stock') ||
    combined.includes('robber') ||
    combined.includes('stairs')
  ) {
    return 'DYNAMIC_PROGRAMMING';
  }

  // 8. Stack
  if (
    combined.includes('stack') ||
    combined.includes('parenthes') ||
    combined.includes('bracket')
  ) {
    return 'STACK';
  }

  // 9. Two Pointers (water/container)
  if (
    combined.includes('container') ||
    combined.includes('water') ||
    combined.includes('trap') ||
    combined.includes('two pointer') ||
    (combined.includes('pointer') && !combined.includes('list'))
  ) {
    return 'TWO_POINTERS';
  }

  // 10. General fallback: if folder mentions hash map, treat as TWO_SUM family
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
      const prompt = `You are a principal algorithmic challenge designer for top-tier software engineering interviews.
The user is actively practicing problems in the following domain:
- Selected Folder / Pattern: "${pattern}"
- Inspired by Question: "${baseProblemName || pattern}"
- Target Difficulty: ${difficulty}

CRITICAL RULES:
1. The new problem MUST directly test the exact same algorithmic technique and data structure as "${pattern}" and "${baseProblemName}".
   - If the folder/question is about Linked Lists, the new problem MUST be a Linked List problem (node manipulation, reversing, fast/slow pointers, merging, splitting, reordering).
   - If the folder/question is about Binary Trees / BST, the new problem MUST be a Binary Tree problem (traversal, depth, inversion, symmetry, LCA).
   - If Graphs, generate a Graph problem (BFS/DFS, connectivity, flood fill).
   - If Dynamic Programming, generate a DP problem (subproblems, memoization/tabulation).
   - If Sliding Window, generate a Sliding Window problem.
   - If Binary Search, generate a Binary Search problem.
   - If Two Pointers, generate a Two Pointers problem.
   - If Stack, generate a Stack problem.
2. DO NOT GENERATE AN UNRELATED CATEGORY. (e.g. NEVER generate an array hash map / two sum problem if the user is in Linked List or Tree folder).
3. Do NOT repeat the exact problem "${currentQuestionTitle || baseProblemName}". Create an original, engaging variation testing the same core pattern.
4. Input and Output formats:
   - For Linked List problems: Represent linked lists as arrays in inputs and expected outputs (e.g. "[1, 2, 3, 4, 5]" and expected "[5, 4, 3, 2, 1]"). In the referenceSolution and starterCode, accept the array or provide standard ListNode handling so it can be evaluated directly.
   - For Tree problems: Represent trees as level-order arrays (e.g. "[4, 2, 7, 1, 3, 6, 9]").
5. TEST CASES REQUIREMENT (MANDATORY):
   - "testCases": MUST contain at least 4 distinct public test cases:
     1. Standard typical example.
     2. Alternate scenario (different values/order).
     3. Minimum boundary condition (minimum elements: empty or single element, or smallest constraint).
     4. Edge case scenario (duplicates, negative values, or boundary limits).
   - "hiddenTestCases": MUST contain at least 3 distinct hidden stress test cases:
     5. Scaled input (larger constraints).
     6. Stress test (reversed, all duplicates, or extreme values).
     7. Worst-case algorithmic performance pattern.

Return ONLY valid, parseable JSON with NO markdown code fences, NO backticks.
JSON Structure:
{
  "title": "Unique Problem Title",
  "statement": "Detailed, crystal-clear problem statement with input/output requirements",
  "inputFormat": "Formal description of input types and shapes",
  "outputFormat": "Formal description of expected return value",
  "difficulty": "${difficulty}",
  "pattern": "${pattern}",
  "constraints": ["..."],
  "examples": [
    { "input": "...", "output": "...", "explanation": "..." },
    { "input": "...", "output": "...", "explanation": "..." }
  ],
  "starterCode": {
    "javascript": "function solution(input) {\\n  // Write your code here\\n  return 0;\\n}",
    "python": "def solution(input):\\n    # Write your code here\\n    return 0",
    "cpp": "#include <iostream>\\n#include <vector>\\nusing namespace std;\\nint main() {\\n    return 0;\\n}"
  },
  "testCases": [
    { "input": "[...]", "expectedOutput": "..." },
    { "input": "[...]", "expectedOutput": "..." },
    { "input": "[...]", "expectedOutput": "..." },
    { "input": "[...]", "expectedOutput": "..." }
  ],
  "hiddenTestCases": [
    { "input": "[...]", "expectedOutput": "..." },
    { "input": "[...]", "expectedOutput": "..." },
    { "input": "[...]", "expectedOutput": "..." }
  ],
  "referenceSolution": "function solution(input) { ... }",
  "explanation": "Intuition, time complexity, and space complexity breakdown."
}`;

      // Primary model: gemini-2.5-flash with fallback to gemini-flash-latest
      let res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(12000),
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      });

      if (!res.ok) {
        // Fallback endpoint
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(12000),
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
          })
        });
      }

      if (res.ok) {
        const data = await res.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (parsed.title && parsed.statement && parsed.testCases && parsed.testCases.length >= 3 && parsed.referenceSolution) {
            const allTests = [...(parsed.testCases || []), ...(parsed.hiddenTestCases || [])];
            const validation = validateSolutionInSandbox(parsed.referenceSolution, allTests);
            parsed.validated = validation.passed;
            parsed.validationDetails = validation.details;
            return parsed;
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [AI Generation] Gemini API request failed, falling back to curated library:', err.message);
    }
  }

  // Curated resolution based on semantic problem detection
  const categoryKey = detectProblemCategory(baseProblemName, pattern);
  const candidates = CATEGORIZED_PROBLEMS[categoryKey] || CATEGORIZED_PROBLEMS.LINKED_LIST || CATEGORIZED_PROBLEMS.TWO_SUM;

  // Pick a candidate that is different from current title if possible
  let eligible = candidates.filter(c => c.title !== currentQuestionTitle);
  if (eligible.length === 0) eligible = candidates;

  const selected = { ...eligible[Math.floor(Math.random() * eligible.length)] };

  // Ensure selected has at least 4 visible test cases and at least 2 hidden test cases
  let allTestCases = [...(selected.testCases || [])];
  let hiddenCases = [...(selected.hiddenTestCases || [])];

  // If total test cases < 5, synthesize additional edge cases using reference solution
  if (allTestCases.length + hiddenCases.length < 5 && selected.referenceSolution) {
    try {
      const sandbox = {};
      const context = vm.createContext(sandbox);
      const script = new vm.Script(selected.referenceSolution);
      script.runInContext(context, { timeout: 1000 });

      if (typeof sandbox.solution === 'function' && allTestCases.length > 0) {
        const firstInputRaw = allTestCases[0].input;
        let parsed = JSON.parse(firstInputRaw);

        if (Array.isArray(parsed) && parsed.length > 0) {
          if (Array.isArray(parsed[0])) {
            const edgeArg = parsed[0].slice(0, 2);
            const extraArgs = [edgeArg, ...parsed.slice(1)];
            try {
              const res1 = sandbox.solution.apply(null, extraArgs);
              if (res1 !== undefined) {
                allTestCases.push({
                  input: JSON.stringify(extraArgs),
                  expectedOutput: JSON.stringify(res1)
                });
              }
            } catch {}

            const revArg = [...parsed[0]].reverse();
            const revArgs = [revArg, ...parsed.slice(1)];
            try {
              const res2 = sandbox.solution.apply(null, revArgs);
              if (res2 !== undefined) {
                hiddenCases.push({
                  input: JSON.stringify(revArgs),
                  expectedOutput: JSON.stringify(res2)
                });
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  const validation = validateSolutionInSandbox(selected.referenceSolution, allTestCases);

  return {
    ...selected,
    testCases: allTestCases,
    hiddenTestCases: hiddenCases,
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
  'Linked List': CATEGORIZED_PROBLEMS.LINKED_LIST[0],
  'Tree': CATEGORIZED_PROBLEMS.TREES[0],
  'Trees': CATEGORIZED_PROBLEMS.TREES[0],
  'Graph': CATEGORIZED_PROBLEMS.GRAPHS[0],
  'Graphs': CATEGORIZED_PROBLEMS.GRAPHS[0],
  'General': CATEGORIZED_PROBLEMS.TWO_SUM[0]
};

module.exports = {
  generateSimilarQuestion,
  validateSolutionInSandbox,
  detectProblemCategory,
  CATEGORIZED_PROBLEMS,
  PATTERN_QUESTIONS_CATALOG
};
