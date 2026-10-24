const mongoose = require('mongoose');

const DailyChallengeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challengeType: {
    type: String,
    enum: ['daily', 'random_practice'],
    default: 'daily',
    index: true
  },
  scheduledDate: {
    type: String, // Format: 'YYYY-MM-DD' for daily, or 'practice_<timestamp>_<id>' for random sessions
    required: true,
    index: true
  },
  questionA: {
    problemId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Problem'
    },
    name: {
      type: String,
      required: true
    },
    title: {
      type: String
    },
    description: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: ''
    },
    allLinks: [{
      title: String,
      link: String,
      pattern: String,
      difficulty: String,
      problemId: {
        type: mongoose.Schema.Types.Mixed
      }
    }],
    pattern: {
      type: String,
      default: 'General'
    },
    difficulty: {
      type: String,
      default: 'Medium'
    },
    notes: {
      type: String,
      default: ''
    },
    testCases: [{
      input: String,
      expectedOutput: String
    }],
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    source: {
      type: String,
      default: 'saved' // 'saved' or 'revision'
    }
  },
  questionB: {
    sourceQuestionId: {
      type: mongoose.Schema.Types.Mixed,
      ref: 'Problem'
    },
    title: {
      type: String,
      required: true
    },
    statement: {
      type: String,
      required: true
    },
    difficulty: {
      type: String,
      default: 'Medium'
    },
    pattern: {
      type: String,
      default: 'General'
    },
    inputFormat: {
      type: String,
      default: ''
    },
    outputFormat: {
      type: String,
      default: ''
    },
    constraints: [{
      type: String
    }],
    examples: [{
      input: String,
      output: String,
      explanation: String
    }],
    starterCode: {
      javascript: { type: String, default: '' },
      python: { type: String, default: '' },
      cpp: { type: String, default: '' }
    },
    testCases: [{
      input: String,
      expectedOutput: String
    }],
    hiddenTestCases: [{
      input: String,
      expectedOutput: String
    }],
    referenceSolution: {
      type: String,
      default: ''
    },
    explanation: {
      type: String,
      default: ''
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    },
    source: {
      type: String,
      default: 'ai'
    }
  },
  userDrafts: {
    questionA: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
      updatedAt: { type: Date, default: null }
    },
    questionB: {
      code: { type: String, default: '' },
      language: { type: String, default: 'javascript' },
      updatedAt: { type: Date, default: null }
    }
  },
  submissions: [{
    questionType: { type: String, enum: ['A', 'B'] },
    questionSource: { type: String, enum: ['saved', 'ai'] },
    sourceQuestionId: { type: mongoose.Schema.Types.Mixed },
    language: String,
    code: String,
    status: { type: String, enum: ['passed', 'failed', 'error'] },
    passedCount: Number,
    totalCount: Number,
    details: String,
    executionResult: mongoose.Schema.Types.Mixed,
    submittedAt: { type: Date, default: Date.now }
  }],
  aiSolvedCount: {
    type: Number,
    default: 0
  },
  deliveryStatus: {
    email: {
      status: {
        type: String,
        enum: ['disabled', 'pending', 'sent', 'delivered', 'failed', 'mock_sent'],
        default: 'pending'
      },
      sentAt: Date,
      messageId: String,
      error: String
    },
    whatsapp: {
      status: {
        type: String,
        enum: ['disabled', 'pending', 'sent', 'delivered', 'failed', 'mock_sent'],
        default: 'pending'
      },
      sentAt: Date,
      messageId: String,
      error: String
    }
  }
}, { timestamps: true });

DailyChallengeSchema.index({ user: 1, scheduledDate: 1 }, { unique: true });
DailyChallengeSchema.index({ user: 1, challengeType: 1 });

module.exports = mongoose.model('DailyChallenge', DailyChallengeSchema);
