const mongoose = require('mongoose');

const PendingRegistrationSchema = new mongoose.Schema({
  registrationToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  // Email verification state
  emailOtpHash: {
    type: String,
    default: null
  },
  emailOtpExpires: {
    type: Date,
    default: null
  },
  emailOtpAttempts: {
    type: Number,
    default: 0
  },
  emailOtpLastSentAt: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  // Phone verification state
  phoneVerificationSid: {
    type: String,
    default: null
  },
  phoneOtpHash: {
    type: String,
    default: null
  },
  phoneOtpExpires: {
    type: Date,
    default: null
  },
  phoneOtpAttempts: {
    type: Number,
    default: 0
  },
  phoneOtpLastSentAt: {
    type: Date,
    default: null
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 1800 // Automatically purge uncompleted sessions after 30 minutes
  }
});

module.exports = mongoose.model('PendingRegistration', PendingRegistrationSchema);
