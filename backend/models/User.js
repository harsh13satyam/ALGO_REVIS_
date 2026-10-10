const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 60
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    default: undefined
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  emailOTP: {
    type: String,
    default: null
  },
  emailOTPExpires: {
    type: Date,
    default: null
  },
  isPhoneVerified: {
    type: Boolean,
    default: true
  },
  phoneOTP: {
    type: String,
    default: null
  },
  phoneOTPExpires: {
    type: Date,
    default: null
  },
  otpAttempts: {
    type: Number,
    default: 0
  },
  otpLastRequestedAt: {
    type: Date,
    default: null
  },
  emailConsent: {
    type: Boolean,
    default: true
  },
  whatsappConsent: {
    type: Boolean,
    default: false
  },
  deliveryPreferences: {
    time: {
      type: String,
      default: '09:00' // HH:mm 24-hr format
    },
    timezone: {
      type: String,
      default: 'UTC' // IANA timezone format e.g. 'Asia/Kolkata'
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    whatsappEnabled: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Hash password before saving if modified
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  if (this.password === candidatePassword) return true;
  return bcrypt.compare(candidatePassword, this.password);
};

// Safe representation for frontend responses (never leaks password or OTPs)
UserSchema.methods.toSafeObject = function() {
  return {
    id: this._id,
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    emailConsent: this.emailConsent,
    whatsappConsent: this.whatsappConsent,
    deliveryPreferences: this.deliveryPreferences,
    createdAt: this.createdAt
  };
};

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: { phone: { $type: 'string' } }
  }
);

module.exports = mongoose.model('User', UserSchema);
