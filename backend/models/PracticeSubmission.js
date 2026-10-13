import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['Accepted', 'Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit Exceeded'], default: 'Accepted' },
  language: { type: String, default: 'python' },
  executionTime: { type: String, default: '0.04s' },
  memory: { type: String, default: '2.1 MB' },
  code: { type: String, default: '' }
}, { _id: false });

const practiceSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  problemId: {
    type: String,
    required: true,
    index: true
  },
  problemNumber: {
    type: Number,
    default: 1
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['dsa', 'sql', 'oops'],
    default: 'dsa',
    index: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
    index: true
  },
  topic: {
    type: String,
    default: 'General'
  },
  status: {
    type: String,
    enum: ['Solved', 'Attempted', 'Unsolved'],
    default: 'Attempted',
    index: true
  },
  acceptedCount: {
    type: Number,
    default: 0
  },
  attemptsCount: {
    type: Number,
    default: 0
  },
  firstSolvedAt: {
    type: Date,
    default: null
  },
  lastSolvedAt: {
    type: Date,
    default: null
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now
  },
  lastCode: {
    type: String,
    default: ''
  },
  lastLanguage: {
    type: String,
    default: 'python'
  },
  history: [submissionSchema]
}, {
  timestamps: true
});

// Composite unique index so one record exists per user per problem
practiceSubmissionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

export default mongoose.model('PracticeSubmission', practiceSubmissionSchema);
