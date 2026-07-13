import mongoose from 'mongoose';

const VerificationTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    default: 'Premium Assessment'
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    required: true
  },
  history: [{
    question: String,
    userAnswer: String,
    isCorrect: Boolean,
    correct: String
  }],
  certificateId: {
    type: String,
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('VerificationTest', VerificationTestSchema);
