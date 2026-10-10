const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/**
 * Calculates next local calendar day timestamp using user's IANA timezone
 */
const getNextLocalCalendarDay = (timezone = 'UTC') => {
  try {
    const now = new Date();
    // Add 24 hours to schedule for the following calendar day
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return tomorrow;
  } catch {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
};

// POST /api/problems - Create a new problem with automated revision scheduling
router.post('/', async (req, res) => {
  try {
    const {
      name,
      title,
      link,
      url,
      description,
      pattern,
      topic,
      difficulty,
      notes,
      imageBase64
    } = req.body;

    const problemName = (name || title || '').trim();
    const problemPattern = (pattern || topic || '').trim();
    const problemLink = (link || url || '').trim();

    if (!problemName || !problemPattern) {
      return res.status(400).json({ message: 'Problem title and topic/pattern are required' });
    }

    // Duplicate prevention:
    // If a URL link is provided, only reject if the exact same link has already been saved by this user.
    // If no link is provided, reject if the exact same name already exists in the same folder.
    let existing = null;
    if (problemLink) {
      existing = await Problem.findOne({
        user: req.user._id,
        link: problemLink
      });
    } else {
      existing = await Problem.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${problemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        pattern: problemPattern
      });
    }

    if (existing) {
      return res.status(409).json({
        message: 'This exact problem URL / link is already in your revision library',
        problem: existing
      });
    }

    // Schedule first revision for the following local calendar day
    const userTz = req.user.deliveryPreferences?.timezone || 'UTC';
    const nextReview = getNextLocalCalendarDay(userTz);

    const newProblem = new Problem({
      user: req.user._id,
      userName: req.user.name,
      name: problemName,
      link: problemLink,
      description: description || '',
      pattern: problemPattern,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      notes: notes || '',
      imageBase64: imageBase64 || '',
      nextReviewAt: nextReview,
      lastRevisedAt: null,
      reviewCount: 0,
      recallStatus: 'new',
      reviewStats: {
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewDate: nextReview,
        intervalDays: 1,
        easeFactor: 2.5
      }
    });

    await newProblem.save();
    res.status(201).json({ message: 'Problem saved and scheduled for tomorrow!', problem: newProblem });
  } catch (error) {
    console.error('Error saving problem:', error);
    res.status(500).json({ message: 'Server error saving problem: ' + error.message });
  }
});

// GET /api/problems - Get all problems for the authenticated user
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching problems' });
  }
});

// GET /api/problems/queue/due - Get currently due and overdue problems for revision
router.get('/queue/due', async (req, res) => {
  try {
    const now = new Date();
    const dueProblems = await Problem.find({
      user: req.user._id,
      nextReviewAt: { $lte: now }
    }).sort({ nextReviewAt: 1 });

    res.status(200).json(dueProblems);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching due problems' });
  }
});

// GET /api/problems/:identifier - Backward compatibility for username route
router.get('/:identifier', async (req, res) => {
  try {
    const problems = await Problem.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching problems' });
  }
});

// PUT /api/problems/:id - Edit an individual problem
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, link, description, pattern, difficulty, notes } = req.body;

    const problem = await Problem.findOne({ _id: id, user: req.user._id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found or unauthorized' });
    }

    if (name) problem.name = name.trim();
    if (link !== undefined) problem.link = link.trim();
    if (description !== undefined) problem.description = description;
    if (pattern) problem.pattern = pattern.trim();
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) problem.difficulty = difficulty;
    if (notes !== undefined) problem.notes = notes;

    await problem.save();
    res.status(200).json({ message: 'Problem updated successfully', problem });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating problem' });
  }
});

// DELETE /api/problems/:id - Delete an individual problem
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Problem.deleteOne({ _id: id, user: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Problem not found or unauthorized' });
    }

    res.status(200).json({ message: 'Problem deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting problem' });
  }
});

// PUT /api/problems/folder/:userName/:oldPattern - Bulk rename folder
router.put(['/folder/:userName/:oldPattern', '/folder/:oldPattern'], async (req, res) => {
  try {
    const oldPattern = req.params.oldPattern || req.params.userName;
    const { newPattern } = req.body;

    if (!newPattern || !newPattern.trim()) {
      return res.status(400).json({ message: 'New folder name is required' });
    }

    const result = await Problem.updateMany(
      { user: req.user._id, pattern: oldPattern },
      { $set: { pattern: newPattern.trim() } }
    );

    res.status(200).json({ message: 'Folder renamed successfully', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error renaming folder' });
  }
});

// DELETE /api/problems/folder/:userName/:pattern - Bulk delete folder
router.delete(['/folder/:userName/:pattern', '/folder/:pattern'], async (req, res) => {
  try {
    const pattern = req.params.pattern || req.params.userName;
    const result = await Problem.deleteMany({ user: req.user._id, pattern });
    res.status(200).json({ message: 'Folder deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting folder' });
  }
});

module.exports = router;
