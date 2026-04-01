const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  link: {
    type: String
  },
  pattern: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  notes: {
    type: String
  },
  imageBase64: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Problem', ProblemSchema);
