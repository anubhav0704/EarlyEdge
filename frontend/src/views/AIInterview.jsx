import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import html2pdf from 'html2pdf.js';

// Mappings of standard Interview questions (Exactly like legacy script.js!)
const QUESTION_DATABASE = {
  'SDE / Full Stack': [
    "What is the Virtual DOM and how does React reconcile changes?",
    "Explain the Component Lifecycle in React.",
    "What is the difference between 'let', 'const', and 'var'?",
    "Explain closures in JavaScript and give a practical example.",
    "What is the Event Loop in JavaScript and how does it handle concurrency?",
    "Explain the 'this' keyword behavior in different scopes.",
    "What are Promises and how do they differ from async/await?",
    "What is the difference between process.nextTick and setImmediate in Node?",
    "What is middleware in Express.js?",
    "Describe the MVC architectural pattern.",
    "How do you horizontally and vertically scale a web application?"
  ],
  'Cyber Security': [
    "How does HTTPS establish secure connections?",
    "What is CORS and how do you resolve CORS errors in Express?",
    "What is a SQL injection and how do you prevent it?",
    "Explain Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF).",
    "How does symmetric encryption differ from asymmetric encryption?",
    "What is a Web Application Firewall (WAF)?",
    "Describe the principle of least privilege.",
    "What is OAuth 2.0 and how does it work?",
    "How do you handle a suspected ransomware attack on a company server?"
  ],
  'Cloud Engineering': [
    "What are the service models in cloud computing (IaaS, PaaS, SaaS)?",
    "Explain the concept of virtualization in cloud servers.",
    "What is a container and how is it different from a VM?",
    "What is Load Balancing and what algorithms are used?",
    "Explain serverless computing and cold starts.",
    "What is a Virtual Private Cloud (VPC) and how do subnets work?",
    "Describe a highly available cloud architecture.",
    "How does Infrastructure as Code like Terraform improve deployment?"
  ],
  'AI Engineering': [
    "What is the difference between supervised and unsupervised learning?",
    "Explain the bias-variance tradeoff in machine learning.",
    "What is overfitting and how do you prevent it?",
    "Explain the concept of regularization (L1 vs L2 lasso/ridge).",
    "How does a decision tree work?",
    "What is a confusion matrix and F1 score?",
    "Explain Gradient Descent optimization.",
    "What is a transformer model and how does self-attention work?",
    "Explain Retrieval-Augmented Generation (RAG)."
  ],
  'DevOps': [
    "What is the difference between a process and a thread?",
    "What is a container and how is it different from a VM?",
    "How do you set up a CI/CD pipeline using GitHub Actions?",
    "Explain the purpose of Kubernetes Pods and Services.",
    "What is Infrastructure as Code (IaC)?",
    "How do you monitor a microservices application?",
    "Explain Blue-Green deployment vs Canary deployment.",
    "What is the role of Docker in a DevOps pipeline?"
  ],
  'Data Science': [
    "What is the difference between data science and data analytics?",
    "How do you handle missing or skewed data in a dataset?",
    "Explain the Central Limit Theorem.",
    "What is a p-value and how is it used in hypothesis testing?",
    "Explain the difference between correlation and causation.",
    "What is A/B testing and how do you set it up?",
    "Explain list comprehensions in Python.",
    "What is the Global Interpreter Lock (GIL)?",
    "How do you optimize a complex SQL query for large datasets?"
  ]
};

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a challenging technical project you worked on and how you resolved hurdles.",
  "How do you handle technical conflict in a development team?",
  "Describe a time you failed in an implementation and what you learned.",
  "Where do you see yourself in 5 years in your tech career?",
  "What is your greatest technical strength and weakness?"
];

export default function AIInterview({ onSetAssessmentActive, onSwitchView, onExitAssessment }) {
  const { user, apiFetch } = useContext(AuthContext);
  const speech = useSpeech();

  // App interview state
  const [topicSelected, setTopicSelected] = useState(false);
  const [activeTopic, setActiveTopic] = useState('javascript');
  const [chatHistory, setChatHistory] = useState([]);
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [statusMsg, setStatusMsg] = useState('SYSTEM READY');
  const [currentStatusClass, setCurrentStatusClass] = useState('thinking'); // listening, speaking, thinking

  // Phase controller
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewComplete, setQuizComplete] = useState(false);
  const [evaluationScores, setEvaluationScores] = useState({ technical: 6, communication: 6 });
  const [evaluationReportHTML, setEvaluationReportHTML] = useState('');
  
  // Track unasked questions and time
  const askedQuestionsRef = useRef([]);
  const chatHistoryRef = useRef([]);
  const isInterviewActiveRef = useRef(false);
  const interviewStartTimeRef = useRef(null);

  // Sync refs to avoid speech stale closures
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  const [timeLeft, setTimeLeft] = useState(15 * 60);

  // Notify parent of active interview state for leave interceptor
  useEffect(() => {
    if (onSetAssessmentActive) {
      onSetAssessmentActive(interviewStarted && !interviewComplete);
    }
  }, [interviewStarted, interviewComplete, onSetAssessmentActive]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (interviewStarted && !interviewComplete) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [interviewStarted, interviewComplete]);

  // Handle unmount cleanup to fully clear active speech synthesis and recognition loops
  useEffect(() => {
    isInterviewActiveRef.current = true;
    return () => {
      isInterviewActiveRef.current = false;
      if (onSetAssessmentActive) onSetAssessmentActive(false);
      speech.stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice announcements and listening coordinator
  const speakAndListen = (text, listenCallback) => {
    if (!isInterviewActiveRef.current) return;
    setStatusMsg('Speaking...');
    setCurrentStatusClass('speaking');
    
    speech.speak(text, () => {
      if (!isInterviewActiveRef.current) return;
      setStatusMsg('Listening...');
      setCurrentStatusClass('listening');
      speech.startListening((heard) => {
        if (!isInterviewActiveRef.current) return;
        setStatusMsg('Analyzing response...');
        setCurrentStatusClass('thinking');
        if (listenCallback) listenCallback(heard);
      });
    });
  };

  // 1. Trigger Interview Start
  const handleStartInterview = (topic) => {
    // Flush any ongoing vocal synthesis or listening queues cleanly first
    try {
      speech.stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      console.warn("Queue reset error:", e);
    }

    isInterviewActiveRef.current = true;
    setInterviewStarted(true);
    setQuizComplete(false);
    askedQuestionsRef.current = [];
    setChatHistory([]);
    setTranscriptLines([]);
    interviewStartTimeRef.current = Date.now();
    
    if (topic) {
      setActiveTopic(topic);
      setTopicSelected(true);
      handleConversationalTurn(topic, "The interview is now starting. Start by asking for my introduction.");
    } else {
      // Custom interest capture view
      setTopicSelected(false);
      const msg = "Welcome. To begin, please tell me which tech stacks, languages, or roles you are interested in.";
      setTranscriptLines([{ speaker: 'Interviewer', text: msg }]);
      
      setTimeout(() => {
        if (!isInterviewActiveRef.current) return;
        speakAndListen(msg, (answer) => {
          if (!isInterviewActiveRef.current) return;
          handleProcessInterests(answer);
        });
      }, 1000);
    }
  };

  // 2. Custom interests parser
  const handleProcessInterests = (interestsText) => {
    if (!isInterviewActiveRef.current) return;
    setTranscriptLines(prev => [...prev, { speaker: 'You', text: interestsText }]);
    
    // Extract keywords
    const lower = interestsText.toLowerCase();
    let detectedStack = 'SDE / Full Stack'; // default

    const keywords = {
      'SDE / Full Stack': ['javascript', 'js', 'frontend', 'web', 'react', 'node', 'full stack', 'fullstack', 'mern', 'mean', 'sde', 'backend'],
      'Cyber Security': ['security', 'cyber', 'penetration', 'vulnerability', 'cryptography', 'firewall', 'hack'],
      'Cloud Engineering': ['cloud', 'aws', 'azure', 'gcp', 'terraform', 'vpc', 'scaling', 'infrastructure'],
      'AI Engineering': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning', 'neural', 'llm', 'rag', 'transformer'],
      'DevOps': ['devops', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'pipeline', 'deployment'],
      'Data Science': ['data science', 'data scientist', 'analytics', 'statistics', 'pandas', 'sql', 'wrangling', 'analysis']
    };

    for (const [tech, matchers] of Object.entries(keywords)) {
      if (matchers.some(k => lower.includes(k))) {
        detectedStack = tech;
        break;
      }
    }

    setActiveTopic(detectedStack);
    setTopicSelected(true);

    const stackLabel = detectedStack;
    const ackMsg = `Excellent! I see you are interested in ${stackLabel}. Let's begin the technical questions.`;
    
    setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: ackMsg }]);
    
    speakAndListen(ackMsg, (answer) => {
      if (!isInterviewActiveRef.current) return;
      handleConversationalTurn(detectedStack, "I am interested in " + stackLabel + ". Let's begin the technical interview.");
    });
  };

  // 3. Conversational AI State Machine
  const handleConversationalTurn = async (techStack, userAnswer) => {
    if (!isInterviewActiveRef.current) return;
    
    // Check if 15 minutes have passed
    const elapsed = Date.now() - interviewStartTimeRef.current;
    if (elapsed > 15 * 60 * 1000) {
      handleEndInterview();
      return;
    }

    if (userAnswer && userAnswer !== "The interview is now starting. Start by asking for my introduction.") {
      setTranscriptLines(prev => [...prev, { speaker: 'You', text: userAnswer }]);
    }

    setStatusMsg('Thinking...');
    setCurrentStatusClass('thinking');

    try {
      // Build history payload for the LLM
      const historyPayload = chatHistoryRef.current.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      if (userAnswer) {
         historyPayload.push({ role: 'user', content: userAnswer });
      }

      const elapsedMinutes = Math.floor(elapsed / 60000);
      const instruction = `You are an elite, adaptive technical interviewer conducting a live, real-time voice interview for a ${techStack} role.
Your goal is to assess the candidate dynamically in real time through natural, human-like technical dialogue.
Candidate Profile:
- Name: ${user.name}
- University: ${user.university || 'Not specified'}
- Stream/Branch: ${user.stream || ''} ${user.branch || ''}
Elapsed Time: ${elapsedMinutes} minutes into a 15-minute session. Do NOT end the interview yourself.

INTERVIEW GUIDELINES:
1. Greet the candidate by name if this is the start.
2. Ask sharp, real-time technical questions tailored to ${techStack}.
3. Listen deeply to what the candidate actually says and follow up dynamically (testing edge cases, real production trade-offs, and design rationale).
4. Keep each spoken turn concise and natural (under 50 words) so it speaks cleanly over audio speech synthesis. Always end with your question.

You MUST respond strictly with a valid JSON object matching:
{
  "speech": "<concise text to speak to the candidate, ending with your question>",
  "score": <integer from 1 to 10 evaluating candidate's previous answer. Use 6 for greeting/intro>
}`;

      const response = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          instruction,
          history: historyPayload,
          max_tokens: 1500,
          json_mode: true
        })
      });
      const data = await response.json();
      
      let aiResponse = { speech: "I'm having trouble thinking, let's try that again.", score: 5 };
      try {
        let rawStr = data.response || '';
        // Extract json object if surrounded by extra markdown or reasoning text
        const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiResponse = JSON.parse(jsonMatch[0]);
        } else {
          let cleanedJSON = rawStr.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
          aiResponse = JSON.parse(cleanedJSON);
        }
      } catch (e) {
        console.error("JSON parse error, attempting extraction:", data.response);
        // Fallback string extraction if JSON completely fails
        aiResponse.speech = (data.response || '').replace(/[{}"\\]/g, '').trim() || "Let's continue to the next technical topic.";
      }
      if (userAnswer) {
         chatHistoryRef.current.push({ role: 'user', content: userAnswer, score: aiResponse.score || 5 });
      }
      chatHistoryRef.current.push({ role: 'assistant', content: aiResponse.speech });
      
      setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: aiResponse.speech }]);

      speakAndListen(aiResponse.speech, (answer) => {
        if (!isInterviewActiveRef.current) return;
        handleConversationalTurn(techStack, answer);
      });
    } catch (err) {
      console.error('AI Generation Error:', err);
      handleEndInterview();
    }
  };

  // 5. Ends Voice Interview session
  const handleEndInterview = () => {
    if (!isInterviewActiveRef.current) return;
    setStatusMsg('Completing Interview...');
    setCurrentStatusClass('thinking');

    const closing = "Thank you for the interview. I have a good understanding of your skills now. Let me compile your technical report.";
    setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: closing }]);
    
    speech.speak(closing, () => {
      if (!isInterviewActiveRef.current) return;
      setTimeout(() => {
        if (!isInterviewActiveRef.current) return;
        compileEvaluationFeedback();
      }, 1500);
    });
  };

  // 6. Evaluates report and saves to database
  const compileEvaluationFeedback = async () => {
    if (!isInterviewActiveRef.current) return;
    // Stop voices
    speech.stopListening();
    
    // Calculations (words average and scores)
    let totalScore = 0;
    let totalWords = 0;
    let count = 0;
    
    chatHistoryRef.current.forEach(item => {
      if (item.role === 'user') {
        totalScore += item.score || 5;
        totalWords += (item.content || '').split(' ').length;
        count++;
      }
    });

    count = count || 1;
    const avgScore = totalScore / count;
    const avgWords = totalWords / count;

    const technical = Math.round(avgScore * 10) / 10;
    const communication = Math.min(10, Math.round((avgWords / 30) * 10)) || 6;
    
    setEvaluationScores({ technical, communication });

    const techLabel = activeTopic;

    // Convert chat history array to a readable text transcript for the Agent
    const transcriptText = chatHistoryRef.current.map(msg => 
      `${msg.role.toUpperCase()}: ${msg.content}`
    ).join("\n\n");

    let reportHTML = "<p>Analyzing your performance...</p>";
    setQuizComplete(true);

    try {
      setStatusMsg('Generating personalized report...');
      const response = await apiFetch('/api/ai/report', {
        method: 'POST',
        body: JSON.stringify({
          transcript: transcriptText,
          techStack: techLabel,
          candidateName: user.name,
          candidateEmail: user.email
        })
      });
      const data = await response.json();
      
      if (data.reportHTML) {
        reportHTML = data.reportHTML;
      } else {
        reportHTML = `<p>Failed to parse dynamic report. Raw data: ${JSON.stringify(data)}</p>`;
      }
    } catch (err) {
      console.error('AI Report Generation Error:', err);
      reportHTML = `<p>There was an error connecting to the AI Agent to generate your report.</p>`;
    }

    setEvaluationReportHTML(reportHTML);

    // Save report REST POST database
    try {
      await apiFetch('/api/assessments/interview', {
        method: 'POST',
        body: JSON.stringify({
          scores: { technical, communication },
          report: reportHTML,
          techStack: activeTopic,
          interests: askedQuestionsRef.current,
          questionsAsked: count,
          chatHistory: chatHistoryRef.current,
          duration: 15 // Mock duration in minutes
        })
      });
      console.log('Voice interview saved successfully!');
      // Broadcast real-time update event so Performance Analytics updates immediately
      window.dispatchEvent(new Event('earlyedge_results_updated'));
    } catch (err) {
      console.error(err);
    }
  };

  // PDF Download Engine
  const downloadReportPDF = () => {
    const reportContainer = document.createElement('div');
    reportContainer.innerHTML = evaluationReportHTML;
    document.body.appendChild(reportContainer);

    const options = {
      margin: 0.5,
      filename: `${user.name}_Interview_Report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(options).from(reportContainer).save().then(() => {
      document.body.removeChild(reportContainer);
    });
  };



  // Show initial selector screen
  if (!interviewStarted) {
    return (
      <div className="panel active">
        <h3 style={{ marginBottom: '1.5rem' }}>Practice Interview</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
          Select a topic below to start a voice-guided practice interview. Sage will ask you questions verbally, capture your responses, and generate a brief scorecard to help you improve.
        </p>

        <div className="grid-cards">
          {[
            { name: 'SDE / Full Stack', icon: 'fa-code', color: '#14B8A6', desc: 'Vocal Q&A covering React, Node.js, System Architecture, and Web Microservices.' },
            { name: 'Cyber Security', icon: 'fa-user-shield', color: '#F97316', desc: 'Vocal assessment evaluating Vulnerability Assessment, Cryptography, and Network Security.' },
            { name: 'Cloud Engineering', icon: 'fa-cloud', color: '#3B82F6', desc: 'Evaluate cloud designs, AWS/GCP VPCs, Terraform IaC, and High Availability.' },
            { name: 'AI Engineering', icon: 'fa-brain', color: '#A855F7', desc: 'Vocal testing on Machine Learning Pipelines, Neural Networks, PyTorch, and LLM RAG.' },
            { name: 'DevOps', icon: 'fa-gears', color: '#10B981', desc: 'Evaluate Docker Multi-stage, Kubernetes Pods, CI/CD Actions, and Monitoring.' },
            { name: 'Data Science', icon: 'fa-chart-pie', color: '#EC4899', desc: 'Vocal testing on Pandas Data Wrangling, Feature Scaling, Regression, and SQL.' }
          ].map(dom => (
            <div key={dom.name} className="glass-card" style={{ borderTop: `3px solid ${dom.color}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <h4>{dom.name}</h4>
                  <i className={`fa-solid ${dom.icon}`} style={{ color: dom.color }}></i>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{dom.desc}</p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: dom.color, borderColor: dom.color, color: 'white' }} onClick={() => handleStartInterview(dom.name)}>
                Start Interview
              </button>
            </div>
          ))}

          {/* Custom */}
          <div className="glass-card" style={{ borderTop: '3px solid #64748b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Custom Stack</h4>
                <i className="fa-solid fa-user-gear" style={{ color: '#64748b' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vocal AI will request your specific technology stack interests and build a tailored assessment.</p>
            </div>
            <button className="btn btn-glass" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => handleStartInterview(null)}>
              Start Custom
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER DYNAMIC POST-INTERVIEW REPORT CARD
  // ============================================
  if (interviewComplete) {
    const techLabel = activeTopic.replace(/_/g, ' ').toUpperCase();
    return (
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
        <h4 style={{ marginBottom: '1.5rem' }}>
          <i className="fa-solid fa-medal" style={{ color: 'var(--secondary)' }}></i> Performance Feedback Report
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--primary-glow)', borderRadius: '4px', border: '1px solid var(--primary)' }}>
            <div style={{ fontSize: '2.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{evaluationScores.technical}/10</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{techLabel} Knowledge Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(91, 137, 166, 0.08)', borderRadius: '4px', border: '1px solid var(--secondary)' }}>
            <div style={{ fontSize: '2.5rem', color: 'var(--secondary)', fontWeight: 'bold' }}>{evaluationScores.communication}/10</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Verbal Communication Score</div>
          </div>
        </div>

        {/* Dynamic breakdown injected locally inside CSS styled container */}
        <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', lineHeight: '1.7', fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: evaluationReportHTML }}></div>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => { if (onSwitchView) onSwitchView('results'); }}>
            <i className="fa-solid fa-chart-line" style={{ marginRight: '0.4rem' }}></i> View in Performance Analytics
          </button>
          <button className="btn btn-glass" onClick={() => setInterviewStarted(false)}>
            <i className="fa-solid fa-redo"></i> Take Another Interview
          </button>
          <button className="btn btn-glass" onClick={downloadReportPDF}>
            <i className="fa-solid fa-download"></i> Download Report PDF
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER DYNAMIC VOCAL AI ASSESSMENT CONSOLE
  // ============================================
  // Exit interview handlers
  const handleExitInterview = () => {
    if (window.confirm("Are you sure you want to end and exit this voice interview? Your evaluation report will be generated now.")) {
      speech.stopListening();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      handleEndInterview();
      if (onSetAssessmentActive) onSetAssessmentActive(false);
    }
  };

  const handleCancelInterview = () => {
    if (window.confirm("Are you sure you want to exit and abandon this interview? Your progress will not be saved.")) {
      isInterviewActiveRef.current = false;
      speech.stopListening();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setInterviewStarted(false);
      setQuizComplete(false);
      setChatHistory([]);
      setTranscriptLines([]);
      if (onSetAssessmentActive) onSetAssessmentActive(false);
      if (onExitAssessment) {
        onExitAssessment();
      } else if (onSwitchView) {
        onSwitchView('feed');
      }
    }
  };

  // Format timeLeft
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem', position: 'relative' }}>
      
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          background: timeLeft <= 180 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(37, 99, 235, 0.15)',
          color: timeLeft <= 180 ? '#ef4444' : '#60a5fa',
          padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem',
          border: `1px solid ${timeLeft <= 180 ? '#ef4444' : 'rgba(37, 99, 235, 0.4)'}`
        }}>
          <i className="fa-regular fa-clock" style={{ marginRight: '6px' }}></i>
          {formatTime(timeLeft)}
        </div>
        
        <button
          onClick={handleCancelInterview}
          title="Exit and abandon interview"
          className="btn btn-sm btn-glass"
          style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.3rem 0.6rem' }}
        >
          <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '0.3rem' }}></i> Exit
        </button>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>AI Technical Voice Interview</h3>

      {/* Pulsing robot console */}
      <div style={{
        height: '200px', background: 'var(--bg-dark)', borderRadius: '12px',
        marginBottom: '2rem', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', border: '2px solid var(--border)'
      }}>
        <i className="fa-solid fa-robot" style={{
          fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '1rem',
          animation: speech.isSpeaking ? 'pulse 1s infinite' : 'none'
        }}></i>
        <h4 id="ai-status" style={{ color: 'var(--primary)', letterSpacing: '2px', fontWeight: 'bold' }}>
          {statusMsg.toUpperCase()}
        </h4>
      </div>

      {/* Voice status bar indicators */}
      <div className={`interview-status status-${currentStatusClass}`} style={{ marginBottom: '1.5rem' }}>
        <i className={speech.isListening ? "fa-solid fa-microphone" : speech.isSpeaking ? "fa-solid fa-volume-high" : "fa-solid fa-spinner"}></i>
        <span style={{ marginLeft: '0.5rem' }}>
          {speech.isListening ? 'Microphone Active (Listening...)' : speech.isSpeaking ? 'Interviewer Speaking...' : 'Processing...'}
        </span>
      </div>

      {/* Live transcript logs */}
      <div style={{
        height: '250px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)',
        padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', gap: '0.8rem'
      }}>
        {transcriptLines.map((line, idx) => {
          const isInterviewer = line.speaker === 'Interviewer';
          return (
            <div key={idx} className={`transcript-line ${isInterviewer ? 'transcript-interviewer' : 'transcript-user'}`}>
              <strong style={{ color: isInterviewer ? 'var(--primary)' : 'var(--secondary)' }}>
                {line.speaker}:
              </strong>
              <span style={{ marginLeft: '0.5rem', fontSize: '0.95rem' }}>{line.text}</span>
            </div>
          );
        })}
        {speech.isListening && speech.interimText && (
          <div className="transcript-line transcript-user" style={{ opacity: 0.7 }}>
            <strong style={{ color: 'var(--secondary)' }}>Hearing:</strong>
            <span style={{ marginLeft: '0.5rem', fontStyle: 'italic', fontSize: '0.95rem' }}>{speech.interimText}</span>
          </div>
        )}
      </div>

      {/* Trigger button overlay */}
      {speech.isListening && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-glass" onClick={() => speech.stopListening()} style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            <i className="fa-solid fa-check"></i> Finish Speaking
          </button>
        </div>
      )}
    </div>
  );
}
