import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function AICareerCoach({ onSwitchView }) {
  const { user, apiFetch } = useContext(AuthContext);

  const [mockTests, setMockTests] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Format message text to HTML so "**" is never rendered literally
  const formatMessageHtml = (rawText) => {
    if (!rawText) return '';
    let clean = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');
    clean = clean.replace(/\*\*/g, ''); // Safety fallback
    return clean;
  };

  // Chat window state with initial greeting
  const [messages, setMessages] = useState([
    {
      id: 'msg-init',
      sender: 'Sage',
      sentiment: '🚀 Strategic & High-Energy',
      text: `Hey ${user?.name || 'Talent'}! I'm Sage, your AI Career Guide and Engineering Mentor 🤖✨\n\nI've analyzed your profile and test records. You can ask me anything about Data Structures, React, System Design, Python ML, DevOps, Resume building, or your Technical Quotient (TQ) Score!`,
      timestamp: Date.now(),
      action: null
    }
  ]);

  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSentiment, setCurrentSentiment] = useState('🧠 Analytical & Empathetic');
  const chatEndRef = useRef(null);

  // Fetch student performance data
  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/assessments/results');
      const data = await res.json();
      if (data.success && isMountedRef.current) {
        setMockTests(data.mockTests || []);
        setInterviews(data.interviews || []);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Calculate Technical Quotient Score (0 to 1000)
  const calculateTQ = () => {
    let score = 350; // Base score
    if (user?.isVerified) score += 200; // Verification bonus

    mockTests.forEach(test => {
      const accuracy = test.accuracy || 0;
      score += Math.round(accuracy * 2.5);
    });

    interviews.forEach(int => {
      const tech = int.scores?.technical || 5;
      const comm = int.scores?.communication || 5;
      score += Math.round(tech * 15) + Math.round(comm * 10);
    });

    return Math.min(1000, score);
  };

  const getCompetencyValue = (category) => {
    const relevant = mockTests.filter(t => (t.type || '').toLowerCase().includes(category.toLowerCase()));
    if (relevant.length === 0) return 0;
    const total = relevant.reduce((acc, t) => acc + (t.accuracy || 0), 0);
    return Math.round(total / relevant.length);
  };

  const getInterviewAvg = (field) => {
    if (interviews.length === 0) return 0;
    const total = interviews.reduce((acc, i) => acc + (i.scores?.[field] || 5), 0);
    return Math.round((total / interviews.length) * 10) / 10;
  };

  // Sentiment Detection & Response Generator Engine
  const detectSentimentAndResponse = (query) => {
    const queryLower = query.toLowerCase();
    const currentScore = calculateTQ();
    let sentiment = '🧠 Analytical & Educational';
    let text = '';
    let action = null;

    // Detect Emotional Sentiment
    if (queryLower.match(/\b(scared|worried|nervous|anxious|fail|hard|stuck|lost|can't|help me)\b/)) {
      sentiment = '💙 Empathetic & Reassuring';
    } else if (queryLower.match(/\b(thanks|great|awesome|good|love|cool|yay|happy|amazing)\b/)) {
      sentiment = '🌟 Enthusiastic & Celebrating';
    } else if (queryLower.match(/\b(score|tq|hire|squad|faang|salary|level|top|best|master)\b/)) {
      sentiment = '🚀 Strategic & High-Energy';
    }

    // Knowledge Base Router (NO raw ** characters)
    if (queryLower.includes('hi') || queryLower.includes('hello') || queryLower.includes('hey') || queryLower.includes('yo')) {
      text = `Hello ${user?.name || 'there'}! I'm Sage, your AI Career Guide. 

I'm feeling great today and ready to accelerate your engineering journey! We can audit your Technical Score (${currentScore}/1000), create customized study roadmaps, review coding concepts, or practice mock interviews.

What would you like to explore today?`;
    } else if (queryLower.includes('score') || queryLower.includes('tq') || queryLower.includes('progress') || queryLower.includes('status') || queryLower.includes('audit')) {
      sentiment = '📊 Diagnostic & Strategic';
      text = `Here is your <strong>Live Technical Quotient (TQ) Audit</strong>:
      
🏆 <strong>Overall TQ Score</strong>: <strong>${currentScore}/1000</strong> (${currentScore >= 800 ? 'Elite Tier' : currentScore >= 600 ? 'High Tier' : 'Emerging Talent'})
🛡️ <strong>Verification Status</strong>: ${user?.isVerified ? '✓ Verified Badge Active (Recruiter Trusted!)' : '✗ Unverified (Take the verification quiz to unlock job locks)'}
🗣️ <strong>Voice Communication</strong>: ${getInterviewAvg('communication') ? `${getInterviewAvg('communication')}/10` : 'No mock interviews recorded'}
💻 <strong>Technical Depth</strong>: ${getInterviewAvg('technical') ? `${getInterviewAvg('technical')}/10` : 'No mock interviews recorded'}
📝 <strong>Mock Tests Completed</strong>: ${mockTests.length} tests logged

<em>Sage's Recommendation</em>: To boost your score past 850+, complete at least 2 mock tests with 80%+ accuracy and log one AI Voice Interview!`;
      action = { type: 'tests', label: 'Take Verification Quiz' };
    } else if (queryLower.includes('react') || queryLower.includes('frontend')) {
      text = `Here is your customized <strong>React 18 & Frontend Engineering Roadmap</strong>:

1. <strong>JavaScript & Closures</strong>: Master ES6+, Promises, Async/Await, and Event Loop.
2. <strong>React Fundamentals</strong>: Understand Virtual DOM diffing, JSX, and component lifecycle.
3. <strong>State Management</strong>: Hooks (useState, useReducer, useContext) and atomic stores (Zustand / Redux Toolkit).
4. <strong>Performance Tuning</strong>: Learn how useMemo and useCallback prevent unnecessary render cascades.
5. <strong>Modern Meta-Frameworks</strong>: Server Components (RSC) and SSR in Next.js 14+.

<em>Sage's Pro Tip</em>: Practice explaining React re-rendering in plain English during interviews!`;
      action = { type: 'tests', label: 'Take Full Stack Test' };
    } else if (queryLower.includes('system design') || queryLower.includes('architecture') || queryLower.includes('scale') || queryLower.includes('microservices')) {
      sentiment = '🧠 System Architecture Mode';
      text = `When answering <strong>System Design</strong> questions, follow this 5-step framework:

1. <strong>Requirements & Scope</strong>: Distinguish functional requirements from non-functional metrics (e.g., 100k QPS, <200ms latency, 99.99% SLA).
2. <strong>High-Level Diagram</strong>: Draw Client → Load Balancer → API Gateways → Microservices → Database.
3. <strong>Storage & Caching Strategy</strong>: Choose SQL (PostgreSQL for ACID) vs NoSQL (MongoDB/Cassandra for write volume) + Redis cache layer.
4. <strong>Scalability Bottlenecks</strong>: Explain DB Read Replicas, Sharding, Data Partitioning, and Message Queues (Kafka/RabbitMQ).
5. <strong>Resilience</strong>: Rate limiting, Circuit breakers, and Multi-region failovers.`;
      action = { type: 'interviews', label: 'Practice System Design Interview' };
    } else if (queryLower.includes('dsa') || queryLower.includes('algorithm') || queryLower.includes('data structure') || queryLower.includes('tree') || queryLower.includes('dp')) {
      text = `For <strong>Data Structures & Algorithms (DSA)</strong> interviews, prioritize these core patterns:

• <strong>Two Pointers & Sliding Window</strong>: Great for array/string range problems (e.g. Longest Substring Without Repeating Characters).
• <strong>Trees & Graphs</strong>: Master BFS (shortest path) and DFS (backtracking, topological sort).
• <strong>Dynamic Programming</strong>: Practice Top-Down (Memoization) vs Bottom-Up (Tabulation) on classics like 0/1 Knapsack & Longest Common Subsequence.
• <strong>Big-O Analysis</strong>: Always speak your time O(N) and space O(1) complexity out loud while coding!`;
      action = { type: 'tests', label: 'Take DSA Mock Quiz' };
    } else if (queryLower.includes('python') || queryLower.includes('ml') || queryLower.includes('machine learning') || queryLower.includes('data science')) {
      text = `Here is your <strong>Python & Machine Learning Roadmap</strong>:

1. <strong>Core Data Stack</strong>: NumPy vectorization, Pandas DataFrames, and Matplotlib data visualization.
2. <strong>Supervised Learning</strong>: Linear/Logistic Regression, Decision Trees, Random Forests, and Gradient Boosting (XGBoost).
3. <strong>Model Evaluation</strong>: Explain Precision, Recall, F1-Score, ROC-AUC, and Overfitting vs Underfitting (Bias-Variance Tradeoff).
4. <strong>Deep Learning Foundations</strong>: PyTorch / TensorFlow tensors, backpropagation, and Neural Network activation functions.`;
      action = { type: 'interviews', label: 'Start ML Mock Interview' };
    } else if (queryLower.includes('devops') || queryLower.includes('docker') || queryLower.includes('kubernetes') || queryLower.includes('git')) {
      text = `For <strong>DevOps & Cloud Infrastructure</strong>:

• <strong>Containerization</strong>: Master Dockerfile multi-stage builds and base image optimizations.
• <strong>Orchestration</strong>: Understand Kubernetes Deployments, Services, Ingress controllers, and ConfigMaps.
• <strong>CI/CD Automation</strong>: Build automated GitHub Actions / GitLab CI pipelines for automated linting, testing, and deployment.
• <strong>Git Mastery</strong>: Be confident explaining git rebase vs git merge and resolving merge conflicts cleanly.`;
    } else if (queryLower.includes('resume') || queryLower.includes('cv') || queryLower.includes('behavioral') || queryLower.includes('star') || queryLower.includes('interview')) {
      text = `For <strong>Behavioral & HR Interviews</strong>, use the <strong>STAR Method</strong>:

• <strong>S - Situation</strong>: Set the scene (e.g. "Our API latency spiked to 2.5s under peak load").
• <strong>T - Task</strong>: State your role (e.g. "I was tasked with identifying the bottleneck and restoring response time under 150ms").
• <strong>A - Action</strong>: Explain what YOU coded or designed (e.g. "I indexed the MongoDB collection and added a Redis cache").
• <strong>R - Result</strong>: Quantify the business impact (e.g. "Latency dropped by 94% and server load reduced by half").

<em>Sage's tip</em>: Recruiters love measurable metrics on your resume!`;
      action = { type: 'interviews', label: 'Practice AI Voice Interview' };
    } else if (queryLower.includes('verified') || queryLower.includes('badge') || queryLower.includes('unlock')) {
      text = `🛡️ <strong>How to Get Verified on EarlyEdge</strong>:

1. Click <strong>Get Verified</strong> in the top navigation bar or go to the <strong>Mock Tests</strong> tab.
2. Complete the <strong>Skill Verification Quiz</strong> with at least 70% passing score.
3. Once verified, your candidate card receives the <strong>Verified Talent Badge</strong> and unlocks exclusive time-locked startup job listings!`;
      action = { type: 'tests', label: 'Get Verified Now' };
    } else {
      text = `That's a thoughtful question! When approaching technical challenges in modern software engineering, I recommend structuring your execution cleanly:

1. <strong>Deconstruct the Problem</strong>: Identify the core data structures and boundary constraints.
2. <strong>Draft a Prototype</strong>: Start with a working baseline before optimizing prematurely.
3. <strong>Optimize Performance</strong>: Refactor bottlenecks, reduce redundant operations, and add automated tests.
4. <strong>Quantify Results</strong>: Test edge cases and benchmark throughput.

Tell me more about what role or skill you want to target next (e.g. Full Stack, Backend, Data Science, or DevOps)!`;
    }

    return { sentiment, text, action };
  };

  // Word-by-Word Streaming Response Helper
  const streamBotMessage = (messageObj) => {
    const words = messageObj.text.split(' ');
    let currentText = '';
    const botMsgId = `bot-${Date.now()}`;

    // Add empty placeholder message first
    setMessages(prev => [
      ...prev,
      {
        id: botMsgId,
        sender: 'Sage',
        sentiment: messageObj.sentiment,
        text: '',
        timestamp: Date.now(),
        action: messageObj.action
      }
    ]);

    setIsTyping(true);

    let wordIdx = 0;
    const interval = setInterval(() => {
      if (wordIdx < words.length && isMountedRef.current) {
        currentText += (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        const updatedText = currentText;

        setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: updatedText } : m));
        wordIdx++;
      } else {
        clearInterval(interval);
        if (isMountedRef.current) {
          setIsTyping(false);
        }
      }
    }, 35);
  };

  // Submit Handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userQuery = chatInput.trim();
    const userMsgObj = {
      id: `user-${Date.now()}`,
      sender: 'You',
      text: userQuery,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsgObj]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await apiFetch('/api/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          instruction: "You are SAGE, an AI Career Coach. Respond to the user's query thoughtfully.",
          input_text: userQuery,
          max_tokens: 150
        })
      });
      const data = await response.json();
      const aiResponse = data.response || "I'm having trouble thinking right now. Let's try again.";
      
      const sentiment = "🧠 Analytical & Educational";
      
      if (isMountedRef.current) {
        streamBotMessage({ sentiment, text: aiResponse, action: null });
      }
    } catch (err) {
      console.error('AI Chat Error:', err);
      // Fallback
      const { sentiment, text, action } = detectSentimentAndResponse(userQuery);
      setCurrentSentiment(sentiment);
      if (isMountedRef.current) {
        streamBotMessage({ sentiment, text, action });
      }
    }
  };

  // Quick Prompt Chips
  const handleQuickPrompt = (promptText) => {
    if (isTyping) return;
    setChatInput(promptText);
  };

  return (
    <div className="panel active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>Coach Sage AI</span>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '12px', border: '1px solid var(--primary)' }}>
              Agent 2.0 Live
            </span>
          </h3>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Real-time conversational mentor with Technical Quotient (TQ) scoring, domain knowledge, and sentiment intelligence.
          </p>
        </div>
      </div>

      {/* STATS OVERVIEW BOARD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* TQ SCORE CARD */}
        <div className="glass-card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', borderLeft: '4px solid var(--primary)', position: 'relative'
        }}>
          <i className="fa-solid fa-gauge-high" style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '0.8rem' }}></i>
          <h4 style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Technical Quotient (TQ)
          </h4>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0.3rem 0' }}>
            {calculateTQ()}<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/1000</span>
          </div>
          
          <div style={{ width: '180px', height: '6px', background: 'var(--border)', borderRadius: '3px', margin: '0 auto 0.8rem', overflow: 'hidden' }}>
            <div style={{ width: `${(calculateTQ() / 1000) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            {calculateTQ() >= 800 ? '👑 Elite Professional Level' : calculateTQ() >= 600 ? '🚀 High Tier Talent' : '🌱 Emerging Talent'}
          </p>
        </div>

        {/* SKILL COMPETENCY BREAKDOWN */}
        <div className="glass-card" style={{ padding: '1.8rem' }}>
          <h4 style={{ marginBottom: '1rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
            <i className="fa-solid fa-chart-radar"></i> Skill Competencies
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>JavaScript & Full Stack</span>
                <strong>{getCompetencyValue('JavaScript') || getCompetencyValue('Full Stack') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('JavaScript') || getCompetencyValue('Full Stack') || 0}%`, height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>Python & Data Science / ML</span>
                <strong>{getCompetencyValue('Machine Learning') || getCompetencyValue('Data Science') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('Machine Learning') || getCompetencyValue('Data Science') || 0}%`, height: '100%', background: 'var(--secondary)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                <span>DevOps & Testing</span>
                <strong>{getCompetencyValue('Software Testing') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('Software Testing') || 0}%`, height: '100%', background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHAT CONSOLE */}
      <div className="glass-card" style={{ maxWidth: '950px', margin: '0 auto', padding: '2rem' }}>
        
        {/* CONSOLE HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', fontSize: '1.2rem'
            }}>
              🧙‍♂️
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem' }}>Sage Agent Console</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online & Ready</span>
            </div>
          </div>

          <span style={{
            fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem',
            borderRadius: '20px', border: '1px solid var(--border)', color: 'var(--primary)'
          }}>
            {currentSentiment}
          </span>
        </div>

        {/* MESSAGES VIEW */}
        <div style={{
          height: '380px', overflowY: 'auto', background: 'rgba(0,0,0,0.25)',
          padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.2rem'
        }}>
          {messages.map((msg) => {
            const isBot = msg.sender === 'Sage';
            return (
              <div key={msg.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end'
              }}>
                <div style={{
                  maxWidth: '82%', padding: '0.9rem 1.3rem', borderRadius: '12px',
                  background: isBot ? 'rgba(255,255,255,0.04)' : 'var(--primary-glow)',
                  border: isBot ? '1px solid var(--border)' : '1px solid var(--primary)',
                  color: 'white', fontSize: '0.93rem', lineHeight: '1.6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', gap: '1rem' }}>
                    <strong style={{ fontSize: '0.78rem', color: isBot ? 'var(--primary)' : 'var(--secondary)' }}>
                      {msg.sender}
                    </strong>
                    {isBot && msg.sentiment && (
                      <span style={{ fontSize: '0.68rem', opacity: 0.7, fontStyle: 'italic' }}>
                        {msg.sentiment}
                      </span>
                    )}
                  </div>
                  
                  {/* Formatted HTML Message Content - No raw ** characters */}
                  <div
                    dangerouslySetInnerHTML={{ __html: formatMessageHtml(msg.text) }}
                    style={{ whiteSpace: 'pre-line' }}
                  />

                  {/* Optional Action Card */}
                  {isBot && msg.action && onSwitchView && (
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px dashed var(--border)' }}>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onSwitchView(msg.action.type)}
                        style={{ fontSize: '0.78rem', padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <i className="fa-solid fa-arrow-right"></i> {msg.action.label}
                      </button>
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', marginInline: '0.5rem' }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
          {isTyping && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{
                padding: '0.6rem 1rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <i className="fa-solid fa-brain fa-spin" style={{ color: 'var(--primary)' }}></i>
                <span>Sage is thinking & typing...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* QUICK PROMPT CHIPS */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '0.3rem' }}>Quick Prompts:</span>
          {[
            "🚀 React 30-Day Path",
            "📊 Audit My TQ Score",
            "🧠 System Design Tips",
            "💬 Behavioral STAR Method",
            "🛡️ Get Verified Info",
            "💡 Explain Closures"
          ].map((promptText, pIdx) => (
            <button
              key={pIdx}
              type="button"
              className="btn btn-sm btn-glass"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: '14px' }}
              onClick={() => handleQuickPrompt(promptText)}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* INPUT BAR */}
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.8rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask Sage anything about code, interview questions, or your TQ score..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            style={{ flex: 1, marginBottom: 0 }}
            disabled={isTyping}
          />
          <button className="btn btn-primary" type="submit" style={{ padding: '0 1.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isTyping || !chatInput.trim()}>
            <span>Send</span>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>

      </div>
    </div>
  );
}
