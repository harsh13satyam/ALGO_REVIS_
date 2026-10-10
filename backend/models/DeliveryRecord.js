const mongoose = require('mongoose');

const DeliveryRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyChallenge',
    index: true
  },
  channel: {
    type: String,
    enum: ['email', 'whatsapp'],
    required: true,
    index: true
  },
  recipient: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'failed', 'mock_sent'],
    required: true,
    index: true
  },
  subjectOrSummary: {
    type: String,
    default: ''
  },
  providerMessageId: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

DeliveryRecordSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('DeliveryRecord', DeliveryRecordSchema);
