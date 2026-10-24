const mongoose = require('mongoose');

const PracticeAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyChallenge',
    index: true
  },
  questionType: {
    type: String,
    enum: ['A', 'B'],
    required: true
  },
  questionSource: {
    type: String,
    enum: ['saved', 'ai'],
    required: true,
    index: true
  },
  questionId: {
    type: mongoose.Schema.Types.Mixed
  },
  questionTitle: {
    type: String,
    required: true
  },
  pattern: {
    type: String,
    default: 'General'
  },
  difficulty: {
    type: String,
    default: 'Medium'
  },
  language: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  submissionStatus: {
    type: String,
    enum: ['passed', 'failed', 'error'],
    required: true,
    index: true
  },
  passedCount: {
    type: Number,
    default: 0
  },
  totalCount: {
    type: Number,
    default: 0
  },
  executionResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

PracticeAttemptSchema.index({ user: 1, timestamp: -1 });
PracticeAttemptSchema.index({ user: 1, questionSource: 1 });

module.exports = mongoose.model('PracticeAttempt', PracticeAttemptSchema);
