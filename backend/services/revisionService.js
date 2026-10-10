const Problem = require('../models/Problem');

/**
 * Selects the optimal revision problem for Question A
 * Prioritizes overdue problems, weak/low-review topics, and harder difficulties.
 */
const selectRevisionProblem = async (user) => {
  const query = {
    $or: [
      { user: user._id },
      { userName: user.name }
    ]
  };

  const now = new Date();

  // 1. Look for overdue problems
  let candidate = await Problem.findOne({
    ...query,
    $or: [
      { nextReviewAt: { $lte: now } },
      { 'reviewStats.nextReviewDate': { $lte: now } }
    ]
  }).sort({
    nextReviewAt: 1,
    'reviewStats.reviewCount': 1,
    createdAt: 1
  });

  // 2. If no overdue problems, pick the problem reviewed furthest in the past (or never reviewed)
  if (!candidate) {
    candidate = await Problem.findOne(query).sort({
      nextReviewAt: 1,
      'reviewStats.lastReviewedAt': 1,
      createdAt: 1
    });
  }

  // 3. If user has no problems at all, seed a high-yield starter problem
  if (!candidate) {
    candidate = new Problem({
      user: user._id,
      userName: user.name,
      name: 'Two Sum (Two Pointers & Hash Map)',
      link: 'https://leetcode.com/problems/two-sum/',
      pattern: 'Hash Map & Two Pointers',
      difficulty: 'Easy',
      notes: 'Classic target-pair pattern. Store complement `target - num` in a hash table for O(N) lookup.',
      nextReviewAt: now,
      lastRevisedAt: null,
      reviewCount: 0,
      recallStatus: 'new',
      reviewStats: {
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewDate: now,
        intervalDays: 1,
        easeFactor: 2.5
      }
    });
    await candidate.save();
  }

  return candidate;
};

/**
 * Updates spaced repetition stats when a problem is revised
 */
const recordProblemRevision = async (problemId, performanceScore = 3) => {
  const problem = await Problem.findById(problemId);
  if (!problem) return null;

  const currentStats = problem.reviewStats || {
    reviewCount: 0,
    intervalDays: 1,
    easeFactor: 2.5
  };

  const count = (currentStats.reviewCount || 0) + 1;
  let interval = currentStats.intervalDays || 1;
  let ease = currentStats.easeFactor || 2.5;

  // Simplified SM-2 algorithm:
  // ease factor adjustment based on quality (1-5 scale, default 3)
  ease = Math.max(1.3, ease + (0.1 - (5 - performanceScore) * (0.08 + (5 - performanceScore) * 0.02)));

  if (count === 1) {
    interval = 1; // 1 day
  } else if (count === 2) {
    interval = 3; // 3 days
  } else {
    interval = Math.max(1, Math.round(interval * ease));
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);

  problem.nextReviewAt = nextDate;
  problem.lastRevisedAt = new Date();
  problem.reviewCount = count;
  problem.reviewStats = {
    reviewCount: count,
    lastReviewedAt: new Date(),
    nextReviewDate: nextDate,
    easeFactor: Number(ease.toFixed(2)),
    intervalDays: interval
  };

  await problem.save();
  return problem;
};

module.exports = {
  selectRevisionProblem,
  recordProblemRevision
};
