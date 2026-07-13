import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { useSpeech } from '../hooks/useSpeech.js';
import html2pdf from 'html2pdf.js';

// Mappings of standard Interview questions (Exactly like legacy script.js!)
const QUESTION_DATABASE = {
  javascript: [
    "What is the difference between 'let', 'const', and 'var'?",
    "Explain closures in JavaScript and give a practical example.",
    "What is the Event Loop in JavaScript and how does it handle concurrency?",
    "Explain the 'this' keyword behavior in different scopes.",
    "What are Promises and how do they differ from async/await?",
    "How does prototypal inheritance work in JS?",
    "What is event bubbling and capturing?",
    "Explain the concept of hoisting."
  ],
  react: [
    "What is the Virtual DOM and how does React reconcile changes?",
    "Explain the Component Lifecycle in React.",
    "What are React Hooks? Name commonly used ones and their use cases.",
    "What is the difference between State and Props?",
    "Explain the useEffect hook dependency array behavior.",
    "What is Prop Drilling and how can you avoid it in larger applications?",
    "What is the Context API in React?",
    "Explain React.memo and useMemo performance optimizations."
  ],
  python: [
    "What are Python decorators and how are they used?",
    "Explain list comprehensions in Python.",
    "What is the difference between a list and a tuple?",
    "How is memory managed in Python?",
    "What is the Global Interpreter Lock (GIL)?",
    "Explain multiple inheritance and MRO in Python."
  ],
  nodejs: [
    "What is the difference between process.nextTick and setImmediate in Node?",
    "Explain the Event Loop phases in Node.js.",
    "What is middleware in Express.js?",
    "How does Node.js handle async concurrency behind the scenes?"
  ],
  machine_learning: [
    "What is the difference between supervised and unsupervised learning?",
    "Explain the bias-variance tradeoff in machine learning.",
    "What is overfitting and how do you prevent it?",
    "Explain the concept of regularization (L1 vs L2 lasso/ridge).",
    "How does a decision tree work?",
    "What is a confusion matrix and F1 score?",
    "Explain Gradient Descent optimization."
  ],
  data_science: [
    "What is the difference between data science and data analytics?",
    "How do you handle missing or skewed data in a dataset?",
    "Explain the Central Limit Theorem.",
    "What is a p-value and how is it used in hypothesis testing?",
    "Explain the difference between correlation and causation.",
    "What is A/B testing and how do you set it up?"
  ],
  full_stack: [
    "Describe the MVC architectural pattern.",
    "What is the difference between SQL and NoSQL databases? When do you choose which?",
    "How does HTTPS establish secure connections?",
    "What is CORS and how do you resolve CORS errors in Express?",
    "Explain REST vs GraphQL API designs.",
    "How do you horizontally and vertically scale a web application?"
  ],
  cloud_computing: [
    "What are the service models in cloud computing (IaaS, PaaS, SaaS)?",
    "Explain the concept of virtualization in cloud servers.",
    "What is a container and how is it different from a VM?",
    "What is Load Balancing and what algorithms are used?",
    "Explain serverless computing and cold starts."
  ],
  computer_science: [
    "Explain Big O notation and calculate space/time complexity of binary search.",
    "What is the difference between a stack and a queue? Name practical use cases.",
    "How does a hash map resolve key collisions?",
    "Explain the difference between a process and a thread.",
    "What is a deadlock and what are the four Coffman conditions?",
    "Explain TCP vs UDP protocols."
  ],
  system_design: [
    "How would you design a highly scalable URL shortener like Bitly?",
    "Design a distributed rate limiter.",
    "How do you scale a database? Explain sharding and replication.",
    "Explain Load Balancing and caching layers in system design.",
    "What are Microservices? Explain their pros and cons."
  ]
};

const BEHAVIORAL_QUESTIONS = [
  "Tell me about a challenging technical project you worked on and how you resolved hurdles.",
  "How do you handle technical conflict in a development team?",
  "Describe a time you failed in an implementation and what you learned.",
  "Where do you see yourself in 5 years in your tech career?",
  "What is your greatest technical strength and weakness?"
];

export default function AIInterview() {
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
  
  // Track unasked questions
  const askedQuestionsRef = useRef([]);
  const chatHistoryRef = useRef([]);
  const isInterviewActiveRef = useRef(false);

  // Sync refs to avoid speech stale closures
  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  // Handle unmount cleanup to fully clear active speech synthesis and recognition loops
  useEffect(() => {
    isInterviewActiveRef.current = true;
    return () => {
      isInterviewActiveRef.current = false;
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
    
    if (topic) {
      setActiveTopic(topic);
      setTopicSelected(true);
      
      const formatTopic = topic.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const msg = `Starting ${formatTopic} technical interview. I will ask you a series of core technical questions. Let's begin.`;
      
      setTranscriptLines([{ speaker: 'Interviewer', text: msg }]);
      
      setTimeout(() => {
        if (!isInterviewActiveRef.current) return;
        speakAndListen(msg, (answer) => {
          if (!isInterviewActiveRef.current) return;
          handleProcessAnswer(msg, answer, 'technical');
        });
      }, 1000);
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
    let detectedStack = 'computer_science'; // default

    const keywords = {
      'javascript': ['javascript', 'js', 'frontend', 'web'],
      'react': ['react', 'react.js', 'hooks', 'redux'],
      'nodejs': ['node', 'node.js', 'backend', 'express'],
      'python': ['python', 'py', 'django', 'flask'],
      'machine_learning': ['machine learning', 'ml', 'ai', 'artificial intelligence', 'deep learning'],
      'data_science': ['data science', 'data scientist', 'analytics', 'statistics', 'pandas'],
      'full_stack': ['full stack', 'fullstack', 'mern', 'mean'],
      'cloud_computing': ['cloud', 'aws', 'azure', 'gcp', 'devops', 'docker', 'kubernetes'],
      'computer_science': ['computer science', 'cs', 'algorithms', 'data structures', 'general', 'software', 'coding', 'programming', 'intern', 'development', 'engineer'],
      'system_design': ['system design', 'architecture', 'scalability', 'distributed systems']
    };

    for (const [tech, matchers] of Object.entries(keywords)) {
      if (matchers.some(k => lower.includes(k))) {
        detectedStack = tech;
        break;
      }
    }

    setActiveTopic(detectedStack);
    setTopicSelected(true);

    const stackLabel = detectedStack.replace(/_/g, ' ').toUpperCase();
    const ackMsg = `Excellent! I see you are interested in ${stackLabel}. Let's begin the technical questions.`;
    
    setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: ackMsg }]);
    
    speakAndListen(ackMsg, (answer) => {
      if (!isInterviewActiveRef.current) return;
      // Launch first question
      askNextQuestion(detectedStack);
    });
  };

  // 3. Loops and fetches next questions
  const askNextQuestion = (techStack) => {
    if (!isInterviewActiveRef.current) return;
    const historyCount = chatHistoryRef.current.length;
    
    // Maximum questions standard is 6
    if (historyCount >= 6) {
      handleEndInterview();
      return;
    }

    // Get unasked question
    let questionText = '';
    const pool = QUESTION_DATABASE[techStack] || QUESTION_DATABASE.computer_science;
    const available = pool.filter(q => !askedQuestionsRef.current.includes(q));

    if (available.length > 0) {
      questionText = available[Math.floor(Math.random() * available.length)];
    } else {
      // fallback
      questionText = BEHAVIORAL_QUESTIONS.find(q => !askedQuestionsRef.current.includes(q));
    }

    if (!questionText) {
      handleEndInterview();
      return;
    }

    askedQuestionsRef.current.push(questionText);
    setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: questionText }]);

    speakAndListen(questionText, (answer) => {
      if (!isInterviewActiveRef.current) return;
      handleProcessAnswer(questionText, answer, 'technical');
    });
  };

  // 4. Processes candidate verbal answer
  const handleProcessAnswer = async (question, answer, type) => {
    if (!isInterviewActiveRef.current) return;
    setTranscriptLines(prev => [...prev, { speaker: 'You', text: answer }]);

    // Evaluate verbal answer metrics (identical to legacy calculations)
    const answerLower = answer.toLowerCase();
    const wordCount = answer.split(' ').length;
    let score = 5; // Base

    if (wordCount > 30) score += 2;
    else if (wordCount > 15) score += 1;

    const technicalTerms = ['because', 'example', 'approach', 'solution', 'optimize', 'design', 'pattern'];
    technicalTerms.forEach(term => {
      if (answerLower.includes(term)) score += 0.5;
    });

    score = Math.min(10, Math.max(1, score));

    // Save history item
    const newChatHistory = [
      ...chatHistoryRef.current,
      { question, answer, score, type, timestamp: Date.now() }
    ];
    setChatHistory(newChatHistory);

    // Decision tree: Follow-up trigger if score drops below 4
    if (score < 4 && Math.random() > 0.5) {
      const followUp = "Could you elaborate more on that point? I'd like to understand your thinking better.";
      setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: followUp }]);
      speakAndListen(followUp, (elaboration) => {
        if (!isInterviewActiveRef.current) return;
        handleProcessAnswer(followUp, elaboration, 'followup');
      });
    } else {
      // Normal flow: ask next question
      const scoreResponses = {
        high: ["Excellent answer, very thorough.", "Great explanation, very clear.", "Perfect, exactly what I was looking for."],
        mid: ["Good answer, thanks for explaining.", "I understand your approach.", "Thanks for sharing that perspective."],
        low: ["Okay, I see.", "Alright.", "Got it."]
      };
      
      const responses = score >= 8 ? scoreResponses.high : score >= 6 ? scoreResponses.mid : scoreResponses.low;
      const ack = responses[Math.floor(Math.random() * responses.length)];

      setTranscriptLines(prev => [...prev, { speaker: 'Interviewer', text: ack }]);
      
      setStatusMsg('Speaking...');
      setCurrentStatusClass('speaking');
      speech.speak(ack, () => {
        if (!isInterviewActiveRef.current) return;
        setTimeout(() => {
          if (!isInterviewActiveRef.current) return;
          askNextQuestion(activeTopic);
        }, 800);
      });
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
    
    chatHistoryRef.current.forEach(item => {
      totalScore += item.score;
      totalWords += item.answer.split(' ').length;
    });

    const count = chatHistoryRef.current.length || 1;
    const avgScore = totalScore / count;
    const avgWords = totalWords / count;

    const technical = Math.round(avgScore * 10) / 10;
    const communication = Math.min(10, Math.round((avgWords / 30) * 10)) || 6;
    
    setEvaluationScores({ technical, communication });

    const techLabel = activeTopic.replace(/_/g, ' ').toUpperCase();
    const strengths = [
      "Demonstrates solid conceptual understandings",
      "Clear problem-solving approach",
      "Robust practical thinking",
      "Fast learning adaptability"
    ].sort(() => Math.random() - 0.5).slice(0, 3);

    const recs = {
      react: ["Build complex SPA structures with context managers", "Learn React.memo performance optimizations", "Review react testing libraries"],
      javascript: ["Master asynchronous promise logic", "Practice with ES6 prototype chains", "Solve functional algorithm challenges"],
      nodejs: ["Build secure REST APIs with token authentications", "Review express middleware mappings", "Practice database operations"]
    };

    const techRecs = recs[activeTopic] || ["Build completed web products", "Practice scaling architectures", "Review clean coding conventions"];

    const reportHTML = `
      <div style="font-family: 'Outfit', sans-serif; color: #000; padding: 20px;">
        <h2 style="color: #7c3aed; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-bottom: 20px;">
          Technical Interview Report: ${techLabel}
        </h2>
        
        <div style="margin-bottom: 20px; font-size: 15px; line-height: 1.5;">
          <p><strong>Candidate Name:</strong> ${user.name}</p>
          <p><strong>Email Address:</strong> ${user.email}</p>
          <p><strong>Assessment Path:</strong> Dynamic AI Voice Interview</p>
          <p><strong>Focus Area:</strong> ${techLabel} Specialization</p>
          <p><strong>Questions Evaluated:</strong> ${count}</p>
        </div>

        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; border: 1px solid #7c3aed; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #7c3aed;">${technical}/10</div>
            <div style="font-size: 12px; color: #555; font-weight: bold; margin-top: 5px;">TECHNICAL CAPABILITY</div>
          </div>
          <div style="flex: 1; border: 1px solid #0891b2; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #0891b2;">${communication}/10</div>
            <div style="font-size: 12px; color: #555; font-weight: bold; margin-top: 5px;">VERBAL COMMUNICATION</div>
          </div>
        </div>

        <h3 style="color: #333; margin-top: 25px;">Candidate Key Strengths:</h3>
        <ul style="padding-left: 20px; line-height: 1.6;">
          ${strengths.map(s => `<li>${s}</li>`).join('')}
        </ul>

        <h3 style="color: #333; margin-top: 25px;">Strategic Recommendations:</h3>
        <ul style="padding-left: 20px; line-height: 1.6;">
          ${techRecs.map(r => `<li>${r}</li>`).join('')}
        </ul>

        <p style="margin-top: 40px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 15px;">
          EarlyEdge Assessment Engine • Evaluated on ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    setEvaluationReportHTML(reportHTML);
    setQuizComplete(true);

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

  const handleExitInterview = () => {
    if (confirm('Exit active voice interview? Any unsaved scoring data will be lost.')) {
      isInterviewActiveRef.current = false;
      speech.stopListening();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setInterviewStarted(false);
      setQuizComplete(false);
    }
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
          {/* Full Stack */}
          <div className="glass-card" style={{ borderTop: '3px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Full Stack Developer</h4>
                <i className="fa-solid fa-layer-group" style={{ color: '#3b82f6' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vocal Q&A covering REST vs GraphQL, CORS mappings, HTTPS protocols, and server scale architectures.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#3b82f6', color: 'white' }} onClick={() => handleStartInterview('full_stack')}>
              Start Interview
            </button>
          </div>

          {/* Machine Learning */}
          <div className="glass-card" style={{ borderTop: '3px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Machine Learning</h4>
                <i className="fa-solid fa-brain" style={{ color: '#8b5cf6' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vocal assessment evaluating ML bias/variance tradeoffs, decision trees, L1/L2 regularizations, and neural algorithms.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#8b5cf6', color: 'white' }} onClick={() => handleStartInterview('machine_learning')}>
              Start Interview
            </button>
          </div>

          {/* Cloud Computing */}
          <div className="glass-card" style={{ borderTop: '3px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Cloud Computing</h4>
                <i className="fa-solid fa-cloud" style={{ color: '#f59e0b' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Evaluate cloud designs, container vs VM structures, serverless paradigms, and distributed balancers.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#f59e0b', color: 'white' }} onClick={() => handleStartInterview('cloud_computing')}>
              Start Interview
            </button>
          </div>

          {/* CS Fundamentals */}
          <div className="glass-card" style={{ borderTop: '3px solid #ec4899', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>CS Fundamentals</h4>
                <i className="fa-solid fa-microchip" style={{ color: '#ec4899' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Vocal testing on Big O notation complexities, hash maps collisions, deadlocks, and TCP/UDP sockets.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', background: '#ec4899', color: 'white' }} onClick={() => handleStartInterview('computer_science')}>
              Start Interview
            </button>
          </div>

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

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '2.5rem' }}>
          <button className="btn btn-primary" onClick={() => setInterviewStarted(false)}>
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
  return (
    <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem', position: 'relative' }}>
      <button onClick={handleExitInterview} style={{
        position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.8rem', zIndex: 100
      }}>
        <i className="fa-solid fa-xmark"></i>
      </button>

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
