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
