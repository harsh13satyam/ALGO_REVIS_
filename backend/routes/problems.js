const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const { requireAuth } = require('../middleware/auth');
const { generateIntuitionFromCode } = require('../services/aiService');
const { uploadImage } = require('../services/cloudinaryService');

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

// POST /api/problems/generate-intuition - AI auto-generate intuition from code
router.post('/generate-intuition', async (req, res) => {
  try {
    const { code, language, title, pattern } = req.body;
    if (!code || !code.trim()) {
      return res.status(400).json({ message: 'Code is required to generate intuition' });
    }
    const result = await generateIntuitionFromCode({ code, language, title, pattern });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error generating intuition:', err);
    return res.status(500).json({ message: 'Failed to generate intuition: ' + err.message });
  }
});

// GET /api/problems/check - Check if problem is already saved by this user
router.get('/check', async (req, res) => {
  try {
    const { url, link, problemId, platform } = req.query;
    const targetUrl = (url || link || '').trim();
    const targetId = (problemId || '').trim();
    const targetPlatform = (platform || '').trim();

    let existing = null;
    if (targetUrl) {
      const cleanUrl = targetUrl.replace(/\/+$/, '');
      existing = await Problem.findOne({
        user: req.user._id,
        $or: [
          { link: targetUrl },
          { link: cleanUrl },
          { link: `${cleanUrl}/` }
        ]
      });
    }

    if (!existing && targetId && targetPlatform) {
      existing = await Problem.findOne({
        user: req.user._id,
        platform: targetPlatform,
        problemId: targetId
      });
    }

    if (existing) {
      return res.status(200).json({
        exists: true,
        problem: existing
      });
    }

    return res.status(200).json({
      exists: false,
      problem: null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error checking problem existence' });
  }
});

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
      imageBase64,
      platform,
      problemId,
      language,
      code,
      approach,
      intuition,
      timeComplexity,
      spaceComplexity,
      updateIfDuplicate
    } = req.body;

    const problemName = (name || title || '').trim();
    const problemPattern = (pattern || topic || approach || 'General').trim();
    const problemLink = (link || url || '').trim();
    const problemPlatform = (platform || '').trim();
    const cleanProblemId = (problemId || '').trim();

    if (!problemName) {
      return res.status(400).json({ message: 'Problem title/name is required' });
    }

    // Duplicate detection:
    let existing = null;
    if (problemLink) {
      const cleanUrl = problemLink.replace(/\/+$/, '');
      existing = await Problem.findOne({
        user: req.user._id,
        $or: [
          { link: problemLink },
          { link: cleanUrl },
          { link: `${cleanUrl}/` }
        ]
      });
    }

    if (!existing && cleanProblemId && problemPlatform) {
      existing = await Problem.findOne({
        user: req.user._id,
        platform: problemPlatform,
        problemId: cleanProblemId
      });
    }

    if (!existing && !problemLink) {
      existing = await Problem.findOne({
        user: req.user._id,
        name: { $regex: new RegExp(`^${problemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        pattern: problemPattern
      });
    }

    if (existing) {
      if (updateIfDuplicate) {
        existing.name = problemName;
        if (problemLink) existing.link = problemLink;
        if (problemPattern) existing.pattern = problemPattern;
        if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) existing.difficulty = difficulty;
        if (description !== undefined) existing.description = description;
        if (notes !== undefined) existing.notes = notes;
        if (imageBase64 !== undefined) {
          let updatedImageUrl = (imageBase64 || '').trim();
          if (updatedImageUrl && updatedImageUrl.startsWith('data:image/')) {
            try {
              const uploadRes = await uploadImage(updatedImageUrl, 'algorevis_problems');
              updatedImageUrl = uploadRes.url;
            } catch (imgErr) {
              console.warn('⚠️ [Cloudinary] Fallback to raw data on problem update:', imgErr.message);
            }
          }
          existing.imageBase64 = updatedImageUrl;
        }
        if (problemPlatform) existing.platform = problemPlatform;
        if (cleanProblemId) existing.problemId = cleanProblemId;
        if (language !== undefined) existing.language = language;
        if (code !== undefined) existing.code = code;
        if (approach !== undefined) existing.approach = approach;
        if (intuition !== undefined) existing.intuition = intuition;
        if (timeComplexity !== undefined) existing.timeComplexity = timeComplexity;
        if (spaceComplexity !== undefined) existing.spaceComplexity = spaceComplexity;
        existing.updatedAt = new Date();

        await existing.save();
        return res.status(200).json({
          message: 'Problem updated successfully!',
          problem: existing,
          isUpdate: true
        });
      }

      return res.status(409).json({
        message: 'This exact problem URL / link is already in your revision library',
        problem: existing
      });
    }

    // Schedule first revision for the following local calendar day
    const userTz = req.user.deliveryPreferences?.timezone || 'UTC';
    const nextReview = getNextLocalCalendarDay(userTz);

    // Auto-generate rich notes if notes field is empty but intuition/approach/complexity are provided
    let finalNotes = notes || '';
    if (!finalNotes) {
      const parts = [];
      if (approach) parts.push(`Approach: ${approach}`);
      if (intuition) parts.push(`Intuition: ${intuition}`);
      if (timeComplexity || spaceComplexity) {
        parts.push(`Complexity: Time ${timeComplexity || 'N/A'}, Space ${spaceComplexity || 'N/A'}`);
      }
      if (parts.length > 0) {
        finalNotes = parts.join('\n\n');
      }
    }

    // Convert image to Cloudinary CDN URL if data URI is provided
    let finalImageUrl = (imageBase64 || '').trim();
    if (finalImageUrl && finalImageUrl.startsWith('data:image/')) {
      try {
        const uploadRes = await uploadImage(finalImageUrl, 'algorevis_problems');
        finalImageUrl = uploadRes.url;
      } catch (imgErr) {
        console.warn('⚠️ [Cloudinary] Fallback to raw data URI on problem creation:', imgErr.message);
      }
    }

    const newProblem = new Problem({
      user: req.user._id,
      userName: req.user.name,
      name: problemName,
      link: problemLink,
      description: description || '',
      pattern: problemPattern,
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium',
      notes: finalNotes,
      imageBase64: finalImageUrl,
      platform: problemPlatform,
      problemId: cleanProblemId,
      language: language || '',
      code: code || '',
      approach: approach || '',
      intuition: intuition || '',
      timeComplexity: timeComplexity || '',
      spaceComplexity: spaceComplexity || '',
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

// GET /api/problems/:identifier - Single problem or backward compatibility for username route
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const problem = await Problem.findOne({ _id: identifier, user: req.user._id });
      if (problem) {
        return res.status(200).json(problem);
      }
    }
    const problems = await Problem.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching problems' });
  }
});

// Handler for editing an individual problem
const updateProblemHandler = async (req, res) => {
  try {
    const { id } = req.params;
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
      imageBase64,
      platform,
      problemId,
      language,
      code,
      approach,
      intuition,
      timeComplexity,
      spaceComplexity
    } = req.body;

    const problem = await Problem.findOne({ _id: id, user: req.user._id });
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found or unauthorized' });
    }

    if (name || title) problem.name = (name || title).trim();
    if (link !== undefined || url !== undefined) problem.link = (link !== undefined ? link : url).trim();
    if (description !== undefined) problem.description = description;
    if (pattern || topic) problem.pattern = (pattern || topic).trim();
    else if (approach && !problem.pattern) problem.pattern = approach.trim();

    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) problem.difficulty = difficulty;
    if (notes !== undefined) problem.notes = notes;
    if (imageBase64 !== undefined) {
      let updatedImageUrl = (imageBase64 || '').trim();
      if (updatedImageUrl && updatedImageUrl.startsWith('data:image/')) {
        try {
          const uploadRes = await uploadImage(updatedImageUrl, 'algorevis_problems');
          updatedImageUrl = uploadRes.url;
        } catch (imgErr) {
          console.warn('⚠️ [Cloudinary] Fallback to raw data URI on problem update:', imgErr.message);
        }
      }
      problem.imageBase64 = updatedImageUrl;
    }
    if (platform !== undefined) problem.platform = platform;
    if (problemId !== undefined) problem.problemId = problemId;
    if (language !== undefined) problem.language = language;
    if (code !== undefined) problem.code = code;
    if (approach !== undefined) problem.approach = approach;
    if (intuition !== undefined) problem.intuition = intuition;
    if (timeComplexity !== undefined) problem.timeComplexity = timeComplexity;
    if (spaceComplexity !== undefined) problem.spaceComplexity = spaceComplexity;
    problem.updatedAt = new Date();

    await problem.save();
    res.status(200).json({ message: 'Problem updated successfully', problem });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating problem' });
  }
};

// PUT & PATCH /api/problems/:id - Edit an individual problem
router.put('/:id', updateProblemHandler);
router.patch('/:id', updateProblemHandler);

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
