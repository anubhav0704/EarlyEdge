import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: 'Remote'
  },
  type: {
    type: String,
    enum: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'],
    default: 'Full Time'
  },
  requirements: {
    type: String,
    default: ''
  },
  rawRequirements: {
    type: String,
    default: ''
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lockDuration: {
    type: Number,
    default: 20 // 20 minutes time-lock
  },
  description: {
    type: String,
    default: 'New opportunity posted.'
  },
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Job', JobSchema);
