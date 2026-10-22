const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Problem title/name is required'],
    trim: true
  },
  link: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  pattern: {
    type: String,
    required: [true, 'Pattern / Topic is required'],
    trim: true,
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  notes: {
    type: String,
    default: ''
  },
  imageBase64: {
    type: String,
    default: ''
  },
  nextReviewAt: {
    type: Date,
    required: true,
    default: () => new Date(),
    index: true
  },
  lastRevisedAt: {
    type: Date,
    default: null
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  recallStatus: {
    type: String,
    enum: ['new', 'learning', 'reviewing', 'mastered'],
    default: 'new'
  },
  // Backward compatibility object for existing frontend code
  reviewStats: {
    reviewCount: { type: Number, default: 0 },
    lastReviewedAt: { type: Date, default: null },
    nextReviewDate: { type: Date, default: Date.now },
    easeFactor: { type: Number, default: 2.5 },
    intervalDays: { type: Number, default: 1 }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Extension & solution fields
  platform: {
    type: String,
    enum: ['LeetCode', 'GeeksforGeeks', 'Codeforces', 'Other', ''],
    default: ''
  },
  problemId: {
    type: String,
    default: '',
    trim: true
  },
  language: {
    type: String,
    default: '',
    trim: true
  },
  code: {
    type: String,
    default: ''
  },
  approach: {
    type: String,
    default: '',
    trim: true
  },
  intuition: {
    type: String,
    default: ''
  },
  timeComplexity: {
    type: String,
    default: '',
    trim: true
  },
  spaceComplexity: {
    type: String,
    default: '',
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for query performance and data isolation
ProblemSchema.index({ user: 1, pattern: 1 });
ProblemSchema.index({ user: 1, nextReviewAt: 1 });
ProblemSchema.index({ user: 1, name: 1 });
ProblemSchema.index({ user: 1, link: 1 });
ProblemSchema.index({ user: 1, platform: 1, problemId: 1 });

module.exports = mongoose.model('Problem', ProblemSchema);
