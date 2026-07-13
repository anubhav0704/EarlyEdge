import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    default: 'Dynamic Technical Interview'
  },
  scores: {
    technical: { type: Number, required: true },
    communication: { type: Number, required: true }
  },
  report: {
    type: String, // Holds html/text evaluation report
    required: true
  },
  techStack: {
    type: String,
    required: true
  },
  interests: [String],
  questionsAsked: {
    type: Number,
    required: true
  },
  chatHistory: [{
    question: String,
    answer: String,
    type: { type: String },
    timestamp: Number
  }],
  duration: {
    type: Number, // duration in minutes
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Interview', InterviewSchema);
