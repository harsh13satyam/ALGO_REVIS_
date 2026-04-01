const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// POST /api/problems - Create a new problem
router.post('/', async (req, res) => {
  try {
    const { userName, name, link, pattern, difficulty, notes, imageBase64 } = req.body;
    
    if (!userName || !name || !pattern) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newProblem = new Problem({
      userName,
      name,
      link,
      pattern,
      difficulty,
      notes,
      imageBase64
    });

    await newProblem.save();
    res.status(201).json({ message: 'Problem created successfully', problem: newProblem });
  } catch (error) {
    console.error('Error saving problem:', error);
    res.status(500).json({ message: 'Server error saving problem' });
  }
});

// GET /api/problems/:userName - Get all problems for a user
router.get('/:userName', async (req, res) => {
  try {
    const problems = await Problem.find({ userName: req.params.userName }).sort({ createdAt: -1 });
    res.status(200).json(problems);
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ message: 'Server error fetching problems' });
  }
});

// PUT /api/problems/folder/:userName/:oldPattern - Rename a folder
router.put('/folder/:userName/:oldPattern', async (req, res) => {
  try {
    const { userName, oldPattern } = req.params;
    const { newPattern } = req.body;

    if (!newPattern) {
      return res.status(400).json({ message: 'New folder name is required' });
    }

    const result = await Problem.updateMany(
      { userName, pattern: oldPattern },
      { $set: { pattern: newPattern } }
    );

    res.status(200).json({ message: 'Folder renamed successfully', modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ message: 'Server error renaming folder' });
  }
});

// DELETE /api/problems/folder/:userName/:pattern - Delete a folder and all its problems
router.delete('/folder/:userName/:pattern', async (req, res) => {
  try {
    const { userName, pattern } = req.params;

    const result = await Problem.deleteMany({ userName, pattern });

    res.status(200).json({ message: 'Folder deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ message: 'Server error deleting folder' });
  }
});

module.exports = router;
