import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['student', 'recruiter'],
    default: 'student'
  },
  phoneNumber: {
    type: String,
    default: '',
    unique: false
  },
  googleId: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  university: {
    type: String,
    default: ''
  },
  stream: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  tqScore: {
    type: Number,
    default: 500
  },
  rank: {
    type: Number,
    default: 1
  },
  squadId: {
    type: String,
    default: null
  },
  photoURL: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
