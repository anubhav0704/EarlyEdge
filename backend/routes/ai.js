import express from 'express';
import axios from 'axios';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Proxy route to Groq API
router.post('/generate', protect, async (req, res) => {
    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const { instruction, input_text, max_tokens, temperature, history, json_mode } = req.body;
        
        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'GROQ_API_KEY is not configured in the server' });
        }

        let messages = [
            { role: "system", content: instruction }
        ];

        // Append past history if provided
        if (history && Array.isArray(history)) {
            messages = messages.concat(history);
        }

        if (input_text) {
            messages.push({ role: "user", content: input_text });
        }
        
        const payload = {
            model: 'openai/gpt-oss-20b',
            messages: messages,
            max_tokens: max_tokens || 150,
            temperature: temperature || 0.7
        };

        if (json_mode) {
            payload.response_format = { type: "json_object" };
        }

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const aiText = response.data.choices[0]?.message?.content || "";
        res.json({ response: aiText });
    } catch (err) {
        console.error('Error proxying to Groq:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to generate AI response', details: err.message });
    }
});
// Specialized route to generate HTML reports from a transcript
router.post('/report', protect, async (req, res) => {
    try {
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        const { transcript, techStack, candidateName, candidateEmail } = req.body;
        
        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'GROQ_API_KEY is not configured in the server' });
        }

        const systemPrompt = `You are an expert technical recruiter and AI agent. 
You will be provided with the full transcript of a 15-minute technical interview for a ${techStack} role.
Analyze the transcript deeply and generate a highly personalized, professional HTML report summarizing the candidate's performance.

Your response MUST be raw HTML (no markdown code blocks, just pure HTML) using the following structure as a template, but filling in the specific dynamic insights:

<div style="font-family: 'Outfit', sans-serif; color: #000; padding: 20px;">
  <h2 style="color: #7c3aed; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
    Technical Interview Report: ${techStack}
  </h2>
  
  <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.5;">
    <p><strong>Candidate Name:</strong> ${candidateName}</p>
    <p><strong>Email Address:</strong> ${candidateEmail}</p>
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

Only output the raw HTML code. DO NOT output any conversational text like "Here is the report".`;

        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'openai/gpt-oss-20b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Transcript:\n${transcript}` }
                ],
                max_tokens: 1500,
                temperature: 0.4
            },
            {
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        let aiHTML = response.data.choices[0]?.message?.content || "";
        
        // Clean up markdown block if LLM adds it anyway
        aiHTML = aiHTML.replace(/^```html/i, '').replace(/```$/i, '').trim();

        res.json({ reportHTML: aiHTML });
    } catch (err) {
        console.error('Error generating report via Groq:', err.response?.data || err.message);
        res.status(500).json({ error: 'Failed to generate report', details: err.message });
    }
});

export default router;
