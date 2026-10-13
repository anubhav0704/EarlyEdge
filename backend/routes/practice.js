import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/authMiddleware.js';
import PracticeSubmission from '../models/PracticeSubmission.js';

const router = express.Router();

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Helper for Groq API calls
async function callGroq({ messages, max_tokens = 2000, temperature = 0.7, json_mode = true }) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in backend/.env');
  }

  const payload = {
    model: DEFAULT_MODEL,
    messages,
    max_tokens,
    temperature
  };

  if (json_mode) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await axios.post(GROQ_URL, payload, {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.choices?.[0]?.message?.content || '';
}

// ==========================================
// 1. GET USER PRACTICE STATS & SOLVED TRACKING
// ==========================================
router.get('/stats', protect, async (req, res) => {
  try {
    const submissions = await PracticeSubmission.find({ userId: req.user._id }).lean();

    const progressMap = {};
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;
    let dsaSolved = 0;
    let sqlSolved = 0;
    let oopsSolved = 0;
    let totalAttempts = 0;

    submissions.forEach(sub => {
      progressMap[sub.problemId] = {
        problemId: sub.problemId,
        status: sub.status,
        acceptedCount: sub.acceptedCount || 0,
        attemptsCount: sub.attemptsCount || 0,
        firstSolvedAt: sub.firstSolvedAt,
        lastSolvedAt: sub.lastSolvedAt,
        lastAttemptAt: sub.lastAttemptAt,
        lastLanguage: sub.lastLanguage,
        lastCode: sub.lastCode
      };

      totalAttempts += (sub.attemptsCount || 0);

      if (sub.status === 'Solved') {
        totalSolved++;
        if (sub.difficulty === 'Easy') easySolved++;
        else if (sub.difficulty === 'Hard') hardSolved++;
        else mediumSolved++;

        if (sub.category === 'sql') sqlSolved++;
        else if (sub.category === 'oops') oopsSolved++;
        else dsaSolved++;
      }
    });

    res.json({
      success: true,
      stats: {
        totalSolved,
        totalAttempts,
        easySolved,
        mediumSolved,
        hardSolved,
        dsaSolved,
        sqlSolved,
        oopsSolved
      },
      progressMap
    });
  } catch (err) {
    console.error('Error fetching practice stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch practice statistics' });
  }
});

// ==========================================
// 2. SUBMIT & RECORD PROBLEM RESULT
// ==========================================
router.post('/submit', protect, async (req, res) => {
  try {
    const {
      problemId,
      problemNumber = 1,
      title = 'Problem',
      category = 'dsa',
      difficulty = 'Medium',
      topic = 'General',
      status = 'Accepted', // 'Accepted' | 'Wrong Answer' | 'Compilation Error' | 'Runtime Error'
      language = 'python',
      executionTime = '0.04s',
      memory = '2.1 MB',
      code = ''
    } = req.body;

    if (!problemId) {
      return res.status(400).json({ success: false, message: 'problemId is required' });
    }

    const isAccepted = status === 'Accepted';
    const now = new Date();

    let record = await PracticeSubmission.findOne({ userId: req.user._id, problemId });

    if (!record) {
      record = new PracticeSubmission({
        userId: req.user._id,
        problemId,
        problemNumber,
        title,
        category,
        difficulty,
        topic,
        status: isAccepted ? 'Solved' : 'Attempted',
        acceptedCount: isAccepted ? 1 : 0,
        attemptsCount: 1,
        firstSolvedAt: isAccepted ? now : null,
        lastSolvedAt: isAccepted ? now : null,
        lastAttemptAt: now,
        lastCode: code,
        lastLanguage: language,
        history: [{
          timestamp: now,
          status,
          language,
          executionTime,
          memory,
          code
        }]
      });
    } else {
      record.attemptsCount = (record.attemptsCount || 0) + 1;
      record.lastAttemptAt = now;
      record.lastCode = code;
      record.lastLanguage = language;

      if (isAccepted) {
        if (record.status !== 'Solved') {
          record.status = 'Solved';
          record.firstSolvedAt = record.firstSolvedAt || now;
        }
        record.acceptedCount = (record.acceptedCount || 0) + 1;
        record.lastSolvedAt = now;
      }

      record.history.push({
        timestamp: now,
        status,
        language,
        executionTime,
        memory,
        code
      });

      // Keep maximum 50 most recent submission logs in history
      if (record.history.length > 50) {
        record.history = record.history.slice(-50);
      }
    }

    await record.save();

    res.json({
      success: true,
      record: {
        problemId: record.problemId,
        status: record.status,
        acceptedCount: record.acceptedCount,
        attemptsCount: record.attemptsCount,
        firstSolvedAt: record.firstSolvedAt,
        lastSolvedAt: record.lastSolvedAt,
        lastAttemptAt: record.lastAttemptAt,
        lastLanguage: record.lastLanguage
      }
    });
  } catch (err) {
    console.error('Error recording practice submission:', err);
    res.status(500).json({ success: false, message: 'Failed to record submission' });
  }
});

// ==========================================
// 3. FETCH DETAILED SUBMISSION HISTORY FOR A PROBLEM
// ==========================================
router.get('/history/:problemId', protect, async (req, res) => {
  try {
    const { problemId } = req.params;
    const record = await PracticeSubmission.findOne({ userId: req.user._id, problemId }).lean();
    if (!record) {
      return res.json({ success: true, history: [] });
    }
    res.json({
      success: true,
      record: {
        problemId: record.problemId,
        title: record.title,
        status: record.status,
        acceptedCount: record.acceptedCount,
        attemptsCount: record.attemptsCount,
        firstSolvedAt: record.firstSolvedAt,
        lastSolvedAt: record.lastSolvedAt
      },
      history: (record.history || []).reverse() // Most recent first
    });
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

// ==========================================
// 4. FETCH/GENERATE QUESTIONS FROM GROQ AI (500+ EXTENSION)
// ==========================================
router.post('/generate-questions', protect, async (req, res) => {
  try {
    const { category = 'dsa', topic = 'Dynamic Programming', difficulty = 'Medium', startNumber = 101, count = 5 } = req.body;

    const systemPrompt = `You are an elite coding platform question generator (LeetCode, GeeksForGeeks, Codeforces, HackerRank, SQL 50, OOP System Design).
Generate ${count} realistic, top-tier practice questions for the "${category.toUpperCase()}" track focusing on "${topic}" at "${difficulty}" difficulty level.
Start question numbers from #${startNumber}.

Format requirements:
Return strictly a JSON object with a "questions" array.
Each question object MUST have:
- id: string, e.g. "${category}-${startNumber}"
- number: integer, e.g. ${startNumber}
- title: string, concise title
- category: "${category}"
- topic: "${topic}"
- difficulty: "${difficulty}" (Easy, Medium, or Hard)
- description: string, clear problem statement with background and requirements
- constraints: string, realistic time, space, and input boundaries
- sampleTestCases: array of exactly 3 objects:
    [
      { id: 1, input: "...", expected: "...", explanation: "..." },
      { id: 2, input: "...", expected: "...", explanation: "..." },
      { id: 3, input: "...", expected: "...", explanation: "..." }
    ]
- starterCode: object with keys "python", "cpp", "java", "javascript" (or "sql" if category is "sql")
- solutionHint: string, brief algorithmic insight`;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate ${count} distinct practice questions for ${category} (${topic}, ${difficulty}) starting at index ${startNumber}.` }
      ],
      max_tokens: 2800,
      json_mode: true
    });

    const parsed = JSON.parse(rawResponse);
    if (parsed.questions && Array.isArray(parsed.questions)) {
      return res.json({ success: true, questions: parsed.questions });
    }

    res.json({ success: true, questions: [] });
  } catch (err) {
    console.warn('AI question generation fallback triggered:', err.message);
    res.json({ success: false, message: err.message, questions: [] });
  }
});

export default router;
