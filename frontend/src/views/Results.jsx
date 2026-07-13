import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import Chart from 'chart.js/auto';

export default function Results({ onSwitchView }) {
  const { user, apiFetch } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('mocks');
  
  // Data lists
  const [mockTests, setMockTests] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Diagnostic Detail Modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('mock'); // mock | interview | verification
  const [modalData, setModalData] = useState(null);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Fetch results logs
  const loadResultsData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/assessments/results');
      const data = await res.json();

      if (data.success) {
        setMockTests(data.mockTests);
        setVerifications(data.verifications);
        setInterviews(data.interviews);
        
        // Render Chart.js line graph
        renderAnalyticsChart(data.mockTests, data.interviews);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadResultsData();
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  // Instantiates the Chart.js Line graph analytics
  const renderAnalyticsChart = (mockData, interviewData) => {
    const ctx = chartRef.current;
    if (!ctx) return;

    // Purge existing chart instance before rebuilding
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // Filter last 5 attempts, reverse to chronologically display oldest-to-newest
    const mocksSubset = [...mockData].slice(0, 5).reverse();
    const interviewsSubset = [...interviewData].slice(0, 5).reverse();

    const dates = mocksSubset.map(m => new Date(m.timestamp).toLocaleDateString());
    const mockScores = mocksSubset.map(m => m.accuracy);
    const interviewScores = interviewsSubset.map(i => i.scores?.technical * 10 || 60);

    // Padding values for labels if lists are short
    const labels = dates.length > 0 ? dates : ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'];
    const mockPoints = mockScores.length > 0 ? mockScores : [65, 72, 80, 68, 85];
    const interviewPoints = interviewScores.length > 0 ? interviewScores : [70, 75, 65, 80, 85];

    // Read colors dynamically from CSS theme variables
    const themeStyles = getComputedStyle(document.documentElement);
    const primaryColor = themeStyles.getPropertyValue('--primary').trim() || '#c99d63';
    const secondaryColor = themeStyles.getPropertyValue('--secondary').trim() || '#5b89a6';
    const textMuted = themeStyles.getPropertyValue('--text-muted').trim() || '#938f87';
    const borderTheme = themeStyles.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.05)';
    const bodyFont = themeStyles.getPropertyValue('--font-body').trim() || 'sans-serif';

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Mock Test Accuracy (%)',
            data: mockPoints,
            borderColor: primaryColor,
            backgroundColor: primaryColor + '1a', // 10% transparency fill
            fill: true,
            tension: 0.4
          },
          {
            label: 'Voice Interview Rating (%)',
            data: interviewPoints,
            borderColor: secondaryColor,
            backgroundColor: secondaryColor + '1a', // 10% transparency fill
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: textMuted,
              font: { size: 12, family: bodyFont }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: textMuted, font: { family: bodyFont } },
            grid: { color: borderTheme }
          },
          y: {
            max: 100,
            min: 0,
            ticks: { color: textMuted, font: { family: bodyFont } },
            grid: { color: borderTheme },
            title: {
              display: true,
              text: 'Score Percentage (%)',
              color: textMuted,
              font: { family: bodyFont }
            }
          }
        }
      }
    });
  };

  // Open Details Modal
  const handleOpenDetails = (type, data) => {
    setModalType(type);
    setModalData(data);
    setDetailsModalOpen(true);
  };

  return (
    <div className="panel active">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h3>Performance Analytics</h3>
        <div style={{
          background: 'var(--bg-card)', padding: '0.4rem', borderRadius: '8px',
          border: '1px solid var(--border)', display: 'flex', gap: '0.4rem'
        }}>
          <button className={`btn-tab ${activeTab === 'mocks' ? 'active' : ''}`} onClick={() => setActiveTab('mocks')}>Mock Tests</button>
          <button className={`btn-tab ${activeTab === 'interviews' ? 'active' : ''}`} onClick={() => setActiveTab('interviews')}>Interviews</button>
          <button className={`btn-tab ${activeTab === 'verification' ? 'active' : ''}`} onClick={() => setActiveTab('verification')}>Verification</button>
        </div>
      </div>

      {/* ANALYTICS LINE GRAPH GRAPH CHART */}
      <div className="glass-card" style={{ marginBottom: '2.5rem', padding: '1.8rem' }}>
        <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--primary)' }}></i> Performance Trends
        </h4>
        <div style={{ position: 'relative', height: '300px', width: '100%' }}>
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 📊 TAB SECTION LISTINGS                              */}
      {/* ==================================================== */}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
        </div>
      ) : (
        <>
          {/* TAB 1: MOCKS LISTING */}
          {activeTab === 'mocks' && (
            <div>
              <h4 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-list-check"></i> Recent Mock Tests</h4>
              {mockTests.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-code" style={{ fontSize: '2rem', marginBottom: '0.8rem', display: 'block' }}></i>
                  <p>No mock skill assessments attempted yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onSwitchView('tests')}>Attempt Mock Test</button>
                </div>
              ) : (
                mockTests.map(mock => (
                  <div key={mock._id} className="history-item" onClick={() => handleOpenDetails('mock', mock)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-glow)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem'
                      }}>
                        <i className="fa-solid fa-code" style={{ color: 'var(--primary)' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{mock.type}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Attempted {new Date(mock.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{mock.accuracy}%</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mock.score}/{mock.total} Score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: INTERVIEWS LISTING */}
          {activeTab === 'interviews' && (
            <div>
              <h4 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-microphone"></i> Voice Interview Sessions</h4>
              {interviews.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-microphone-slash" style={{ fontSize: '2rem', marginBottom: '0.8rem', display: 'block' }}></i>
                  <p>No voice AI interviews completed yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onSwitchView('interviews')}>Start AI Interview</button>
                </div>
              ) : (
                interviews.map(interview => (
                  <div key={interview._id} className="history-item" onClick={() => handleOpenDetails('interview', interview)}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem'
                      }}>
                        <i className="fa-solid fa-microphone" style={{ color: 'var(--secondary)' }}></i>
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{interview.type}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Completed {new Date(interview.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--secondary)' }}>{interview.scores?.technical}/10</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vocal score</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: VERIFICATION LISTING */}
          {activeTab === 'verification' && (
            <div>
              <h4 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-certificate"></i> Premium Validations</h4>
              {verifications.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  <i className="fa-solid fa-certificate" style={{ fontSize: '2rem', marginBottom: '0.8rem', display: 'block' }}></i>
                  <p>Premium qualification assessment not attempted yet.</p>
                  <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => onSwitchView('tests')}>Take Assessment</button>
                </div>
              ) : (
                verifications.map(ver => {
                  const isPassed = ver.passed || ver.score >= 4;
                  return (
                    <div key={ver._id} className="history-item" onClick={() => handleOpenDetails('verification', ver)}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: isPassed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '1rem'
                        }}>
                          <i className="fa-solid fa-certificate" style={{ color: isPassed ? 'var(--success)' : 'var(--error)' }}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{ver.type}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Completed {new Date(ver.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', color: isPassed ? 'var(--success)' : 'var(--error)' }}>
                          {isPassed ? 'PASSED' : 'FAILED'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ver.score}/{ver.total} Score</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ==================================================== */}
      {/* 🔍 DETAILED RESULT POPUP DIAGNOSTIC MODAL            */}
      {/* ==================================================== */}
      {detailsModalOpen && modalData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setDetailsModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {/* MOCK RESULT DETAIL */}
            {modalType === 'mock' && (
              <div>
                <div className="result-detail-header">
                  <h2 style={{ color: 'var(--primary)' }}>{modalData.type} Details</h2>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0' }}>{modalData.score}/{modalData.total}</div>
                  <div style={{ fontWeight: 'bold', color: modalData.accuracy >= 70 ? 'var(--success)' : 'var(--error)' }}>
                    {modalData.accuracy}% Accuracy
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Attempted on {new Date(modalData.timestamp).toLocaleString()}
                  </div>
                </div>

                <h4 style={{ marginBottom: '1.5rem' }}>Question Diagnostic breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {modalData.history?.map((log, i) => (
                    <div key={i} style={{
                      padding: '1rem', borderRadius: '8px',
                      borderLeft: `4px solid ${log.isCorrect ? 'var(--success)' : 'var(--error)'}`,
                      background: log.isCorrect ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Q{i + 1}: {log.question}</span>
                        <span style={{ color: log.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                          {log.isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>Tag: <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{log.category}</span></span>
                        <span>Your Answer: <b>{log.userAnswer}</b> {!log.isCorrect && `(Correct: ${log.correctAnswer})`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* INTERVIEW RESULT DETAIL */}
            {modalType === 'interview' && (
              <div>
                <div className="result-detail-header">
                  <h2 style={{ color: 'var(--secondary)' }}>Voice AI Technical Interview</h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Completed on {new Date(modalData.timestamp).toLocaleString()}
                  </div>
                </div>

                <div className="result-stat-grid" style={{ marginBottom: '2.5rem' }}>
                  <div className="result-stat-box">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{modalData.scores?.technical}/10</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Technical Score</div>
                  </div>
                  <div className="result-stat-box">
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{modalData.scores?.communication}/10</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verbal Communication</div>
                  </div>
                </div>

                <h4 style={{ marginBottom: '1rem' }}>Vocal Technical Assessment Report:</h4>
                <div className="transcript-box" style={{ background: 'var(--bg-dark)', padding: '1.5rem', border: '1px solid var(--border)' }} dangerouslySetInnerHTML={{ __html: modalData.report }}></div>
              </div>
            )}

            {/* VERIFICATION TEST DETAIL */}
            {modalType === 'verification' && (
              <div>
                <div className="result-detail-header">
                  <h2 style={{ color: 'var(--success)' }}>Qualification Assessment Details</h2>
                  <div style={{
                    fontSize: '3.5rem', fontWeight: 'bold', margin: '1rem 0',
                    color: modalData.passed ? 'var(--success)' : 'var(--error)'
                  }}>
                    {modalData.passed ? 'PASSED' : 'FAILED'}
                  </div>
                  <div>Score: {modalData.score}/{modalData.total} ({Math.round((modalData.score/modalData.total)*100)}% Accuracy)</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    Attempted on {new Date(modalData.timestamp).toLocaleString()}
                  </div>
                </div>

                <h4 style={{ marginBottom: '1.5rem' }}>Questions breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {modalData.history?.map((log, i) => (
                    <div key={i} style={{ padding: '0.8rem', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.95rem' }}>Q{i+1}: {log.question}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        <span>Your Answer: <strong style={{ color: log.isCorrect ? 'var(--success)' : 'var(--error)' }}>{log.userAnswer}</strong></span>
                        {!log.isCorrect && <span>Correct: <strong style={{ color: 'var(--success)' }}>{log.correct}</strong></span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-glass" style={{ width: '100%', marginTop: '2.5rem' }} onClick={() => setDetailsModalOpen(false)}>
              Close Report
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
