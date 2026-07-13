import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

const QUIZ_API_KEY = 'qa_sk_3eb0852f4f84a8623637e454b57cf2c974c00334';

const LOCAL_CODING_QUESTIONS = {
  JavaScript: [
    {
      question: "Which of the following is used to declare a block-scoped variable in JavaScript?",
      options: ["var", "let", "const", "Both let and const"],
      correct: "Both let and const"
    },
    {
      question: "What is the output of 'typeof null' in JavaScript?",
      options: ["'null'", "'undefined'", "'object'", "'string'"],
      correct: "'object'"
    },
    {
      question: "Which method is used to serialize an object into a JSON string in JavaScript?",
      options: ["JSON.parse()", "JSON.stringify()", "JSON.toFormat()", "JSON.serialize()"],
      correct: "JSON.stringify()"
    },
    {
      question: "What does the 'Map.prototype.has()' method do in ES6?",
      options: ["Returns a boolean indicating whether an element with the specified key exists", "Adds a new element to the Map", "Removes all elements", "Returns the size of the Map"],
      correct: "Returns a boolean indicating whether an element with the specified key exists"
    },
    {
      question: "How do you create a promise in JavaScript?",
      options: ["new Promise((resolve, reject) => {})", "Promise.create()", "makePromise()", "new Promise.resolve()"],
      correct: "new Promise((resolve, reject) => {})"
    }
  ],
  Python: [
    {
      question: "Which keyword is used to define a function in Python?",
      options: ["func", "def", "function", "lambda"],
      correct: "def"
    },
    {
      question: "What is the output of print(2 ** 3) in Python?",
      options: ["6", "8", "9", "5"],
      correct: "8"
    },
    {
      question: "Which data structure in Python is mutable?",
      options: ["Tuple", "List", "String", "Frozenset"],
      correct: "List"
    },
    {
      question: "How do you start a list comprehension in Python?",
      options: ["{x for x in list}", "[x for x in list]", "(x for x in list)", "list(x for x in list)"],
      correct: "[x for x in list]"
    },
    {
      question: "What does the 'self' parameter represent in a Python class method?",
      options: ["The class object itself", "The specific instance of the class", "A global variable", "A superclass reference"],
      correct: "The specific instance of the class"
    }
  ],
  DevOps: [
    {
      question: "Which command is used to display git commit logs in a compressed format?",
      options: ["git log --oneline", "git status", "git commit --history", "git show -s"],
      correct: "git log --oneline"
    },
    {
      question: "What is the purpose of Docker containers?",
      options: ["To virtualize the operating system kernel and isolate applications", "To manage physical server cabinets", "To write unit tests in JavaScript", "To replace network database servers"],
      correct: "To virtualize the operating system kernel and isolate applications"
    },
    {
      question: "In CI/CD pipelines, what does CD stand for?",
      options: ["Continuous Delivery / Continuous Deployment", "Code Design", "Computer Database", "Centralized Deployment"],
      correct: "Continuous Delivery / Continuous Deployment"
    },
    {
      question: "Which tool is commonly used for Infrastructure as Code (IaC)?",
      options: ["Terraform", "React", "Express", "Jenkins"],
      correct: "Terraform"
    },
    {
      question: "What does the 'npm install' command do in a Node.js project?",
      options: ["Compiles JavaScript to assembly", "Downloads and installs package dependencies in node_modules", "Deletes temporary environment files", "Launches the active local server"],
      correct: "Downloads and installs package dependencies in node_modules"
    }
  ]
};

const LOCAL_APTITUDE_QUESTIONS = [
  {
    question: "What does CPU stand for in computer science?",
    options: ["Central Processing Unit", "Computer Personal Unit", "Central Peripheral Utility", "Core Processing Utility"],
    correct: "Central Processing Unit"
  },
  {
    question: "Which of the following is a standard operating system kernel?",
    options: ["Linux", "Python", "HTML", "Git"],
    correct: "Linux"
  },
  {
    question: "What is the primary protocol used to secure traffic over the World Wide Web?",
    options: ["HTTPS", "HTTP", "FTP", "SMTP"],
    correct: "HTTPS"
  },
  {
    question: "Which database system is classified as a NoSQL document database?",
    options: ["MongoDB", "PostgreSQL", "MySQL", "Oracle"],
    correct: "MongoDB"
  },
  {
    question: "What is the decimal equivalent of the binary number 1010?",
    options: ["10", "8", "12", "6"],
    correct: "10"
  },
  {
    question: "Which term describes the process of finding and fixing bugs in software?",
    options: ["Debugging", "Compiling", "Deploying", "Refactoring"],
    correct: "Debugging"
  },
  {
    question: "What does HTML stand for in web development?",
    options: ["HyperText Markup Language", "Hyperlink Text Management Language", "Home Tool Markup Language", "HyperText Modern Language"],
    correct: "HyperText Markup Language"
  },
  {
    question: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
    options: ["Stack", "Queue", "Linked List", "Binary Tree"],
    correct: "Stack"
  },
  {
    question: "What is the time complexity of searching an element in a sorted array using binary search?",
    options: ["O(log n)", "O(n)", "O(n log n)", "O(1)"],
    correct: "O(log n)"
  },
  {
    question: "In standard network designs, what port does HTTP typically run on?",
    options: ["80", "443", "22", "8080"],
    correct: "80"
  }
];

const cleanHtmlEntities = (str) => {
  if (!str) return '';
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&deg;/g, '°');
};

export default function MockTests() {
  const { user, setUser, apiFetch } = useContext(AuthContext);

  const [activeQuiz, setActiveQuiz] = useState(null); // track being tested
  const [loading, setLoading] = useState(false);
  const [quizPool, setQuizPool] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userScore, setUserScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  
  // Dynamic question countdown timer
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Test histories tracking
  const [historyLogs, setHistoryLogs] = useState([]);
  const [quizComplete, setQuizComplete] = useState(false);

  // Verification vs Mock Quiz identifier
  const [isVerificationQuiz, setIsVerificationQuiz] = useState(false);

  const isMountedRef = useRef(true);

  // Mount/Unmount tracking
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Timer useEffect hook
  useEffect(() => {
    if (!activeQuiz || quizComplete || loading) return;

    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time ran out -> skip to next question
          handleNextQuestion(true);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, currentIdx, quizComplete, loading]);

  // Start Assessment Quiz Fetcher
  const startQuiz = async (track, isVerification = false) => {
    setLoading(true);
    setActiveQuiz(track);
    setIsVerificationQuiz(isVerification);
    setCurrentIdx(0);
    setUserScore(0);
    setHistoryLogs([]);
    setSelectedAnswer(null);
    setQuizComplete(false);

    try {
      let apiTag = 'JavaScript';
      if (track === 'Machine Learning' || track === 'Data Science') apiTag = 'Python';
      if (track === 'Software Testing') apiTag = 'DevOps';

      // 1. Fetch aptitude questions
      const aptCount = isVerification ? 3 : 20;
      let aptQuestions = [];
      try {
        const aptRes = await fetch(`https://opentdb.com/api.php?amount=${aptCount}&category=18&type=multiple`);
        if (!aptRes.ok) throw new Error('OpenTDB response not ok');
        const aptData = await aptRes.json();
        if (!aptData.results || !Array.isArray(aptData.results)) throw new Error('OpenTDB results not valid');
        
        aptQuestions = aptData.results.map(q => ({
          category: 'Aptitude',
          question: q.question,
          options: [...q.incorrect_answers, q.correct_answer].sort(() => Math.random() - 0.5),
          correct: q.correct_answer
        }));
      } catch (err) {
        console.warn('OpenTDB API failed or rate-limited. Falling back to local aptitude questions:', err);
        // Shuffle and slice local questions
        aptQuestions = [...LOCAL_APTITUDE_QUESTIONS]
          .sort(() => Math.random() - 0.5)
          .slice(0, aptCount)
          .map(q => ({
            category: 'Aptitude',
            question: q.question,
            options: [...q.options].sort(() => Math.random() - 0.5),
            correct: q.correct
          }));
      }

      // 2. Fetch coding questions
      const codeCount = isVerification ? 2 : 10;
      let codeQuestions = [];
      try {
        const codeRes = await fetch(`https://quizapi.io/api/v1/questions?apiKey=${QUIZ_API_KEY}&limit=${codeCount}&tags=${apiTag}`);
        if (!codeRes.ok) throw new Error('QuizAPI response not ok');
        const codeData = await codeRes.json();
        if (!Array.isArray(codeData)) throw new Error('QuizAPI returned invalid data');

        codeQuestions = codeData.map(q => {
          const availableAnswers = Object.values(q.answers).filter(a => a !== null);
          const correctKey = Object.keys(q.correct_answers).find(k => q.correct_answers[k] === 'true');
          const correctText = correctKey ? q.answers[correctKey.replace('_correct', '')] : '';

          return {
            category: track,
            question: q.question,
            options: availableAnswers,
            correct: correctText
          };
        });
      } catch (err) {
        console.warn('QuizAPI fetch failed, falling back to local coding questions:', err);
        const localQuestions = LOCAL_CODING_QUESTIONS[apiTag] || LOCAL_CODING_QUESTIONS.JavaScript;
        codeQuestions = [...localQuestions]
          .sort(() => Math.random() - 0.5)
          .slice(0, codeCount)
          .map(q => ({
            category: track,
            question: q.question,
            options: [...q.options].sort(() => Math.random() - 0.5),
            correct: q.correct
          }));
      }

      // Compile questions pool
      const pool = [...aptQuestions, ...codeQuestions];

      // Clean HTML strings using our safe entities cleaner
      const cleanedPool = pool.map(item => ({
        category: item.category,
        question: cleanHtmlEntities(item.question),
        options: item.options.map(opt => cleanHtmlEntities(opt)),
        correct: cleanHtmlEntities(item.correct)
      }));

      if (!isMountedRef.current) return;
      setQuizPool(cleanedPool);
    } catch (err) {
      console.error(err);
      if (isMountedRef.current) {
        alert('Failed to connect to question bank. Falling back to offline local assessment.');
        
        // Assemble offline backup pool
        const aptBackup = [...LOCAL_APTITUDE_QUESTIONS]
          .sort(() => Math.random() - 0.5)
          .slice(0, isVerification ? 3 : 20)
          .map(q => ({
            category: 'Aptitude',
            question: cleanHtmlEntities(q.question),
            options: q.options.map(o => cleanHtmlEntities(o)),
            correct: cleanHtmlEntities(q.correct)
          }));
        
        const localTag = track === 'Machine Learning' || track === 'Data Science' ? 'Python' : track === 'Software Testing' ? 'DevOps' : 'JavaScript';
        const codeBackup = [...(LOCAL_CODING_QUESTIONS[localTag] || LOCAL_CODING_QUESTIONS.JavaScript)]
          .sort(() => Math.random() - 0.5)
          .slice(0, isVerification ? 2 : 10)
          .map(q => ({
            category: track,
            question: cleanHtmlEntities(q.question),
            options: q.options.map(o => cleanHtmlEntities(o)),
            correct: cleanHtmlEntities(q.correct)
          }));

        setQuizPool([...aptBackup, ...codeBackup]);
      }
    }
    if (isMountedRef.current) {
      setLoading(false);
    }
  };

  // Next Question trigger
  const handleNextQuestion = (timeOut = false) => {
    const currentQ = quizPool[currentIdx];
    const finalAnswer = timeOut ? 'Time Out' : selectedAnswer || 'Skipped';
    const isCorrect = finalAnswer === currentQ.correct;

    const logItem = {
      question: currentQ.question,
      category: currentQ.category,
      isCorrect,
      userAnswer: finalAnswer,
      correctAnswer: currentQ.correct
    };

    const updatedScore = isCorrect ? userScore + 1 : userScore;
    if (isCorrect) setUserScore(prev => prev + 1);

    const newLogs = [...historyLogs, logItem];
    setHistoryLogs(newLogs);

    if (currentIdx < quizPool.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      // Completed!
      handleSubmitQuiz(updatedScore, newLogs);
    }
  };

  // REST API Submit Quiz
  const handleSubmitQuiz = async (finalScore, finalLogs) => {
    setQuizComplete(true);
    const accuracy = Math.round((finalScore / quizPool.length) * 100);

    try {
      if (isVerificationQuiz) {
        const passed = finalScore >= 4; // 80% passing standard
        await apiFetch('/api/assessments/verification', {
          method: 'POST',
          body: JSON.stringify({
            score: finalScore,
            total: quizPool.length,
            passed,
            history: finalLogs.map(l => ({
              question: l.question,
              userAnswer: l.userAnswer,
              isCorrect: l.isCorrect,
              correct: l.correctAnswer
            }))
          })
        });

        if (passed) {
          alert(`🎉 Premium verification unlocked successfully!\nScore: ${finalScore}/${quizPool.length}`);
          setUser(prev => ({ ...prev, isVerified: true }));
        } else {
          alert(`Verification Failed.\nScore: ${finalScore}/${quizPool.length}\n(Requires 80% to pass)`);
        }
      } else {
        // Submit standard mock test
        await apiFetch('/api/assessments/mock', {
          method: 'POST',
          body: JSON.stringify({
            type: `${activeQuiz} Mock`,
            score: finalScore,
            total: quizPool.length,
            accuracy,
            history: finalLogs
          })
        });
        alert(`Mock Test Complete!\nScore: ${finalScore}/${quizPool.length}`);
      }
    } catch (err) {
      console.error('Quiz submission error:', err);
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setQuizPool([]);
    setQuizComplete(false);
  };

  // Render skill test track selectors
  if (!activeQuiz) {
    return (
      <div className="panel active">
        {user.role === 'student' && !user.isVerified && (
          <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}>
            <h4 style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>Get Verified Badge</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Pass our 5-question verification test (requires 4/5 correct) to unlock the Verified badge and get early access to newly posted jobs.
            </p>
            <button className="btn btn-primary" onClick={() => startQuiz('Verification Quiz', true)}>
              Start Verification Quiz
            </button>
          </div>
        )}

        <h3 style={{ marginBottom: '1.5rem' }}>Skill Tests</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem' }}>Choose a stack below to test your technical skills. Tests are timed and graded.</p>

        <div className="grid-cards">
          {/* Full Stack */}
          <div className="glass-card" style={{ borderTop: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Full Stack Development</h4>
                <i className="fa-solid fa-code" style={{ color: 'var(--primary)' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Test your knowledge on HTML/CSS, modern Web APIs, database transactions, and JavaScript components.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => startQuiz('Full Stack')}>
              Start Test
            </button>
          </div>

          {/* Machine Learning */}
          <div className="glass-card" style={{ borderTop: '3px solid var(--secondary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Machine Learning</h4>
                <i className="fa-solid fa-brain" style={{ color: 'var(--secondary)' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assess core competencies in mathematical algorithms, neural structures, and Python modeling libraries.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => startQuiz('Machine Learning')}>
              Start Test
            </button>
          </div>

          {/* Data Science */}
          <div className="glass-card" style={{ borderTop: '3px solid var(--success)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Data Science</h4>
                <i className="fa-solid fa-chart-line" style={{ color: 'var(--success)' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Validate knowledge in probability theory, statistical modeling, data cleanup, and pandas pipelines.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => startQuiz('Data Science')}>
              Start Test
            </button>
          </div>

          {/* Software Testing */}
          <div className="glass-card" style={{ borderTop: '3px solid var(--error)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <h4>Software Testing</h4>
                <i className="fa-solid fa-bug-slash" style={{ color: 'var(--error)' }}></i>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review automation test systems, continuous devops processes, and quality assurance metrics.</p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => startQuiz('Software Testing')}>
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RENDER DYNAMIC LOADING SCREEN
  if (loading) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '3rem auto', textAlign: 'center', padding: '3.5rem' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: '1.5rem' }}></i>
        <h4>Generating Test challenge...</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {isVerificationQuiz ? 'Fetching 3 Aptitude + 2 Technical questions' : 'Fetching 20 Aptitude + 10 Technical questions'}
        </p>
      </div>
    );
  }

  // RENDER COMPLETED DIAGNOSTIC ANALYSIS BREAKDOWN
  if (quizComplete) {
    const accuracy = Math.round((userScore / quizPool.length) * 100);
    const aptCorrect = historyLogs.filter(h => h.category === 'Aptitude' && h.isCorrect).length;
    const techCorrect = historyLogs.filter(h => h.category !== 'Aptitude' && h.isCorrect).length;

    return (
      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <i className="fa-solid fa-square-poll-vertical" style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: '1rem' }}></i>
          <h3>{activeQuiz} Test Results</h3>
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {userScore}/{quizPool.length}
          </div>
          <p style={{ fontWeight: '500', color: accuracy >= 70 ? 'var(--success)' : 'var(--text-muted)' }}>
            {accuracy}% Accuracy
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderBottom: '3px solid var(--secondary)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{aptCorrect}/{isVerificationQuiz ? 3 : 20}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Aptitude Correct</div>
          </div>
          <div className="glass-card" style={{ textAlign: 'center', padding: '1rem', borderBottom: '3px solid var(--success)' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>{techCorrect}/{isVerificationQuiz ? 2 : 10}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>Technical Correct</div>
          </div>
        </div>

        <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Question-by-Question Analysis</h4>
        
        {/* DIAGNOSTICS LIST */}
        <div style={{ maxHeight: '350px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
          {historyLogs.map((log, idx) => (
            <div key={idx} style={{
              padding: '1rem', marginBottom: '1rem', borderRadius: '8px',
              borderLeft: `4px solid ${log.isCorrect ? 'var(--success)' : 'var(--error)'}`,
              background: log.isCorrect ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                <span>Q{idx + 1} ({log.category})</span>
                <span style={{ color: log.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                  {log.isCorrect ? 'CORRECT' : 'INCORRECT'}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{log.question}</p>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Your Answer: <b>{log.userAnswer}</b>
                {!log.isCorrect && <span style={{ marginLeft: '1rem', color: 'var(--success)' }}>Correct: {log.correctAnswer}</span>}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%' }} onClick={exitQuiz}>
          Finish & Return
        </button>
      </div>
    );
  }

  // RENDER ACTIVE CONSOLE INTERMEDIATE TEST
  const currentQ = quizPool[currentIdx];
  if (!currentQ) return null;
  const progressPercent = ((currentIdx + 1) / quizPool.length) * 100;

  return (
    <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem' }}>
      <button onClick={exitQuiz} style={{
        position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
        color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', zIndex: 10
      }}>
        <i className="fa-solid fa-xmark"></i>
      </button>

      {/* Progress slider bar */}
      <div style={{ width: '100%', height: '6px', background: 'var(--border)', borderRadius: '10px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s ease' }}></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
        <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {currentQ.category}
        </span>
        <span style={{ color: timeLeft <= 10 ? 'var(--error)' : 'var(--text-muted)', fontWeight: 'bold', fontFamily: 'monospace' }}>
          <i className="fa-solid fa-clock"></i> {timeLeft}s
        </span>
      </div>

      <h4 style={{ marginBottom: '1.5rem', lineHeight: '1.4' }}>{currentQ.question}</h4>

      {/* OPTIONS CONTAINER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {currentQ.options.map((opt, idx) => {
          const isSelected = selectedAnswer === opt;
          return (
            <button
              key={idx}
              className={`mcq-option ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedAnswer(opt)}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <button className="btn btn-primary" style={{ width: '100%', marginTop: '2rem' }} onClick={() => handleNextQuestion(false)}>
        {currentIdx === quizPool.length - 1 ? 'Complete Assessment' : 'Next Question'}
      </button>
    </div>
  );
}
