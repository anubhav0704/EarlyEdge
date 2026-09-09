import mongoose from 'mongoose';

const MockTestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  domain: {
    type: String,
    default: 'General Tech'
  },
  partAScore: {
    type: Number,
    default: 0
  },
  partBScore: {
    type: Number,
    default: 0
  },
  partCScore: {
    type: Number,
    default: 0
  },
  subjectiveAnswers: [{
    question: String,
    answer: String
  }],
  codeSubmitted: {
    type: String,
    default: ''
  },
  aiEvaluation: {
    aiSummary: String,
    partAEvaluation: String,
    partBEvaluation: String,
    partCEvaluation: String,
    recommendation: String
  },
  history: [{
    question: String,
    category: String,
    isCorrect: Boolean,
    userAnswer: String,
    correctAnswer: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('MockTest', MockTestSchema);
