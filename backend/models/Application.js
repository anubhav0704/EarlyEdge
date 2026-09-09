import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobTitle: {
    type: String,
    required: true
  },
  company: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  hasResume: {
    type: Boolean,
    default: false
  },
  resumeFileName: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'shortlisted', 'accepted', 'rejected'],
    default: 'pending'
  }
});

export default mongoose.model('Application', ApplicationSchema);
