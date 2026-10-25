import React, { useState, useEffect } from 'react';
import api from './api';
import AppHeader from './AppHeader';

const MOCK_ASSESSMENTS = [
  {
    id: 'mock_1',
    title: 'FAANG SDE Core Assessment (Amazon / Google Style)',
    company: 'Amazon & Google',
    durationMinutes: 70,
    difficulty: 'Medium-Hard',
    description: 'A realistic 70-minute timed algorithmic assessment testing hash maps, sliding windows, and two-pointer container geometry.',
    problems: [
      {
        name: 'Two Sum Target Pair',
        difficulty: 'Easy',
        pattern: 'Hash Map & Arrays',
        link: 'https://leetcode.com/problems/two-sum/',
        statement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        sampleInput: 'nums = [2,7,11,15], target = 9',
        sampleOutput: '[0,1]'
      },
      {
        name: 'Longest Substring Without Repeating Characters',
        difficulty: 'Medium',
        pattern: 'Sliding Window',
        link: 'https://leetcode.com/problems/longest-substring-without-repeating-characters/',
        statement: 'Given a string s, find the length of the longest substring without repeating characters.',
        sampleInput: 's = "abcabcbb"',
        sampleOutput: '3'
      },
      {
        name: 'Container With Most Water',
        difficulty: 'Medium',
        pattern: 'Two Pointers',
        link: 'https://leetcode.com/problems/container-with-most-water/',
        statement: 'Find two vertical lines from an array of heights that hold the maximum amount of water with the x-axis.',
        sampleInput: 'height = [1,8,6,2,5,4,8,3,7]',
        sampleOutput: '49'
      }
    ]
  },
  {
    id: 'mock_2',
    title: 'Algorithmic Optimization & Binary Search (Uber / Microsoft)',
    company: 'Uber & Microsoft',
    durationMinutes: 75,
    difficulty: 'Medium',
    description: 'Tests your ability to recognize logarithmic time bounds, sorted array rotations, and contiguous subarray prefix sums.',
    problems: [
      {
        name: 'Search in Rotated Sorted Array',
        difficulty: 'Medium',
        pattern: 'Binary Search',
        link: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
        statement: 'Given an integer array nums sorted in ascending order and rotated at an unknown pivot, search for a target value in O(log n) time.',
        sampleInput: 'nums = [4,5,6,7,0,1,2], target = 0',
        sampleOutput: '4'
      },
      {
        name: 'Subarray Sum Equals K',
        difficulty: 'Medium',
        pattern: 'Hash Map & Prefix Sum',
        link: 'https://leetcode.com/problems/subarray-sum-equals-k/',
        statement: 'Given an array of integers nums and an integer k, return the total number of subarrays whose sum equals to k.',
        sampleInput: 'nums = [1,1,1], k = 2',
        sampleOutput: '2'
      },
      {
        name: 'Find Minimum in Rotated Sorted Array',
        difficulty: 'Medium',
        pattern: 'Binary Search',
        link: 'https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/',
        statement: 'Find the minimum element in a sorted rotated array in O(log n) time.',
        sampleInput: 'nums = [3,4,5,1,2]',
        sampleOutput: '1'
      }
    ]
  },
  {
    id: 'mock_3',
    title: 'Data Structures Deep Dive: Stack, Trees & Graphs (Meta / Atlassian)',
    company: 'Meta & Atlassian',
    durationMinutes: 60,
    difficulty: 'Medium-Hard',
    description: 'Assesses core computer science fundamentals: monotonic stacks, tree recursions, and connected component traversal.',
    problems: [
      {
        name: 'Valid Parentheses and Brackets Matcher',
        difficulty: 'Easy',
        pattern: 'Stack',
        link: 'https://leetcode.com/problems/valid-parentheses/',
        statement: 'Given a string containing just the characters "()[]{}", determine if the input string has properly matching brackets.',
        sampleInput: 's = "()[]{}"',
        sampleOutput: 'true'
      },
      {
        name: 'Number of Islands',
        difficulty: 'Medium',
        pattern: 'Graphs & BFS/DFS',
        link: 'https://leetcode.com/problems/number-of-islands/',
        statement: 'Given an m x n 2D binary grid grid which represents a map of "1"s (land) and "0"s (water), return the number of islands.',
        sampleInput: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
        sampleOutput: '2'
      },
      {
        name: 'Binary Tree Maximum Path Sum',
        difficulty: 'Hard',
        pattern: 'Trees & DFS',
        link: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
        statement: 'Return the maximum path sum of any non-empty path in a binary tree.',
        sampleInput: 'root = [-10,9,20,null,null,15,7]',
        sampleOutput: '42'
      }
    ]
  },
  {
    id: 'mock_4',
    title: 'Dynamic Programming & Subarray Sprint (Goldman Sachs / Bloomberg)',
    company: 'Goldman Sachs & Bloomberg',
    durationMinutes: 50,
    difficulty: 'Medium',
    description: 'Focused sprint on optimal substructure, overlapping subproblems, and state transitions.',
    problems: [
      {
        name: 'Maximum Subarray (Kadane\'s Algorithm)',
        difficulty: 'Medium',
        pattern: 'Dynamic Programming',
        link: 'https://leetcode.com/problems/maximum-subarray/',
        statement: 'Find the contiguous subarray with the largest sum and return its sum.',
        sampleInput: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        sampleOutput: '6'
      },
      {
        name: 'Coin Change (Fewest Coins)',
        difficulty: 'Medium',
        pattern: 'Dynamic Programming',
        link: 'https://leetcode.com/problems/coin-change/',
        statement: 'Return the fewest number of coins that you need to make up that amount.',
        sampleInput: 'coins = [1,2,5], amount = 11',
        sampleOutput: '3'
      },
      {
        name: 'Climbing Stairs with Minimum Cost',
        difficulty: 'Easy',
        pattern: 'Dynamic Programming',
        link: 'https://leetcode.com/problems/min-cost-climbing-stairs/',
        statement: 'Find minimum cost to reach the top of the floor taking 1 or 2 steps.',
        sampleInput: 'cost = [10,15,20]',
        sampleOutput: '15'
      }
    ]
  }
];

const MockTestsView = ({ navigate, user, onLogout }) => {
  const [selectedMock, setSelectedMock] = useState(null);
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [savedStatus, setSavedStatus] = useState({});

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const handleStartMock = (mock) => {
    setSelectedMock(mock);
    setActiveProblemIdx(0);
    setTimerSeconds(mock.durationMinutes * 60);
    setTimerActive(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveToLibrary = async (prob) => {
    try {
      await api.createProblem({
        name: prob.name,
        link: prob.link,
        pattern: prob.pattern,
        difficulty: prob.difficulty,
        notes: `Added from Mock Assessment: ${selectedMock ? selectedMock.title : 'DSA Mock Test'}.`
      });
      setSavedStatus(prev => ({ ...prev, [prob.name]: true }));
      setToastMsg(`✓ "${prob.name}" added to your revision library!`);
      setTimeout(() => setToastMsg(''), 4000);
    } catch (err) {
      if (err.message && err.message.includes('already')) {
        setToastMsg(`ℹ "${prob.name}" is already in your revision library.`);
      } else {
        setToastMsg(`Error: ${err.message || 'Could not save'}`);
      }
      setTimeout(() => setToastMsg(''), 4000);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const activeProblem = selectedMock?.problems[activeProblemIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-body pb-20 text-left">
      {/* Top Header */}
      <AppHeader
        currentView="mock_tests"
        navigate={navigate}
        user={user}
        onLogout={onLogout}
        customTitle="DSA Mock Assessments"
      />

      {/* Sub Navigation Bar for Test Actions & Timer */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-2.5 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (selectedMock) setSelectedMock(null);
              else navigate('revision_dashboard');
            }}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {selectedMock ? '← Exit Mock Test' : '← Revision Mode'}
          </button>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-purple-400 text-base">timer</span>
            <span className="font-headline font-bold text-sm text-white">
              {selectedMock ? selectedMock.title : 'Assessment Suite'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {timerActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 font-mono text-xs font-bold mr-2">
              <span className="material-symbols-outlined text-sm animate-pulse">hourglass_bottom</span>
              <span>Time Left: {formatTimer(timerSeconds)}</span>
            </div>
          )}

          <button 
            onClick={() => navigate('sheets')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            Sheets
          </button>
          <button 
            onClick={() => navigate('revision_dashboard')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            Revision Queue
          </button>
          <button 
            onClick={() => navigate('daily_challenge', { mode: 'random' })}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition"
          >
            🎲 Practice Workspace
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Toast */}
        {toastMsg && (
          <div className="bg-emerald-950/90 border border-emerald-800 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg('')} className="text-emerald-400 hover:text-white text-sm">✕</button>
          </div>
        )}

        {/* ACTIVE MOCK TEST RUNNER VIEW */}
        {selectedMock ? (
          <div className="space-y-6">
            {/* Header info card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 block mb-1">
                  Active Timed Assessment • {selectedMock.company}
                </span>
                <h1 className="text-2xl font-headline font-bold text-white">
                  {selectedMock.title}
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Question {activeProblemIdx + 1} of {selectedMock.problems.length} • Difficulty: {selectedMock.difficulty}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setTimerActive(prev => !prev)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  {timerActive ? '⏸ Pause Timer' : '▶ Resume Timer'}
                </button>
                <button
                  onClick={() => setSelectedMock(null)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow"
                >
                  End Assessment
                </button>
              </div>
            </div>

            {/* Problem Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-2">
              {selectedMock.problems.map((prob, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveProblemIdx(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeProblemIdx === idx
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>Q{idx + 1}: {prob.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    prob.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-300' :
                    prob.difficulty === 'Hard' ? 'bg-rose-950 text-rose-300' :
                    'bg-amber-950 text-amber-300'
                  }`}>
                    {prob.difficulty}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Problem Detail View */}
            {activeProblem && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h2 className="text-xl font-headline font-bold text-white">
                        {activeProblem.name}
                      </h2>
                      <span className="text-xs text-indigo-400 font-mono">
                        Pattern: {activeProblem.pattern}
                      </span>
                    </div>

                    <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${
                      activeProblem.difficulty === 'Easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      activeProblem.difficulty === 'Hard' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {activeProblem.difficulty}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Problem Statement</span>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                      {activeProblem.statement}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Example Test Case</span>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                      <div><strong className="text-indigo-400">Input:</strong> {activeProblem.sampleInput}</div>
                      <div><strong className="text-emerald-400">Output:</strong> {activeProblem.sampleOutput}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                    <a
                      href={activeProblem.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      <span>View on LeetCode</span>
                    </a>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveToLibrary(activeProblem)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-lg border border-indigo-900/40 transition flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">bookmark</span>
                        <span>{savedStatus[activeProblem.name] ? '✓ Saved' : 'Save to Revision'}</span>
                      </button>

                      <button
                        onClick={() => navigate('daily_challenge', { mode: 'random' })}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">code</span>
                        <span>Solve in Compiler Workspace</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Action Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                    <h3 className="font-headline font-bold text-white text-sm">Assessment Progress</h3>
                    <div className="space-y-2 text-xs">
                      {selectedMock.problems.map((p, i) => (
                        <div
                          key={i}
                          onClick={() => setActiveProblemIdx(i)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                            activeProblemIdx === i
                              ? 'bg-purple-950/40 border-purple-800 text-white'
                              : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>{i + 1}. {p.name}</span>
                          <span className="material-symbols-outlined text-sm">
                            {activeProblemIdx === i ? 'arrow_forward' : 'circle'}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (activeProblemIdx < selectedMock.problems.length - 1) {
                          setActiveProblemIdx(prev => prev + 1);
                        } else {
                          alert('Great job completing all questions in this mock assessment!');
                          setSelectedMock(null);
                        }
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow transition"
                    >
                      {activeProblemIdx < selectedMock.problems.length - 1 ? 'Next Question →' : 'Submit & Finish Mock Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* MOCK ASSESSMENTS DIRECTORY */
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-indigo-950/60 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-purple-400 mb-1 block">
                  Simulated Online Assessments
                </span>
                <h1 className="text-3xl font-headline font-extrabold text-white">
                  Full DSA Mock Tests
                </h1>
                <p className="text-xs text-slate-300 mt-2 max-w-2xl leading-relaxed">
                  Real company-style timed problem sets designed to test your problem recognition and algorithmic implementation under real interview pressure.
                </p>
              </div>

              <button
                onClick={() => navigate('daily_challenge', { mode: 'random' })}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-2 flex-shrink-0"
              >
                <span className="material-symbols-outlined text-sm">shuffle</span>
                Quick Practice Random Question
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {MOCK_ASSESSMENTS.map((mock) => (
                <div
                  key={mock.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-sm transition flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-purple-400 font-bold uppercase tracking-wider bg-purple-950/60 border border-purple-900/50 px-2 py-0.5 rounded">
                        {mock.company}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <span className="material-symbols-outlined text-sm text-slate-400">schedule</span>
                        <span>{mock.durationMinutes} Mins</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-headline font-bold text-white">
                      {mock.title}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {mock.description}
                    </p>

                    <div className="pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Problems Included:</span>
                      <ul className="space-y-1.5">
                        {mock.problems.map((p, idx) => (
                          <li key={idx} className="flex items-center justify-between text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800/80">
                            <span className="text-slate-300 font-medium truncate max-w-[220px]">{p.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-950' :
                              p.difficulty === 'Hard' ? 'text-rose-400 bg-rose-950' :
                              'text-amber-400 bg-amber-950'
                            }`}>
                              {p.difficulty}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      {mock.problems.length} Curated Questions
                    </span>

                    <button
                      onClick={() => handleStartMock(mock)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      <span>Start Timed Mock Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockTestsView;
