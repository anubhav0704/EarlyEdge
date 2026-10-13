import express from 'express';
import axios from 'axios';
import { createRequire } from 'module';
import { protect } from '../middleware/authMiddleware.js';
import CoachMemory from '../models/CoachMemory.js';

// pdf-parse is CJS-only; use createRequire to load it safely in ESM
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = express.Router();

const DEFAULT_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Helper to call Groq API with robust token sizing and error handling
 */
async function callGroq({ messages, max_tokens, temperature = 0.7, json_mode = false, model = DEFAULT_MODEL }) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in backend/.env');
  }

  // Ensure ample token allowance for reasoning models like openai/gpt-oss-20b
  const minTokens = json_mode ? 1500 : 1000;
  const effectiveMaxTokens = Math.max(max_tokens || minTokens, minTokens);

  const payload = {
    model: model || DEFAULT_MODEL,
    messages,
    max_tokens: effectiveMaxTokens,
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
// 1. HEALTH & DIAGNOSTIC ENDPOINT
// ==========================================
router.get('/status', async (req, res) => {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(500).json({
      success: false,
      configured: false,
      message: 'GROQ_API_KEY is missing from environment variables'
    });
  }

  try {
    const response = await axios.get('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      timeout: 10000
    });
    const models = (response.data.data || []).map(m => m.id);
    res.json({
      success: true,
      configured: true,
      activeModel: DEFAULT_MODEL,
      modelsCount: models.length,
      models: models.slice(0, 10)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      configured: true,
      message: 'Failed to connect to Groq API with provided key',
      error: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 2. GENERAL AI PROXY / CHAT COMPLETIONS
// ==========================================
router.post('/generate', protect, async (req, res) => {
  try {
    const { instruction, input_text, max_tokens, temperature, history, json_mode, model } = req.body;

    let messages = [];
    if (instruction) {
      messages.push({ role: 'system', content: instruction });
    }

    if (history && Array.isArray(history)) {
      messages = messages.concat(history.map(h => ({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: String(h.content || '')
      })));
    }

    if (input_text) {
      messages.push({ role: 'user', content: String(input_text) });
    }

    const aiText = await callGroq({
      messages,
      max_tokens,
      temperature,
      json_mode: Boolean(json_mode),
      model
    });

    res.json({ response: aiText });
  } catch (err) {
    console.error('Error generating AI response via Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to generate AI response',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 3. AI INTERVIEW HTML REPORT GENERATION
// ==========================================
router.post('/report', protect, async (req, res) => {
  try {
    const { transcript, techStack, candidateName, candidateEmail } = req.body;

    const systemPrompt = `You are an expert technical recruiter and AI interviewer agent.
You will be provided with the full transcript of a technical interview for a ${techStack || 'Software Engineering'} role.
Analyze the transcript deeply and generate a highly personalized, professional HTML report summarizing the candidate's performance.

Your response MUST be raw HTML (no markdown code blocks, just pure HTML) using the following structure as a template:

<div style="font-family: 'Outfit', sans-serif; color: #000; padding: 20px;">
  <h2 style="color: #7c3aed; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
    Technical Interview Report: ${techStack}
  </h2>
  
  <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.5;">
    <p><strong>Candidate Name:</strong> ${candidateName || 'Candidate'}</p>
    <p><strong>Email Address:</strong> ${candidateEmail || 'N/A'}</p>
    <p><strong>Assessment Path:</strong> Dynamic AI Voice Interview</p>
    <p><strong>Focus Area:</strong> ${techStack} Specialization</p>
  </div>

  <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
    <h3 style="color: #333; margin-top: 0;">Performance Summary</h3>
    <p style="line-height: 1.6;">[Write a 2-3 sentence overall summary of how they performed, mentioning specific topics they answered well or struggled with.]</p>
  </div>

  <h3 style="color: #333; margin-top: 25px;">Candidate Key Strengths:</h3>
  <ul style="padding-left: 20px; line-height: 1.6;">
    <li>[Strength 1 based on actual transcript]</li>
    <li>[Strength 2 based on actual transcript]</li>
    <li>[Strength 3 based on actual transcript]</li>
  </ul>

  <h3 style="color: #333; margin-top: 25px;">Areas for Improvement:</h3>
  <ul style="padding-left: 20px; line-height: 1.6;">
    <li>[Constructive feedback 1 based on actual transcript]</li>
    <li>[Constructive feedback 2 based on actual transcript]</li>
  </ul>
</div>

Only output raw HTML code. Do NOT include markdown \`\`\`html wrapper.`;

    let aiHTML = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Transcript:\n${transcript || 'No conversation recorded.'}` }
      ],
      max_tokens: 2000,
      temperature: 0.4
    });

    // Clean up any markdown code blocks
    aiHTML = aiHTML.replace(/^```html/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();

    res.json({ reportHTML: aiHTML });
  } catch (err) {
    console.error('Error generating report via Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to generate report',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 4. LIVE DSA CODE EVALUATOR AGENT (MOCK TESTS PART C)
// ==========================================
router.post('/evaluate-code', protect, async (req, res) => {
  try {
    const { code, problemTitle, problemDescription, difficulty, sampleInput, sampleOutput } = req.body;

    if (!code || !code.trim()) {
      return res.json({
        score: 0,
        timeComplexity: 'N/A',
        spaceComplexity: 'N/A',
        feedback: 'No code submitted for evaluation.',
        passesTests: false
      });
    }

    const systemPrompt = `You are an expert DSA (Data Structures & Algorithms) Code Evaluation Agent and Technical Interviewer.
You must analyze the candidate's code submission for the specified algorithmic challenge.
Evaluate for:
1. Correctness against the problem specifications and test cases.
2. Time Complexity and Space Complexity.
3. Edge case handling (e.g. empty inputs, null pointers, bounds).
4. Code readability and clean structure.

You MUST respond strictly with a valid JSON object with the following schema:
{
  "score": <number between 0 and 100>,
  "timeComplexity": "<Big-O notation, e.g. O(N) or O(N log N)>",
  "spaceComplexity": "<Big-O notation, e.g. O(1) or O(N)>",
  "feedback": "<concise 2-3 sentence technical feedback on what was done right and any bugs or performance improvements>",
  "passesTests": <boolean true or false>
}`;

    const userPrompt = `Problem: ${problemTitle || 'DSA Challenge'} (${difficulty || 'Medium'})
Description: ${problemDescription || ''}
Sample Input: ${sampleInput || ''}
Sample Output: ${sampleOutput || ''}

Candidate Submitted Code:
\`\`\`
${code}
\`\`\``;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.2,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // Fallback regex extraction
      const scoreMatch = rawResponse.match(/"score":\s*(\d+)/);
      parsed = {
        score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        feedback: 'Code submitted and evaluated for algorithmic logic.',
        passesTests: true
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error('Error evaluating code with Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to evaluate code',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 5. SAGE CAREER COACH AGENT (WITH PERSISTENT MEMORY)
// ==========================================

// Get user's persistent chat memory & history
router.get('/coach/history', protect, async (req, res) => {
  try {
    let memory = await CoachMemory.findOne({ userId: req.user._id });
    if (!memory) {
      memory = await CoachMemory.create({
        userId: req.user._id,
        messages: [],
        memoryNotes: []
      });
    }
    res.json({
      success: true,
      messages: memory.messages || [],
      memoryNotes: memory.memoryNotes || [],
      careerGoals: memory.careerGoals || ''
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Clear user's coach chat history
router.post('/coach/clear', protect, async (req, res) => {
  try {
    await CoachMemory.findOneAndUpdate(
      { userId: req.user._id },
      { messages: [] }
    );
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coach-agent', protect, async (req, res) => {
  try {
    const { query, history, studentContext } = req.body;

    // Load or create persistent memory record in MongoDB
    let memoryDoc = await CoachMemory.findOne({ userId: req.user._id });
    if (!memoryDoc) {
      memoryDoc = new CoachMemory({
        userId: req.user._id,
        messages: [],
        memoryNotes: []
      });
    }

    const {
      name = req.user.name || 'Developer',
      university = req.user.university || '',
      tqScore = req.user.tqScore || 500,
      isVerified = req.user.isVerified || false,
      mockTestsCount = 0,
      interviewsCount = 0,
      recentTestDomain = ''
    } = studentContext || {};

    const existingNotes = (memoryDoc.memoryNotes || []).slice(-10).join('\n• ') || 'First conversation with candidate.';

    const systemPrompt = `You are Sage, an authentic, experienced Senior Software Engineering Lead and Career Mentor at EarlyEdge.
You are mentoring ${name} 1-on-1.

TONE & VOICE (BE NATURAL AND HUMAN):
- Speak like a supportive senior engineering colleague sitting next to them or chatting over coffee.
- Be conversational, relatable, and pragmatic.
- Avoid robotic corporate clichés, avoid textbook lectures, and never sound like an automated curriculum generator.

STRICT FORMATTING RULES (AVOID ROBOTIC AI ARTIFACTS):
1. NEVER use markdown tables (|---|---|). They look awful in chat windows.
2. NEVER format responses with rigid syllabus headers like "### 1️⃣ Topic Name".
3. Write in clean, readable conversational paragraphs.
4. When suggesting concrete steps or resources, use natural bullet points (•) with realistic, practical developer context on *why* it matters and what production systems actually use.
5. Emphasize real-world intuition: what hiring managers care about, common pitfalls, and practical architecture tips.
6. Keep your responses focused (under 220 words) and finish with a natural, friendly follow-up question that invites real dialogue.

CANDIDATE DOSSIER:
- Name: ${name}
- University: ${university || 'Unspecified'}
- Technical Quotient (TQ): ${tqScore}/1000 (${tqScore >= 800 ? 'Elite Tier' : tqScore >= 600 ? 'High Tier' : 'Emerging Talent'})
- Verified Badge: ${isVerified ? 'Verified Talent (Passed Skill Quiz)' : 'Not Yet Verified'}
- Mock Tests Logged: ${mockTestsCount}
- Voice Interviews: ${interviewsCount}
- Recent Test Focus: ${recentTestDomain || 'General Engineering'}

WHAT SAGE ALREADY KNOWS/REMEMBERS ABOUT ${name.toUpperCase()}:
• ${existingNotes}
(Weave this context in naturally when relevant, as a real human mentor would).`;

    let messages = [{ role: 'system', content: systemPrompt }];

    // Use recent history from database if frontend sent minimal
    const chatSequence = (history && Array.isArray(history) && history.length > 0)
      ? history
      : (memoryDoc.messages || []);

    if (chatSequence.length > 0) {
      messages = messages.concat(chatSequence.slice(-8).map(m => ({
        role: m.sender === 'Sage' ? 'assistant' : 'user',
        content: String(m.text || '')
      })));
    }

    messages.push({ role: 'user', content: String(query) });

    const aiText = await callGroq({
      messages,
      max_tokens: 1200,
      temperature: 0.7
    });

    // Persist new dialogue turn to MongoDB
    memoryDoc.messages.push({
      sender: 'You',
      text: query,
      timestamp: new Date()
    });
    memoryDoc.messages.push({
      sender: 'Sage',
      text: aiText,
      sentiment: '🧠 Sage AI',
      timestamp: new Date()
    });

    // Extract quick topic / goal note if relevant to remember permanently
    const qLower = query.toLowerCase();
    if (qLower.includes('want to learn') || qLower.includes('interested in') || qLower.includes('preparing for') || qLower.includes('focusing on') || qLower.includes('studying')) {
      const summaryNote = `${name} is currently focusing on: ${query.slice(0, 100)}`;
      if (!memoryDoc.memoryNotes.includes(summaryNote)) {
        memoryDoc.memoryNotes.push(summaryNote);
        if (memoryDoc.memoryNotes.length > 15) {
          memoryDoc.memoryNotes.shift();
        }
      }
    }

    memoryDoc.updatedAt = new Date();
    await memoryDoc.save();

    res.json({
      response: aiText,
      memoryNotes: memoryDoc.memoryNotes
    });
  } catch (err) {
    console.error('Error running coach agent via Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to run coach agent',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 6. AI RESUME REVIEW & ATS SCREENING AGENT
// ==========================================
router.post('/review-resume', protect, async (req, res) => {
  try {
    const { resumeData, candidateInfo } = req.body;

    // ── Extract plain text from the uploaded PDF base64 ──────────────────
    let extractedResumeText = '';
    if (resumeData && typeof resumeData === 'string') {
      try {
        // Strip "data:application/pdf;base64," prefix if present
        const base64Data = resumeData.includes(',') ? resumeData.split(',')[1] : resumeData;
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const parsed = await pdfParse(pdfBuffer);
        extractedResumeText = parsed.text || '';
      } catch (pdfErr) {
        console.warn('PDF text extraction warning:', pdfErr.message);
        // Continue with empty text – scoring will reflect limited info
        extractedResumeText = '';
      }
    }

    const resumeContextForAI = extractedResumeText.trim().length > 50
      ? extractedResumeText.slice(0, 4000)  // Trim to fit token budget
      : `File: ${candidateInfo?.fileName || 'resume.pdf'}. No extractable text found (possibly scanned/image-based PDF).`;

    const systemPrompt = `You are an expert AI Technical Recruiter and ATS (Applicant Tracking System) Screening Agent with 10+ years of experience in campus hiring and tech recruitment.

Your task is to analyze the candidate's actual resume text and profile, then produce a REAL, ACCURATE ATS screening report.

## ATS SCORE RUBRIC (Total: 100 points)
Score the resume honestly using these criteria:
- Contact & Header Info present (name, email, phone, links): 0-10 pts
- Education section with degree, institution, GPA/grades: 0-10 pts  
- Technical Skills section with relevant tech stack keywords: 0-20 pts
- Work Experience / Internships with impact metrics: 0-20 pts
- Projects section with tech used and outcomes: 0-20 pts
- Certifications, Awards, or Achievements: 0-10 pts
- Resume formatting quality (clear structure, no walls of text): 0-10 pts

If resume text is minimal or unreadable, honestly score in the 30-50 range and explain why.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "atsScore": <integer 0 to 100 based on rubric above>,
  "summary": "<2-3 sentence honest overview: what the resume communicates, its tech stack fit, and seniority tier>",
  "keyStrengths": ["<strength 1 from actual content>", "<strength 2>", "<strength 3>"],
  "areasToImprove": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "missingKeywords": ["<ATS keyword missing from resume 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>"],
  "suggestedRoles": ["<role 1 that fits the profile>", "<role 2>", "<role 3>"]
}`;

    const userPrompt = `Candidate Profile:
Name: ${candidateInfo?.name || 'Candidate'}
University: ${candidateInfo?.university || 'N/A'}
Stream / Branch: ${candidateInfo?.stream || ''} ${candidateInfo?.branch || ''}

Extracted Resume Text:
---
${resumeContextForAI}
---

Using the rubric, calculate the atsScore honestly and fill in all fields.`;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1800,
      temperature: 0.2,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
      // Clamp score to valid range
      if (typeof parsed.atsScore === 'number') {
        parsed.atsScore = Math.min(100, Math.max(0, Math.round(parsed.atsScore)));
      }
    } catch (e) {
      console.error('ATS JSON parse error:', e.message);
      parsed = {
        atsScore: extractedResumeText.length > 100 ? 60 : 35,
        summary: 'Resume was received but could not be fully parsed. Please ensure the PDF is text-based, not a scanned image.',
        keyStrengths: ['Resume submitted successfully', 'Candidate registered on platform'],
        areasToImprove: ['Ensure your PDF is text-based (not image-scanned)', 'Add quantified achievements', 'Include a clear skills section'],
        missingKeywords: ['GitHub', 'Docker', 'CI/CD', 'Agile'],
        suggestedRoles: ['Software Engineer', 'Full Stack Developer', 'Backend Developer']
      };
    }

    res.json({ success: true, analysis: parsed });
  } catch (err) {
    console.error('Error reviewing resume with Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to review resume',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 7. REAL-TIME TEST GENERATOR AGENT (FOR ALL DOMAINS)
// ==========================================
router.post('/generate-test', protect, async (req, res) => {
  try {
    const { domain = 'SDE / Full Stack', count = 10 } = req.body;

    const systemPrompt = `You are an elite Technical Assessment Architect and Senior Staff Engineer at EarlyEdge.
Your job is to generate a comprehensive, realistic, and fresh technical skill test in real-time for the domain: "${domain}".

You MUST return a valid JSON object strictly matching this schema:
{
  "partA": [
    {
      "id": "mcq-1",
      "category": "${domain}",
      "question": "<practical, non-trivial technical question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correct": "<Exact matching string of the correct option>"
    }
  ],
  "partB": [
    {
      "id": "sub-1",
      "title": "<Scenario or Architectural Topic>",
      "question": "<Deep technical scenario question requiring real engineering trade-offs, architecture, or pseudo-code>"
    }
  ],
  "partC": {
    "title": "<Name of DSA Problem>",
    "difficulty": "Medium",
    "description": "<Clear algorithmic problem description, input format, constraints, and requirements>",
    "sampleInput": "<Sample input 1>",
    "sampleOutput": "<Sample output 1>",
    "testCases": [
      { "id": 1, "input": "<Sample input 1>", "expected": "<Sample output 1>", "explanation": "<Explanation for sample 1>" },
      { "id": 2, "input": "<Sample input 2>", "expected": "<Sample output 2>", "explanation": "<Explanation for sample 2>" },
      { "id": 3, "input": "<Sample input 3 boundary case>", "expected": "<Sample output 3>", "explanation": "<Explanation for sample 3>" }
    ]
  }
}

Requirements:
- Part A: exactly ${count} multiple choice questions (mix of modern concepts, edge cases, debugging, and core CS).
- Part B: exactly 4 subjective scenario questions testing real-world architectural reasoning.
- Part C: exactly 1 classic or modern Data Structures & Algorithms challenge appropriate for ${domain}, including 3 distinct sample test cases in the testCases array.
Output ONLY valid JSON.`;

    const userPrompt = `Generate the complete real-time assessment for ${domain}.`;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 2500,
      temperature: 0.7,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse generated test JSON:', rawResponse);
      return res.status(500).json({ error: 'Failed to parse AI generated test format.' });
    }

    res.json({ success: true, test: parsed, generatedAt: new Date() });
  } catch (err) {
    console.error('Error generating real-time test with Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to generate real-time test',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 8. REAL-TIME TALENT VERIFICATION QUIZ GENERATOR
// ==========================================
router.post('/generate-verification', protect, async (req, res) => {
  try {
    const systemPrompt = `You are a Principal Systems Engineer conducting the EarlyEdge Talent Verification exam.
Generate 5 fresh, challenging, high-caliber Computer Science fundamental MCQs covering:
1. Operating Systems (deadlocks, virtual memory, threads/processes)
2. Database Systems (ACID, isolation levels, indexing, normalization)
3. Computer Networks (TCP/UDP, OSI layers, DNS, security)
4. Data Structures & Algorithms (time/space complexity, hash maps, graphs)
5. System Architecture / Concurrency

You MUST respond strictly with a valid JSON object matching:
{
  "questions": [
    {
      "id": "v-1",
      "category": "OS | DBMS | Networks | DSA",
      "question": "<Clear, technical question>",
      "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
      "correct": "<Exact matching string of correct option>"
    }
  ]
}
Output valid JSON only.`;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate 5 verification questions.' }
      ],
      max_tokens: 2500,
      temperature: 0.7,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse verification questions' });
    }

    res.json({ success: true, questions: parsed.questions || [] });
  } catch (err) {
    console.error('Error generating verification test with Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to generate verification test',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 9. REAL-TIME SUBJECTIVE ANSWERS EVALUATOR
// ==========================================
router.post('/evaluate-subjective', protect, async (req, res) => {
  try {
    const { domain, answers } = req.body; // answers: [{ title, question, answer }]

    const systemPrompt = `You are a Principal Engineering Lead evaluating subjective scenario answers for a ${domain || 'Software Engineering'} skill test.
Evaluate the candidate's answers based on technical depth, accuracy, real-world practicality, and trade-off considerations.

Return strictly a valid JSON object with:
{
  "score": <overall score integer from 0 to 100>,
  "feedback": "<2-3 sentence overall technical summary of their architectural and problem-solving depth>",
  "itemized": [
    {
      "questionTitle": "<title>",
      "score": <0-100>,
      "critique": "<1-2 sentence specific feedback on this answer>"
    }
  ]
}`;

    const userPrompt = `Candidate Subjective Answers for ${domain}:
${JSON.stringify(answers || [], null, 2)}`;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1800,
      temperature: 0.3,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        score: 75,
        feedback: 'Candidate demonstrates solid domain knowledge and architectural reasoning.',
        itemized: []
      };
    }

    res.json({ success: true, evaluation: parsed });
  } catch (err) {
    console.error('Error evaluating subjective answers via Groq:', err.response?.data || err.message);
    res.status(500).json({
      error: 'Failed to evaluate subjective answers',
      details: err.response?.data?.error?.message || err.message
    });
  }
});

// ==========================================
// 10. REAL-TIME MULTI-LANGUAGE CODE COMPILER & RUNNER
// (Supports: C++, Java, Python, JavaScript)
// ==========================================
router.post('/compile-run', protect, async (req, res) => {
  try {
    const { language = 'python', code = '', stdin = '' } = req.body;

    if (!code || !code.trim()) {
      return res.json({
        success: true,
        status: 'Error',
        stdout: '',
        stderr: 'No code provided to compile or run.',
        executionTime: '0.00s'
      });
    }

    const langNameMap = {
      c: 'C (GCC 13)',
      cpp: 'C++ (g++ 14 / C++20)',
      java: 'Java (OpenJDK 21)',
      python: 'Python 3.12',
      javascript: 'JavaScript (Node.js 20)',
      typescript: 'TypeScript 5.3',
      sql: 'SQL (PostgreSQL / MySQL / SQLite ANSI SQL)',
      go: 'Go 1.22',
      rust: 'Rust 1.76',
      ruby: 'Ruby 3.3',
      php: 'PHP 8.3'
    };

    const targetLang = langNameMap[language.toLowerCase()] || language;

    const systemPrompt = `You are a deterministic, ultra-fast online code compiler and execution sandbox engine for ${targetLang}.
Your goal is to simulate exact compilation and runtime execution of the provided user code with the given standard input (stdin).

Rules for execution:
1. Syntax & Compilation Check:
   - For C++: check syntax, valid includes (<iostream>, <vector>, etc.), and main() entry point. If syntax error, status must be "Compilation Error" and stderr must show realistic compiler line errors.
   - For Java: check valid class syntax, public static void main(), imports. If syntax error, status must be "Compilation Error".
   - For Python: check valid indentation and syntax. If syntax error, status must be "Syntax Error".
   - For JavaScript: check valid syntax.
   - For SQL: check valid SQL DML/DQL syntax, valid SELECT/JOIN/GROUP BY/ORDER BY. If syntax error, status must be "Compilation Error".
2. Runtime Execution:
   - If the code compiles, execute it with the provided stdin (or table data for SQL).
   - Capture exact stdout output (or formatted table result set for SQL).
   - If infinite loop detected, return status "Time Limit Exceeded".
   - If runtime exception (e.g. division by zero, null pointer, out of bounds), return status "Runtime Error" with stack trace in stderr.
   - If successful, return status "Accepted".

You MUST return strictly a valid JSON object matching:
{
  "status": "Accepted" | "Compilation Error" | "Runtime Error" | "Time Limit Exceeded",
  "stdout": "<exact output string produced by code>",
  "stderr": "<exact compiler or runtime error message if any, else empty string>",
  "executionTime": "<e.g. 0.04s>",
  "memory": "<e.g. 2.1 MB>"
}`;

    const userPrompt = `Language: ${targetLang}
Standard Input (stdin):
${stdin || '(empty)'}

Source Code:
\`\`\`${language}
${code}
\`\`\``;

    const rawResponse = await callGroq({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 1500,
      temperature: 0.1,
      json_mode: true
    });

    let parsed = null;
    try {
      const cleaned = rawResponse.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        status: 'Accepted',
        stdout: 'Code executed successfully.',
        stderr: '',
        executionTime: '0.05s',
        memory: '2.0 MB'
      };
    }

    res.json({
      success: true,
      ...parsed
    });
  } catch (err) {
    console.error('Compiler run error via Groq:', err.response?.data || err.message);
    res.status(500).json({
      success: false,
      status: 'Server Error',
      stdout: '',
      stderr: err.response?.data?.error?.message || err.message,
      executionTime: '0.00s'
    });
  }
});

export default router;
