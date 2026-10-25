import React, { useState } from 'react';
import api from './api';
import AppHeader from './AppHeader';

const STRIVER_A2Z_PROBLEMS = [
  // Step 1 & 2: Basics & Sorting
  { title: 'Reverse an Array', pattern: 'Arrays & Math', difficulty: 'Easy', link: 'https://leetcode.com/problems/reverse-string/', step: 'Step 1: Basics' },
  { title: 'Check if Array is Sorted', pattern: 'Arrays & Math', difficulty: 'Easy', link: 'https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/', step: 'Step 1: Basics' },
  { title: 'Merge Sort Implementation', pattern: 'Sorting', difficulty: 'Medium', link: 'https://leetcode.com/problems/sort-an-array/', step: 'Step 2: Sorting' },
  { title: 'Quick Sort Implementation', pattern: 'Sorting', difficulty: 'Medium', link: 'https://leetcode.com/problems/sort-an-array/', step: 'Step 2: Sorting' },

  // Step 3: Arrays
  { title: 'Two Sum', pattern: 'Arrays & Hash Map', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/', step: 'Step 3: Arrays' },
  { title: 'Sort Colors (0s, 1s, 2s)', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/sort-colors/', step: 'Step 3: Arrays' },
  { title: 'Maximum Subarray (Kadane\'s)', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/maximum-subarray/', step: 'Step 3: Arrays' },
  { title: 'Best Time to Buy and Sell Stock', pattern: 'Arrays', difficulty: 'Easy', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', step: 'Step 3: Arrays' },
  { title: 'Rearrange Array Elements by Sign', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/rearrange-array-elements-by-sign/', step: 'Step 3: Arrays' },
  { title: 'Next Permutation', pattern: 'Arrays', difficulty: 'Medium', link: 'https://leetcode.com/problems/next-permutation/', step: 'Step 3: Arrays' },
  { title: '3Sum', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/3sum/', step: 'Step 3: Arrays' },
  { title: '4Sum', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/4sum/', step: 'Step 3: Arrays' },
  { title: 'Merge Overlapping Subintervals', pattern: 'Intervals', difficulty: 'Medium', link: 'https://leetcode.com/problems/merge-intervals/', step: 'Step 3: Arrays' },
  { title: 'Subarray with Given XOR K', pattern: 'Hash Map', difficulty: 'Medium', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', step: 'Step 3: Arrays' },

  // Step 4: Binary Search
  { title: 'Binary Search in Sorted Array', pattern: 'Binary Search', difficulty: 'Easy', link: 'https://leetcode.com/problems/binary-search/', step: 'Step 4: Binary Search' },
  { title: 'Search in Rotated Sorted Array', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', step: 'Step 4: Binary Search' },
  { title: 'Find Minimum in Rotated Sorted Array', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/', step: 'Step 4: Binary Search' },
  { title: 'Koko Eating Bananas', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://leetcode.com/problems/koko-eating-bananas/', step: 'Step 4: Binary Search' },
  { title: 'Capacity To Ship Packages Within D Days', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/', step: 'Step 4: Binary Search' },

  // Step 5: Strings
  { title: 'Longest Common Prefix', pattern: 'Strings', difficulty: 'Easy', link: 'https://leetcode.com/problems/longest-common-prefix/', step: 'Step 5: Strings' },
  { title: 'Longest Palindromic Substring', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-palindromic-substring/', step: 'Step 5: Strings' },
  { title: 'String to Integer (atoi)', pattern: 'Strings', difficulty: 'Medium', link: 'https://leetcode.com/problems/string-to-integer-atoi/', step: 'Step 5: Strings' },

  // Step 6: Linked List
  { title: 'Reverse Linked List', pattern: 'Linked List', difficulty: 'Easy', link: 'https://leetcode.com/problems/reverse-linked-list/', step: 'Step 6: Linked List' },
  { title: 'Detect Cycle in Linked List', pattern: 'Two Pointers', difficulty: 'Easy', link: 'https://leetcode.com/problems/linked-list-cycle/', step: 'Step 6: Linked List' },
  { title: 'Remove Nth Node From End of List', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/remove-nth-node-from-end-of-list/', step: 'Step 6: Linked List' },
  { title: 'LRU Cache Implementation', pattern: 'Design & Linked List', difficulty: 'Hard', link: 'https://leetcode.com/problems/lru-cache/', step: 'Step 6: Linked List' },

  // Step 9 & 10: Stack, Sliding Window
  { title: 'Valid Parentheses', pattern: 'Stack', difficulty: 'Easy', link: 'https://leetcode.com/problems/valid-parentheses/', step: 'Step 9: Stack & Queue' },
  { title: 'Next Greater Element I', pattern: 'Monotonic Stack', difficulty: 'Easy', link: 'https://leetcode.com/problems/next-greater-element-i/', step: 'Step 9: Stack & Queue' },
  { title: 'Trapping Rain Water', pattern: 'Two Pointers', difficulty: 'Hard', link: 'https://leetcode.com/problems/trapping-rain-water/', step: 'Step 9: Stack & Queue' },
  { title: 'Longest Substring Without Repeating Characters', pattern: 'Sliding Window', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', step: 'Step 10: Sliding Window' },
  { title: 'Max Consecutive Ones III', pattern: 'Sliding Window', difficulty: 'Medium', link: 'https://leetcode.com/problems/max-consecutive-ones-iii/', step: 'Step 10: Sliding Window' },

  // Step 13 & 14: Trees & Graphs
  { title: 'Binary Tree Inorder Traversal', pattern: 'Trees', difficulty: 'Easy', link: 'https://leetcode.com/problems/binary-tree-inorder-traversal/', step: 'Step 13: Binary Trees' },
  { title: 'Maximum Depth of Binary Tree', pattern: 'Trees', difficulty: 'Easy', link: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', step: 'Step 13: Binary Trees' },
  { title: 'Lowest Common Ancestor of a Binary Tree', pattern: 'Trees', difficulty: 'Medium', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', step: 'Step 13: Binary Trees' },
  { title: 'Number of Islands', pattern: 'Graphs & BFS/DFS', difficulty: 'Medium', link: 'https://leetcode.com/problems/number-of-islands/', step: 'Step 14: Graphs' },
  { title: 'Rotting Oranges', pattern: 'Graphs & BFS', difficulty: 'Medium', link: 'https://leetcode.com/problems/rotting-oranges/', step: 'Step 14: Graphs' },

  // Step 15: DP
  { title: 'Climbing Stairs', pattern: 'Dynamic Programming', difficulty: 'Easy', link: 'https://leetcode.com/problems/climbing-stairs/', step: 'Step 15: DP' },
  { title: 'Coin Change', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/coin-change/', step: 'Step 15: DP' },
  { title: 'Longest Increasing Subsequence', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', step: 'Step 15: DP' }
];

const CSES_PROBLEMS = [
  // Introductory
  { title: 'Weird Algorithm (Collatz Conjecture)', pattern: 'Introductory', difficulty: 'Easy', link: 'https://cses.fi/problemset/task/1068', section: 'Introductory' },
  { title: 'Missing Number', pattern: 'Introductory', difficulty: 'Easy', link: 'https://cses.fi/problemset/task/1083', section: 'Introductory' },
  { title: 'Repetitions (DNA Sequence)', pattern: 'Introductory', difficulty: 'Easy', link: 'https://cses.fi/problemset/task/1069', section: 'Introductory' },
  { title: 'Increasing Array', pattern: 'Introductory', difficulty: 'Easy', link: 'https://cses.fi/problemset/task/1094', section: 'Introductory' },
  { title: 'Permutations', pattern: 'Introductory', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1070', section: 'Introductory' },

  // Sorting & Searching
  { title: 'Distinct Numbers', pattern: 'Sorting & Searching', difficulty: 'Easy', link: 'https://cses.fi/problemset/task/1621', section: 'Sorting & Searching' },
  { title: 'Apartments Matching', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1084', section: 'Sorting & Searching' },
  { title: 'Ferris Wheel (Greedy Weight)', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1090', section: 'Sorting & Searching' },
  { title: 'Concert Tickets', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1091', section: 'Sorting & Searching' },
  { title: 'Restaurant Customers', pattern: 'Prefix Sum & Coordinate Compression', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1619', section: 'Sorting & Searching' },

  // Dynamic Programming
  { title: 'Dice Combinations', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1633', section: 'Dynamic Programming' },
  { title: 'Minimizing Coins', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1634', section: 'Dynamic Programming' },
  { title: 'Coin Combinations I', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1635', section: 'Dynamic Programming' },
  { title: 'Grid Paths', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1638', section: 'Dynamic Programming' },
  { title: 'Book Shop (0/1 Knapsack)', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1158', section: 'Dynamic Programming' },

  // Graph Algorithms
  { title: 'Counting Rooms', pattern: 'Graphs & BFS/DFS', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1192', section: 'Graph Algorithms' },
  { title: 'Labyrinth (Shortest Path Grid)', pattern: 'Graphs & BFS', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1193', section: 'Graph Algorithms' },
  { title: 'Building Roads (Connected Components)', pattern: 'Disjoint Set / DSU', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1666', section: 'Graph Algorithms' },
  { title: 'Message Route (Unweighted Shortest Path)', pattern: 'Graphs & BFS', difficulty: 'Medium', link: 'https://cses.fi/problemset/task/1667', section: 'Graph Algorithms' },
  { title: 'Shortest Routes I (Dijkstra)', pattern: 'Graphs & Dijkstra', difficulty: 'Hard', link: 'https://cses.fi/problemset/task/1671', section: 'Graph Algorithms' }
];

const FRAZ_SDE_PROBLEMS = [
  { title: 'Two Sum', pattern: 'Arrays & Hash Map', difficulty: 'Easy', link: 'https://leetcode.com/problems/two-sum/', category: 'Arrays' },
  { title: 'Best Time to Buy and Sell Stock', pattern: 'Arrays', difficulty: 'Easy', link: 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', category: 'Arrays' },
  { title: '3Sum', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/3sum/', category: 'Arrays' },
  { title: 'Container With Most Water', pattern: 'Two Pointers', difficulty: 'Medium', link: 'https://leetcode.com/problems/container-with-most-water/', category: 'Two Pointers' },
  { title: 'Subarray Sum Equals K', pattern: 'Hash Map & Prefix Sum', difficulty: 'Medium', link: 'https://leetcode.com/problems/subarray-sum-equals-k/', category: 'Arrays' },
  { title: 'Merge Intervals', pattern: 'Intervals', difficulty: 'Medium', link: 'https://leetcode.com/problems/merge-intervals/', category: 'Intervals' },
  { title: 'Group Anagrams', pattern: 'Hash Map & Strings', difficulty: 'Medium', link: 'https://leetcode.com/problems/group-anagrams/', category: 'Strings' },
  { title: 'Search in Rotated Sorted Array', pattern: 'Binary Search', difficulty: 'Medium', link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/', category: 'Binary Search' },
  { title: 'Reverse Nodes in k-Group', pattern: 'Linked List', difficulty: 'Hard', link: 'https://leetcode.com/problems/reverse-nodes-in-k-group/', category: 'Linked List' },
  { title: 'Word Break', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/word-break/', category: 'Dynamic Programming' },
  { title: 'Course Schedule (Cycle in Directed Graph)', pattern: 'Graphs & Topological Sort', difficulty: 'Medium', link: 'https://leetcode.com/problems/course-schedule/', category: 'Graphs' },
  { title: 'Clone Graph', pattern: 'Graphs & BFS/DFS', difficulty: 'Medium', link: 'https://leetcode.com/problems/clone-graph/', category: 'Graphs' },
  { title: 'Lowest Common Ancestor of a Binary Tree', pattern: 'Trees', difficulty: 'Medium', link: 'https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/', category: 'Trees' },
  { title: 'Longest Increasing Subsequence', pattern: 'Dynamic Programming', difficulty: 'Medium', link: 'https://leetcode.com/problems/longest-increasing-subsequence/', category: 'Dynamic Programming' },
  { title: 'Edit Distance', pattern: 'Dynamic Programming', difficulty: 'Hard', link: 'https://leetcode.com/problems/edit-distance/', category: 'Dynamic Programming' }
];

const DsaSheetsView = ({ navigate, user, onLogout }) => {
  const [activeSheet, setActiveSheet] = useState('striver'); // 'striver', 'cses', 'fraz'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [addingProblemTitle, setAddingProblemTitle] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const currentProblems = activeSheet === 'striver'
    ? STRIVER_A2Z_PROBLEMS
    : activeSheet === 'cses'
    ? CSES_PROBLEMS
    : FRAZ_SDE_PROBLEMS;

  const filteredProblems = currentProblems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.step && p.step.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.section && p.section.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDiff = selectedDifficulty === 'all' || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
    return matchesSearch && matchesDiff;
  });

  const handleAddToLibrary = async (prob) => {
    setAddingProblemTitle(prob.title);
    setToastMsg('');
    try {
      await api.createProblem({
        name: prob.title,
        link: prob.link,
        pattern: prob.pattern,
        difficulty: prob.difficulty,
        notes: `Added from ${activeSheet === 'striver' ? "Striver's A2Z Sheet" : activeSheet === 'cses' ? "CSES Sheet" : "Fraz's SDE Sheet"}.`
      });
      setToastMsg(`✓ "${prob.title}" saved to your AlgoRevis library!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      if (err.message && err.message.includes('already')) {
        setToastMsg(`ℹ "${prob.title}" is already in your revision library.`);
      } else {
        setToastMsg(`Error: ${err.message || 'Could not save'}`);
      }
      setTimeout(() => setToastMsg(''), 4000);
    } finally {
      setAddingProblemTitle('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body pb-20 text-left">
      {/* Top Header */}
      <AppHeader
        currentView="sheets"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        customTitle="DSA Curated Sheets"
      />

      {/* Sub Navigation Bar */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-2.5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('revision_dashboard')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center gap-1"
          >
            ← Revision Mode
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-400 text-base">dataset</span>
            <span className="font-headline font-bold text-sm text-white">Curated Sheets Library</span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          <button 
            onClick={() => navigate('mock_tests')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            Mock Tests
          </button>
          <button 
            onClick={() => navigate('daily_challenge', { mode: 'random' })}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
          >
            🎲 Practice Workspace
          </button>
        </nav>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/60 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400 mb-1 block">
              Curated Master Tracks
            </span>
            <h1 className="text-3xl font-headline font-extrabold text-white">
              Striver, CSES &amp; Fraz DSA Sheets
            </h1>
            <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Explore the gold-standard problem collections used by top software engineers. Click <strong className="text-indigo-300">"Add to Revision"</strong> to instantly import any problem into your personal spaced-repetition revision queue.
            </p>
          </div>

          <button
            onClick={() => navigate('add_problem')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add Custom Problem
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="text-emerald-400 hover:text-white text-sm">✕</button>
          </div>
        )}

        {/* Sheet Selector Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveSheet('striver')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSheet === 'striver'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">auto_stories</span>
            <span>Striver's A2Z DSA Sheet ({STRIVER_A2Z_PROBLEMS.length})</span>
          </button>

          <button
            onClick={() => setActiveSheet('cses')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSheet === 'cses'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">code</span>
            <span>CSES Problem Set ({CSES_PROBLEMS.length})</span>
          </button>

          <button
            onClick={() => setActiveSheet('fraz')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSheet === 'fraz'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">stars</span>
            <span>Fraz's SDE Sheet ({FRAZ_SDE_PROBLEMS.length})</span>
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <span className="material-symbols-outlined text-slate-400 text-base">search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search problem, pattern, or step..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-semibold">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Problems List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProblems.map((prob, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-sm transition flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    prob.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40' :
                    prob.difficulty === 'Hard' ? 'bg-rose-950 text-rose-400 border border-rose-800/40' :
                    'bg-amber-950 text-amber-400 border border-amber-800/40'
                  }`}>
                    {prob.difficulty}
                  </span>

                  <span className="text-[11px] font-mono text-slate-400">
                    {prob.step || prob.section || prob.category || prob.pattern}
                  </span>
                </div>

                <h3 className="font-headline font-bold text-white text-base">
                  {prob.title}
                </h3>
                <p className="text-xs font-mono text-indigo-400 mt-1">
                  Pattern: {prob.pattern}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/70">
                <a
                  href={prob.link}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  <span>Solve on Platform</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToLibrary(prob)}
                    disabled={addingProblemTitle === prob.title}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg transition border border-indigo-900/40 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-xs">bookmark_add</span>
                    <span>{addingProblemTitle === prob.title ? 'Saving...' : 'Add to Revision'}</span>
                  </button>

                  <button
                    onClick={() => navigate('daily_challenge', { mode: 'random' })}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow"
                  >
                    Practice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProblems.length === 0 && (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <span className="material-symbols-outlined text-slate-500 text-4xl">search_off</span>
            <p className="text-sm text-slate-400">No problems found matching "{searchTerm}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DsaSheetsView;
