const express = require('express');
const router = express.Router();
const DailyChallenge = require('../models/DailyChallenge');
const Problem = require('../models/Problem');
const PracticeAttempt = require('../models/PracticeAttempt');
const AIGeneratedQuestion = require('../models/AIGeneratedQuestion');
const DeliveryRecord = require('../models/DeliveryRecord');
const { requireAuth } = require('../middleware/auth');
const { getOrCreateDailyChallenge, simulateDailyDelivery, getLocalDateString } = require('../services/scheduler');
const { recordProblemRevision } = require('../services/revisionService');
const { runCode, evaluateTestCases } = require('../services/codeExecutionService');
const { generateSimilarQuestion, PATTERN_QUESTIONS_CATALOG } = require('../services/aiService');

router.use(requireAuth);

const normalizeUrl = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

/**
 * Collects all unique URL links for problems saved by this user with the same name across folders
 */
async function resolveAllLinksForQuestion(userId, problemName, primaryProblem = null) {
  if (!problemName) return [];
  const trimmed = problemName.trim();
  const sameNameProblems = await Problem.find({
    user: userId,
    name: { $regex: new RegExp(`^\\s*${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }
  });

  const allLinks = [];
  const seenUrls = new Set();

  if (primaryProblem && primaryProblem.link && primaryProblem.link.trim()) {
    const norm = normalizeUrl(primaryProblem.link);
    seenUrls.add(norm);
    allLinks.push({
      title: primaryProblem.name || primaryProblem.title || trimmed,
      link: primaryProblem.link.trim(),
      pattern: primaryProblem.pattern || 'General',
      difficulty: primaryProblem.difficulty || 'Medium',
      problemId: primaryProblem.problemId || primaryProblem._id
    });
  }

  for (const p of sameNameProblems) {
    if (p.link && p.link.trim()) {
      const norm = normalizeUrl(p.link);
      if (!seenUrls.has(norm)) {
        seenUrls.add(norm);
        allLinks.push({
          title: p.name,
          link: p.link.trim(),
          pattern: p.pattern,
          difficulty: p.difficulty,
          problemId: p._id
        });
      }
    }
  }

  return allLinks;
}

// GET /api/challenges/today - Fetch or initialize today's scheduled challenge
router.get('/today', async (req, res) => {
  try {
    const tz = req.user.deliveryPreferences?.timezone || 'UTC';
    const todayStr = getLocalDateString(tz);
    const challenge = await getOrCreateDailyChallenge(req.user, todayStr);
    const challengeObj = challenge.toObject ? challenge.toObject() : challenge;
    if (challengeObj.questionA) {
      challengeObj.questionA.allLinks = await resolveAllLinksForQuestion(
        req.user._id,
        challengeObj.questionA.title || challengeObj.questionA.name,
        challengeObj.questionA
      );
    }
    res.status(200).json(challengeObj);
  } catch (error) {
    console.error('Error fetching today challenge:', error);
    res.status(500).json({ message: 'Error retrieving daily challenge' });
  }
});

// GET /api/challenges/random - Fetch a saved question (or specific problem) and create a unified practice workspace session
router.get('/random', async (req, res) => {
  try {
    const { folder, excludeId, problemId } = req.query;

    let selectedProblem = null;
    if (problemId) {
      selectedProblem = await Problem.findOne({ _id: problemId, user: req.user._id });
    }

    let userProblems = [];
    if (!selectedProblem) {
      // Filter problems strictly for the authenticated user
      const query = { user: req.user._id };
      if (folder && folder !== 'all' && folder.trim() !== '') {
        query.pattern = folder.trim();
      }

      userProblems = await Problem.find(query).sort({ createdAt: -1 });

      if (!userProblems || userProblems.length === 0) {
        const distinctFolders = await Problem.distinct('pattern', { user: req.user._id });
        return res.status(404).json({
          message: folder && folder !== 'all'
            ? `No questions found in folder "${folder}". Please select another folder or save questions first.`
            : 'You have not saved any coding questions yet. Save questions in folders to practice!',
          folders: distinctFolders
        });
      }

      // Non-repeating selection: avoid immediately picking the same question when alternatives exist
      let eligible = userProblems;
      if (excludeId && userProblems.length > 1) {
        eligible = userProblems.filter(p => p._id.toString() !== excludeId);
        if (eligible.length === 0) {
          eligible = userProblems;
        }
      }

      const randomIndex = Math.floor(Math.random() * eligible.length);
      selectedProblem = eligible[randomIndex];
    }

    // Collect all links for problems sharing the same name
    const allLinks = await resolveAllLinksForQuestion(req.user._id, selectedProblem.name, selectedProblem);

    // Check if we have pre-validated sample test cases for this pattern from catalog
    const patternCatalog = PATTERN_QUESTIONS_CATALOG[selectedProblem.pattern] || PATTERN_QUESTIONS_CATALOG['General'];
    const sampleTests = patternCatalog?.testCases || [
      { input: '[]', expectedOutput: '' }
    ];

    // Generate an initial similar challenge tailored to the selected problem
    const initialAiQuestion = await generateSimilarQuestion(
      selectedProblem.pattern || 'General',
      selectedProblem.difficulty || 'Medium',
      selectedProblem.name
    );

    const practiceId = `practice_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const practiceChallenge = new DailyChallenge({
      user: req.user._id,
      challengeType: 'random_practice',
      scheduledDate: practiceId,
      questionA: {
        problemId: selectedProblem._id,
        name: selectedProblem.name,
        title: selectedProblem.name,
        description: selectedProblem.description || selectedProblem.notes || 'No description recorded. Click the LeetCode link to view full problem description.',
        link: selectedProblem.link || '',
        allLinks: allLinks,
        pattern: selectedProblem.pattern || 'General',
        difficulty: selectedProblem.difficulty || 'Medium',
        notes: selectedProblem.notes || '',
        testCases: sampleTests,
        completed: false,
        source: 'saved'
      },
      questionB: {
        sourceQuestionId: selectedProblem._id,
        title: initialAiQuestion.title,
        statement: initialAiQuestion.statement,
        inputFormat: initialAiQuestion.inputFormat || 'Standard input format',
        outputFormat: initialAiQuestion.outputFormat || 'Standard output format',
        difficulty: initialAiQuestion.difficulty || selectedProblem.difficulty || 'Medium',
        pattern: initialAiQuestion.pattern || selectedProblem.pattern || 'General',
        constraints: initialAiQuestion.constraints || [],
        examples: initialAiQuestion.examples || [],
        starterCode: initialAiQuestion.starterCode || {},
        testCases: initialAiQuestion.testCases || [],
        hiddenTestCases: initialAiQuestion.hiddenTestCases || [],
        referenceSolution: initialAiQuestion.referenceSolution || '',
        explanation: initialAiQuestion.explanation || '',
        completed: false,
        source: 'ai'
      }
    });

    await practiceChallenge.save();

    const distinctFolders = await Problem.distinct('pattern', { user: req.user._id });

    const challengePayload = practiceChallenge.toObject ? practiceChallenge.toObject() : practiceChallenge;
    if (challengePayload.questionA) {
      challengePayload.questionA.allLinks = allLinks;
    }

    res.status(200).json({
      challenge: challengePayload,
      selectedProblem,
      folders: distinctFolders,
      totalSaved: userProblems.length
    });
  } catch (error) {
    console.error('Error fetching random practice challenge:', error);
    res.status(500).json({ message: 'Error retrieving random question: ' + error.message });
  }
});

// POST /api/challenges/generate-similar - Generate an original AI question inspired by the selected saved question
router.post('/generate-similar', async (req, res) => {
  try {
    const { challengeId, sourceQuestionId, targetDifficulty } = req.body;

    if (!challengeId) {
      return res.status(400).json({ message: 'challengeId is required' });
    }

    const challenge = await DailyChallenge.findOne({ _id: challengeId, user: req.user._id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge session not found or unauthorized' });
    }

    // Resolve source problem
    let sourceProblem = null;
    if (sourceQuestionId) {
      sourceProblem = await Problem.findOne({ _id: sourceQuestionId, user: req.user._id });
    }
    if (!sourceProblem && challenge.questionA?.problemId) {
      sourceProblem = await Problem.findOne({ _id: challenge.questionA.problemId, user: req.user._id });
    }

    const pattern = sourceProblem?.pattern || challenge.questionA?.pattern || 'General';
    const difficulty = targetDifficulty || sourceProblem?.difficulty || challenge.questionA?.difficulty || 'Medium';
    const baseName = sourceProblem?.name || challenge.questionA?.name || pattern;

    // Call AI generation service with sandbox validation and 5+ test cases
    const aiQuestion = await generateSimilarQuestion(
      pattern,
      difficulty,
      baseName,
      challenge.questionB?.title || ''
    );

    if (!aiQuestion || !aiQuestion.title || !aiQuestion.statement) {
      return res.status(500).json({ message: 'Failed to generate a valid AI challenge. Please click retry.' });
    }

    // Persist to permanent AIGeneratedQuestion collection
    const savedAiQuestion = new AIGeneratedQuestion({
      user: req.user._id,
      sourceQuestionId: sourceProblem?._id || challenge.questionA?.problemId || challenge._id,
      title: aiQuestion.title,
      problemStatement: aiQuestion.statement,
      inputFormat: aiQuestion.inputFormat || 'Standard input format',
      outputFormat: aiQuestion.outputFormat || 'Standard output format',
      constraints: aiQuestion.constraints || [],
      examples: aiQuestion.examples || [],
      difficulty: aiQuestion.difficulty || difficulty,
      algorithmicPattern: aiQuestion.pattern || pattern,
      starterCode: aiQuestion.starterCode || {},
      testCases: aiQuestion.testCases || [],
      hiddenTestCases: aiQuestion.hiddenTestCases || [],
      referenceSolution: aiQuestion.referenceSolution || '',
      explanation: aiQuestion.explanation || ''
    });

    await savedAiQuestion.save();

    // Reset user draft for Question B so new problem gets fresh starter code
    if (challenge.userDrafts) {
      challenge.userDrafts.questionB = {
        code: '',
        language: 'javascript',
        updatedAt: null
      };
    }

    // Update Question B on the challenge workspace document
    challenge.questionB = {
      sourceQuestionId: sourceProblem?._id || challenge.questionA?.problemId,
      title: aiQuestion.title,
      statement: aiQuestion.statement,
      inputFormat: aiQuestion.inputFormat || 'Standard input format',
      outputFormat: aiQuestion.outputFormat || 'Standard output format',
      difficulty: aiQuestion.difficulty || difficulty,
      pattern: aiQuestion.pattern || pattern,
      constraints: aiQuestion.constraints || [],
      examples: aiQuestion.examples || [],
      starterCode: aiQuestion.starterCode || {},
      testCases: aiQuestion.testCases || [],
      hiddenTestCases: aiQuestion.hiddenTestCases || [],
      referenceSolution: aiQuestion.referenceSolution || '',
      explanation: aiQuestion.explanation || '',
      completed: false,
      source: 'ai'
    };

    await challenge.save();

    res.status(200).json({
      message: 'AI challenge generated successfully',
      challenge,
      aiQuestion
    });
  } catch (error) {
    console.error('Error in generate-similar route:', error);
    res.status(500).json({ message: 'Error generating similar AI question: ' + error.message });
  }
});

// GET /api/challenges/practice-history - Fetch practice submissions and completed challenges
router.get('/practice-history', async (req, res) => {
  try {
    const attempts = await PracticeAttempt.find({ user: req.user._id })
      .sort({ timestamp: -1 })
      .limit(60);

    const completedChallenges = await DailyChallenge.find({
      user: req.user._id,
      $or: [{ 'questionA.completed': true }, { 'questionB.completed': true }]
    })
      .sort({ updatedAt: -1 })
      .limit(30);

    res.status(200).json({ attempts, completedChallenges });
  } catch (error) {
    console.error('Error fetching practice history:', error);
    res.status(500).json({ message: 'Error retrieving practice history' });
  }
});

// GET /api/challenges/:id - Fetch a specific challenge by ID (for notification deep links)
router.get('/:id', async (req, res) => {
  try {
    const challenge = await DailyChallenge.findOne({ _id: req.params.id, user: req.user._id });
    if (!challenge) {
      return res.status(404).json({ message: 'Daily challenge not found or unauthorized' });
    }
    const challengeObj = challenge.toObject ? challenge.toObject() : challenge;
    if (challengeObj.questionA) {
      challengeObj.questionA.allLinks = await resolveAllLinksForQuestion(
        req.user._id,
        challengeObj.questionA.title || challengeObj.questionA.name,
        challengeObj.questionA
      );
    }
    res.status(200).json(challengeObj);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge' });
  }
});

// POST /api/challenges/run-code - Execute code against custom or sample input in isolated sandbox
router.post('/run-code', async (req, res) => {
  try {
    const { code, language = 'javascript', customInput = '' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Code is required' });
    }

    const execResult = await runCode({
      code,
      language,
      input: customInput
    });

    res.status(200).json(execResult);
  } catch (error) {
    res.status(500).json({ message: 'Sandbox execution error: ' + error.message });
  }
});

// POST /api/challenges/submit-code - Evaluate submission against configured test cases
router.post('/submit-code', async (req, res) => {
  try {
    const { challengeId, questionType = 'B', code, language = 'javascript', customInput = '' } = req.body;

    if (!challengeId || !code) {
      return res.status(400).json({ message: 'challengeId and code are required' });
    }

    const challenge = await DailyChallenge.findOne({ _id: challengeId, user: req.user._id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found or unauthorized' });
    }

    const qKey = questionType === 'A' ? 'questionA' : 'questionB';
    const targetQ = challenge[qKey];

    // Combine sample test cases and hidden test cases
    const testCases = [...(targetQ.testCases || []), ...(targetQ.hiddenTestCases || [])];

    let evaluation = null;
    let isSuccess = false;

    if (testCases.length > 0) {
      evaluation = await evaluateTestCases({
        code,
        language,
        testCases
      });
      isSuccess = evaluation.allPassed;
    } else {
      // For questions without pre-set test cases, execute code to verify syntax/runtime success
      const runRes = await runCode({ code, language, input: customInput || '' });
      isSuccess = !runRes.error && runRes.stdout !== undefined;
      evaluation = {
        allPassed: isSuccess,
        passedCount: isSuccess ? 1 : 0,
        totalCount: 1,
        results: [{
          testCaseIndex: 1,
          passed: isSuccess,
          input: customInput || 'Default',
          output: runRes.stdout || '',
          expected: 'Valid execution',
          error: runRes.error,
          executionTimeMs: runRes.executionTimeMs
        }]
      };
    }

    // Save individual attempt in PracticeAttempt model
    const attempt = new PracticeAttempt({
      user: req.user._id,
      challengeId: challenge._id,
      questionType,
      questionSource: questionType === 'A' ? (targetQ.source || 'saved') : 'ai',
      questionId: questionType === 'A' ? targetQ.problemId : targetQ.sourceQuestionId,
      questionTitle: targetQ.title || targetQ.name || 'Coding Challenge',
      pattern: targetQ.pattern || 'General',
      difficulty: targetQ.difficulty || 'Medium',
      language,
      code,
      submissionStatus: isSuccess ? 'passed' : 'failed',
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      executionResult: evaluation,
      timestamp: new Date()
    });
    await attempt.save();

    // Record submission inside challenge document
    challenge.submissions.push({
      questionType,
      questionSource: questionType === 'A' ? (targetQ.source || 'saved') : 'ai',
      sourceQuestionId: questionType === 'A' ? targetQ.problemId : targetQ.sourceQuestionId,
      language,
      code,
      status: isSuccess ? 'passed' : 'failed',
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      details: `${evaluation.passedCount}/${evaluation.totalCount} tests passed`,
      executionResult: evaluation,
      submittedAt: new Date()
    });

    // Mark completed if all test cases passed
    if (isSuccess) {
      targetQ.completed = true;
      targetQ.completedAt = new Date();

      if (questionType === 'A' && targetQ.problemId) {
        await recordProblemRevision(targetQ.problemId, 4);
      }
    }

    await challenge.save();

    res.status(200).json({
      allPassed: isSuccess,
      passedCount: evaluation.passedCount,
      totalCount: evaluation.totalCount,
      results: evaluation.results.map((r, i) => ({
        testCaseIndex: r.testCaseIndex,
        passed: r.passed,
        // Only reveal sample inputs/outputs; hide confidential edge cases
        input: i < 2 ? r.input : '[Hidden Test Case]',
        output: i < 2 ? r.output : (r.passed ? 'Passed' : 'Failed'),
        expected: i < 2 ? r.expected : '[Hidden Test Case]',
        error: r.error,
        executionTimeMs: r.executionTimeMs
      })),
      completed: targetQ.completed
    });
  } catch (error) {
    console.error('Submission evaluation error:', error);
    res.status(500).json({ message: 'Error evaluating code: ' + error.message });
  }
});

// POST /api/challenges/save-draft - Save in-progress draft code in MongoDB
router.post('/save-draft', async (req, res) => {
  try {
    const { challengeId, questionType = 'B', code, language = 'javascript' } = req.body;

    const challenge = await DailyChallenge.findOne({ _id: challengeId, user: req.user._id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const draftKey = questionType === 'A' ? 'questionA' : 'questionB';
    challenge.userDrafts[draftKey] = {
      code,
      language,
      updatedAt: new Date()
    };

    await challenge.save();
    res.status(200).json({ message: 'Draft saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving draft' });
  }
});

// POST /api/challenges/reveal-solution - Reveal solution only after an attempt or completion
router.post('/reveal-solution', async (req, res) => {
  try {
    const { challengeId, questionType = 'B' } = req.body;

    const challenge = await DailyChallenge.findOne({ _id: challengeId, user: req.user._id });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const hasAttempted = challenge.submissions.some(s => s.questionType === questionType);
    const isCompleted = challenge[questionType === 'A' ? 'questionA' : 'questionB'].completed;

    if (!hasAttempted && !isCompleted) {
      return res.status(403).json({ message: 'Please attempt the problem with at least one Run or Submit before revealing the reference solution.' });
    }

    res.status(200).json({
      referenceSolution: challenge.questionB.referenceSolution,
      explanation: challenge.questionB.explanation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving solution' });
  }
});

// POST /api/challenges/simulate - Dev trigger for instant generation & delivery
router.post('/simulate', async (req, res) => {
  try {
    const simulationResult = await simulateDailyDelivery(req.user, req.body || {});
    res.status(200).json({
      message: 'Daily challenge generated and delivered successfully',
      ...simulationResult
    });
  } catch (error) {
    res.status(500).json({ message: 'Error simulating daily delivery: ' + error.message });
  }
});

// GET /api/challenges/history - Past challenges and delivery records
router.get('/history/all', async (req, res) => {
  try {
    const challenges = await DailyChallenge.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(14);
    const deliveryLogs = await DeliveryRecord.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ challenges, deliveryLogs });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge history' });
  }
});

module.exports = router;
