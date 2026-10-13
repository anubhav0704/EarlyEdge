import mongoose from 'mongoose';

const CoachMemorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  messages: [
    {
      id: { type: String, default: () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` },
      sender: { type: String, enum: ['You', 'Sage'], required: true },
      text: { type: String, required: true },
      sentiment: { type: String, default: '🧠 Sage AI' },
      timestamp: { type: Date, default: Date.now },
      action: { type: Object, default: null }
    }
  ],
  memoryNotes: [
    {
      type: String,
      trim: true
    }
  ],
  careerGoals: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('CoachMemory', CoachMemorySchema);
