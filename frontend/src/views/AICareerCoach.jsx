import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function AICareerCoach() {
  const { user, apiFetch } = useContext(AuthContext);

  const [mockTests, setMockTests] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);

  // Mount/Unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Chat window states
  const [messages, setMessages] = useState([
    {
      sender: 'Sage',
      text: `Hey ${user?.name || 'Talent'}! I'm Sage, your career guide. I've looked at your profile and test history to see how we can build up your portfolio.\n\nAsk me anything! For example: "How can I improve my JavaScript?", "What's a good React study path?", or "How is my overall score doing?"`,
      timestamp: Date.now()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch test logs and mock interviews from express
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

  // Simple auto-scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // Calculate a general developer score out of 1000.
  // TODO: save this directly on the user model later to keep queries fast.
  const calculateTQ = () => {
    let score = 300; // Starter points
    if (user.isVerified) score += 200; // Passed verification test bonus

    // Add points for mock tests
    mockTests.forEach(test => {
      const accuracy = test.accuracy || 0;
      score += Math.round(accuracy * 2.5); // Up to 250 points per test
    });

    // Add points for practice interviews
    interviews.forEach(int => {
      const tech = int.scores?.technical || 5;
      const comm = int.scores?.communication || 5;
      score += Math.round(tech * 15) + Math.round(comm * 10); // Up to 250 points per interview
    });

    return Math.min(1000, score);
  };

  const getCompetencyValue = (category) => {
    const relevant = mockTests.filter(t => t.type.toLowerCase().includes(category.toLowerCase()));
    if (relevant.length === 0) return 0;
    const total = relevant.reduce((acc, t) => acc + (t.accuracy || 0), 0);
    return Math.round(total / relevant.length);
  };

  const getInterviewAvg = (field) => {
    if (interviews.length === 0) return 0;
    const total = interviews.reduce((acc, i) => acc + (i.scores?.[field] || 5), 0);
    return Math.round((total / interviews.length) * 10) / 10;
  };

  // Mock advisor responses. Simple keyword matching does the job cleanly for now!
  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userQuery = chatInput.trim();
    setMessages(prev => [...prev, { sender: 'You', text: userQuery, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';
      const queryLower = userQuery.toLowerCase();
      const currentScore = calculateTQ();

      // Smart Natural Language responses
      if (queryLower.includes('hi') || queryLower.includes('hello') || queryLower.includes('hey') || queryLower.includes('greetings') || queryLower.includes('yo')) {
        botResponse = `Hello there! I am Sage, your virtual career mentor. 

I'm here to help you improve your **Technical Score**, prepare for assessments, draft roadmaps, and review your profile details.

What are you working on today? Tell me what language or framework you are learning!`;
      } else if (queryLower.includes('help') || queryLower.includes('who are you') || queryLower.includes('what can you do') || queryLower.includes('capabilities') || queryLower.includes('guide')) {
        botResponse = `I am your automated Career Guide here at EarlyEdge. I can:
- Generate custom **study roadmaps** (e.g. ask me *"Give me a React roadmap"*)
- Audit your active **Technical Score and verify status** (e.g. ask *"How is my score?"*)
- Offer tips to enhance your **resume and portfolio** (e.g. ask *"How do I improve my resume?"*)
- Give general **CS interview advice** (e.g. ask *"How do I answer system design questions?"*)`;
      } else if (queryLower.includes('score') || queryLower.includes('tq') || queryLower.includes('progress') || queryLower.includes('status')) {
        botResponse = `I've audited your active scores. Your current **Technical Score** is **${currentScore}/1000**.
        
* **Verbal Communication**: Your current average is **${getInterviewAvg('communication') || 'No interviews logged yet'}/10**.
* **Technical Capability**: Your current average is **${getInterviewAvg('technical') || 'No interviews logged yet'}/10**.
* **Verified Status**: ${user.isVerified ? '✓ Verified (Great job!)' : '✗ Unverified (Take the verification test in your Tests tab to unlock locked opportunities)'}.
        
*Sage's tip*: To boost your score past 800, complete a couple of mock tests with at least 75% accuracy and log one voice interview!`;
      } else if (queryLower.includes('react')) {
        botResponse = `Here's a practical study path for **React.js**:
1. **JS Baseline**: Make sure you are comfortable with ES6 features, especially destructuring, array methods (\`.map()\`, \`.filter()\`), and Promises.
2. **State Management**: Learn how hooks handle state re-renders. Review when to use basic state vs Context or global stores like Redux.
3. **Performance**: Learn how \`useMemo\` and \`useCallback\` prevent unnecessary render loops.
4. **Testing**: Look into Jest and React Testing Library.
        
*Sage's tip*: Try taking the **Full Stack Skill Test** to check your baseline!`;
      } else if (queryLower.includes('javascript') || queryLower.includes('js') || queryLower.includes('web') || queryLower.includes('html') || queryLower.includes('css')) {
        botResponse = `For **JavaScript** interview preparation, focus on these core topics:
* **Closures**: Be ready to explain how functions retain access to their outer scope variables.
* **Event Loop**: Understand how sync and async tasks are handled in microtask queues.
* **Prototypes**: Learn about prototypal inheritance and prototype chains.
* **DOM APIs**: Review bubbling and capturing phases.
        
*Sage's tip*: Try taking the **Skill Verification Quiz** in your Tests tab to get your Verified badge!`;
      } else if (queryLower.includes('python') || queryLower.includes('ml') || queryLower.includes('machine') || queryLower.includes('data') || queryLower.includes('science')) {
        botResponse = `Here is a custom **Python & Machine Learning Roadmap**:
1. **Data Prep**: Focus on Pandas cleanups, Numpy arrays, and basic data munging.
2. **Core Concepts**: Be ready to explain the Bias-Variance tradeoff and L1/L2 regularizations in a mock interview.
3. **Modeling**: Review decision tree splits, gradient descent optimization, and F1 scoring metrics.
        
*Sage's tip*: Try the **Machine Learning Mock Interview** to practice explaining these concepts out loud!`;
      } else if (queryLower.includes('devops') || queryLower.includes('docker') || queryLower.includes('kubernetes') || queryLower.includes('git') || queryLower.includes('testing')) {
        botResponse = `For **DevOps & Software Testing**, focus on these core concepts:
* **Containerization**: Master Dockerfile instructions, base images, and port mappings.
* **Git Workflows**: Be ready to explain rebase vs merge, cherry-picks, and branch policies.
* **CI/CD Automation**: Learn how runner agents parse YAML pipelines to build and deploy code.
* **Unit Testing**: Learn how Mock assertions isolate function logic.
        
*Sage's tip*: Try the **Software Testing Mock Test** in your Tests tab to test your baseline!`;
      } else if (queryLower.includes('resume') || queryLower.includes('profile')) {
        botResponse = `Here is a quick check on your profile setup:
* **Verification Status**: ${user.isVerified ? '✓ Active! Looks great to recruiters.' : '✗ Pending. Unlock premium verified status in the Tests tab.'}
* **Education Records**: ${user.university ? `✓ Registered at ${user.university} (${selectedBranch || 'Engineering'})` : '✗ Missing college details.'}
* **Squad Status**: ${user.squadId ? `✓ Member of squad: "${user.squadId}"` : '✗ You are not in a squad yet. Check the Squads tab to collaborate!'}
        
*Sage's tip*: Go to your **Profile** tab to upload your resume PDF as a Base64 string so recruiters can view it instantly!`;
      } else {
        botResponse = `Good question! When answering technical questions or designing engineering systems, it's always best to structure your thoughts using a clear format:
1. **Context**: Briefly set up the scenario.
2. **Challenge**: What was the technical bottleneck?
3. **Action**: How did you write the solution? Detail your choice of algorithms or code modules.
4. **Result**: What performance boosts or features were achieved?
        
Let me know what you are focusing on right now! Are you aiming for Full Stack, ML, or general CS roles?`;
      }

      if (!isMountedRef.current) return;
      setMessages(prev => [...prev, { sender: 'Sage', text: botResponse, timestamp: Date.now() }]);
      setIsTyping(false);
    }, 1500);
  };

  // Temp fallback helper
  const selectedBranch = user.branch || user.stream;

  return (
    <div className="panel active">
      <h3 style={{ marginBottom: '1.5rem' }}>Career Guide</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
        Sage helps you check your progress, tests, and mock interviews to give you tailored recommendations and blueprints.
      </p>

      {/* Stats Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* SCORE CARD */}
        <div className="glass-card" style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2.5rem', borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ textAlign: 'center' }}>
            <i className="fa-solid fa-gauge-high" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
            <h4 style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Technical Score
            </h4>
            <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--text-main)', margin: '0.5rem 0' }}>
              {calculateTQ()}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/1000</span>
            </div>
            
            {/* Progress Slider */}
            <div style={{ width: '200px', height: '8px', background: 'var(--border)', borderRadius: '4px', margin: '0 auto 1rem', overflow: 'hidden' }}>
              <div style={{ width: `${(calculateTQ() / 1000) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {calculateTQ() >= 800 ? '👑 Elite Professional Level' : calculateTQ() >= 600 ? '🚀 High Tier Talent' : '🌱 Growing Tech Talent'}
            </p>
          </div>
        </div>

        {/* SKILLS BREAKDOWN */}
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h4 style={{ marginBottom: '1.2rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-chart-radar"></i> Skill Competencies
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>JavaScript & Web Basics</span>
                <strong>{getCompetencyValue('JavaScript') || getCompetencyValue('Full Stack') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('JavaScript') || getCompetencyValue('Full Stack') || 0}%`, height: '100%', background: 'var(--primary)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>Python & Data Science</span>
                <strong>{getCompetencyValue('Machine Learning') || getCompetencyValue('Data Science') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('Machine Learning') || getCompetencyValue('Data Science') || 0}%`, height: '100%', background: 'var(--secondary)' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                <span>DevOps & Testing</span>
                <strong>{getCompetencyValue('Software Testing') || 0}%</strong>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${getCompetencyValue('Software Testing') || 0}%`, height: '100%', background: 'var(--success)' }}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Advisor Chat Console */}
      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2.5rem' }}>
        <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
          <i className="fa-solid fa-comments" style={{ color: 'var(--primary)' }}></i> Chat with Sage
        </h4>

        {/* Messages list */}
        <div style={{
          height: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)',
          padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '1.5rem'
        }}>
          {messages.map((msg, idx) => {
            const isBot = msg.sender === 'Sage';
            return (
              <div key={idx} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: isBot ? 'flex-start' : 'flex-end'
              }}>
                <div style={{
                  maxWidth: '80%', padding: '0.8rem 1.2rem', borderRadius: '12px',
                  background: isBot ? 'rgba(255,255,255,0.03)' : 'var(--primary-glow)',
                  border: isBot ? '1px solid var(--border)' : '1px solid var(--primary)',
                  color: 'white', fontSize: '0.95rem', lineHeight: '1.6',
                  whiteSpace: 'pre-line'
                }}>
                  <strong style={{ display: 'block', fontSize: '0.75rem', color: isBot ? 'var(--primary)' : 'var(--secondary)', marginBottom: '0.3rem' }}>
                    {msg.sender}
                  </strong>
                  {msg.text}
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
                padding: '0.8rem 1.2rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: '0.95rem'
              }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.3rem' }}>
                  Sage
                </strong>
                <i className="fa-solid fa-circle-notch fa-spin"></i> typing...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Typing Bar */}
        <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.8rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask Sage for study plans, technical roadmaps, or scores..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            style={{ flex: 1, marginBottom: 0 }}
            disabled={isTyping}
          />
          <button className="btn btn-primary" type="submit" style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={isTyping}>
            <span>Ask Sage</span>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </form>
      </div>

    </div>
  );
}
