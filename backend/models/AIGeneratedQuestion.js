const mongoose = require('mongoose');

const AIGeneratedQuestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sourceQuestionId: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  problemStatement: {
    type: String,
    required: true
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
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  algorithmicPattern: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: true });

AIGeneratedQuestionSchema.index({ user: 1, sourceQuestionId: 1 });
AIGeneratedQuestionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AIGeneratedQuestion', AIGeneratedQuestionSchema);
