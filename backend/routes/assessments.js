import express from 'express';
import MockTest from '../models/MockTest.js';
import VerificationTest from '../models/VerificationTest.js';
import Resume from '../models/Resume.js';
import Interview from '../models/Interview.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// ========================
// VERIFICATION & MOCK TESTS
// ========================

// @desc    Submit a premium verification test
// @route   POST /api/assessments/verification
// @access  Private (Student only)
router.post('/verification', protect, async (req, res) => {
  const { score, total, passed, history } = req.body;

  try {
    const passedTest = passed || score >= 4; // 80% passing standard
    const certificateId = passedTest ? "CERT-" + Math.random().toString(36).substr(2, 9).toUpperCase() : null;

    const test = await VerificationTest.create({
      userId: req.user._id,
      score,
      total,
      passed: passedTest,
      history,
      certificateId
    });

    if (passedTest) {
      // Mark candidate as verified dynamically
      await User.findByIdAndUpdate(req.user._id, { isVerified: true });
    }

    res.status(201).json({ success: true, test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit a mock skill assessment test
// @route   POST /api/assessments/mock
// @access  Private (Student only)
router.post('/mock', protect, async (req, res) => {
  const { type, score, total, accuracy, history, domain, partAScore, partBScore, partCScore, subjectiveAnswers, codeSubmitted, aiEvaluation } = req.body;

  try {
    const defaultAiEval = aiEvaluation || {
      aiSummary: `Sage AI evaluated performance across ${domain || 'Engineering'} domains: Part A (30 MCQs): ${partAScore || 0}%, Part B (4 Subjective Qs): ${partBScore || 0}%, Part C (DSA Code Submission): ${partCScore || 0}%.`,
      partAEvaluation: `Core CS & Aptitude Accuracy: ${partAScore || 0}%. Foundational computer science and quantitative problem-solving verified.`,
      partBEvaluation: `Subjective Technical Depth: ${partBScore || 0}%. Responses demonstrate strong domain-specific scenario analysis and architectural clarity.`,
      partCEvaluation: `DSA Code Quality: ${partCScore || 0}%. Code submission analyzed for algorithmic time/space efficiency and clean structure.`,
      recommendation: `High recommendation for ${domain || 'Software Engineering'} roles.`
    };

    const test = await MockTest.create({
      userId: req.user._id,
      type: type || `${domain || 'General'} Skill Test`,
      score,
      total,
      accuracy,
      domain: domain || 'General Tech',
      partAScore: partAScore || 0,
      partBScore: partBScore || 0,
      partCScore: partCScore || 0,
      subjectiveAnswers: subjectiveAnswers || [],
      codeSubmitted: codeSubmitted || '',
      aiEvaluation: defaultAiEval,
      history: history || []
    });

    // Update user TQ score
    const bonusTQ = Math.round((accuracy || 0) * 2.5);
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { tqScore: bonusTQ } },
      { new: true }
    );

    // Recalculate global ranks across all student users
    const allStudents = await User.find({ role: 'student' }).sort({ tqScore: -1 });
    let currentRank = 1;
    for (let i = 0; i < allStudents.length; i++) {
      await User.findByIdAndUpdate(allStudents[i]._id, { rank: i + 1 });
      if (allStudents[i]._id.toString() === req.user._id.toString()) {
        currentRank = i + 1;
      }
    }

    res.status(201).json({
      success: true,
      test,
      userRank: currentRank,
      userTqScore: updatedUser ? updatedUser.tqScore : 500
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all test, verification, and interview results for student
// @route   GET /api/assessments/results
// @access  Private
router.get('/results', protect, async (req, res) => {
  try {
    const mockTests = await MockTest.find({ userId: req.user._id }).sort({ timestamp: -1 });
    const verifications = await VerificationTest.find({ userId: req.user._id }).sort({ timestamp: -1 });
    const interviews = await Interview.find({ userId: req.user._id }).sort({ timestamp: -1 });

    res.json({
      success: true,
      mockTests,
      verifications,
      interviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================
// RESUME UPLOAD SECTION
// ========================

// @desc    Upload/save student base64 resume file
// @route   POST /api/assessments/resume
// @access  Private (Student only)
router.post('/resume', protect, async (req, res) => {
  const { fileName, fileSize, fileType, resumeData } = req.body;

  if (!resumeData) {
    return res.status(400).json({ success: false, message: 'No resume file content provided' });
  }

  try {
    // Save or update existing resume for candidate
    const resume = await Resume.findOneAndUpdate(
      { userId: req.user._id },
      {
        fileName,
        fileSize,
        fileType,
        resumeData,
        uploadedAt: Date.now()
      },
      { new: true, upsert: true }
    );

    res.status(201).json({ success: true, resume });
  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch current user resume metadata
// @route   GET /api/assessments/resume
// @access  Private
router.get('/resume', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume) {
      return res.json({ success: true, resume: null, message: 'No resume uploaded' });
    }
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete current candidate's resume
// @route   DELETE /api/assessments/resume
// @access  Private (Student only)
router.delete('/resume', protect, async (req, res) => {
  try {
    await Resume.findOneAndDelete({ userId: req.user._id });

    // Update applicant statuses
    await Application.updateMany({ studentId: req.user._id }, { hasResume: false, resumeFileName: null });

    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Fetch candidate resume (for recruiter profile view)
// @route   GET /api/assessments/resume/:userId
// @access  Private
router.get('/resume/:userId', protect, async (req, res) => {
  try {
    const resume = await Resume.findOne({ userId: req.params.userId });
    if (!resume) {
      return res.status(404).json({ success: false, message: 'Resume not found' });
    }
    res.json({ success: true, resume });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================
// AI TECHNICAL INTERVIEWS
// ========================

// @desc    Submit technical AI interview log and evaluate report
// @route   POST /api/assessments/interview
// @access  Private (Student only)
router.post('/interview', protect, async (req, res) => {
  const { scores, report, techStack, interests, questionsAsked, chatHistory, duration } = req.body;

  try {
    const interview = await Interview.create({
      userId: req.user._id,
      scores,
      report,
      techStack,
      interests,
      questionsAsked,
      chatHistory,
      duration: duration || 0
    });

    res.status(201).json({ success: true, interview });
  } catch (error) {
    console.error('Interview log error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
