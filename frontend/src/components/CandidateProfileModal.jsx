import React, { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function CandidateProfileModal({
  studentId,
  applicationId,
  currentStatus = 'pending',
  jobTitle = '',
  onClose,
  onStatusChange
}) {
  const { apiFetch } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, resume, coding, tests, interviews, verification
  const [appStatus, setAppStatus] = useState(currentStatus);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [expandedCodeId, setExpandedCodeId] = useState(null);
  const [practiceFilter, setPracticeFilter] = useState('all'); // all, dsa, sql, oops, solved
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [resumeBlobUrl, setResumeBlobUrl] = useState(null);

  const contentBodyRef = useRef(null);

  // Fetch complete student dossier
  const fetchStudentDossier = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/auth/student/${studentId}`);
      const data = await res.json();
      if (data.success && data.user) {
        setStudent(data.user);
      } else {
        alert(data.message || 'Could not load candidate profile.');
      }
    } catch (err) {
      console.error('Error loading candidate profile:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudentDossier();
    setAppStatus(currentStatus);
  }, [studentId, currentStatus]);

  // Reset scroll to top whenever changing tabs
  useEffect(() => {
    if (contentBodyRef.current) {
      contentBodyRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Convert base64 resume data to Blob URL for clean PDF rendering without raw base64 title
  useEffect(() => {
    if (student?.resume?.resumeData && student.resume.resumeData.startsWith('data:application/pdf')) {
      try {
        const parts = student.resume.resumeData.split(',');
        const byteCharacters = atob(parts[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setResumeBlobUrl(url);

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Error generating PDF blob URL:', err);
        setResumeBlobUrl(null);
      }
    } else if (student?.resume?.resumeData) {
      setResumeBlobUrl(student.resume.resumeData);
    } else {
      setResumeBlobUrl(null);
    }
  }, [student?.resume?.resumeData]);

  // Handle ESC key to toggle fullscreen or close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  // Handle application status change
  const handleUpdateStatus = async (newStatus) => {
    if (!applicationId) return;
    setUpdatingStatus(true);
    try {
      const res = await apiFetch(`/api/jobs/applications/${applicationId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAppStatus(newStatus);
        if (onStatusChange) {
          onStatusChange(applicationId, newStatus);
        }
      } else {
        alert(`Failed to update status: ${data.message}`);
      }
    } catch (err) {
      console.error('Update status error:', err);
      alert('Error updating application status');
    }
    setUpdatingStatus(false);
  };

  // Open resume in new tab
  const handleOpenResume = () => {
    if (resumeBlobUrl) {
      const win = window.open(resumeBlobUrl, '_blank');
      if (win) {
        win.focus();
        return;
      }
    }
    if (!student?.resume?.resumeData) {
      return alert('Resume file data missing or not found.');
    }
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${student.resume.resumeData}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = `Resume - ${student.name} (${student.resume.fileName || 'Candidate'})`;
    } else {
      alert('Please allow popups to preview the candidate resume.');
    }
  };

  // Download resume
  const handleDownloadResume = () => {
    if (!student?.resume?.resumeData) return;
    const a = document.createElement('a');
    a.href = student.resume.resumeData;
    a.download = student.resume.fileName || `${student.name.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!studentId) return null;

  // Filter practice submissions
  const filteredSubmissions = (student?.practiceSubmissions || []).filter(sub => {
    if (practiceFilter === 'all') return true;
    if (practiceFilter === 'solved') return sub.status === 'Solved';
    return sub.category === practiceFilter;
  });

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 1200,
        padding: isFullScreen ? 0 : '1.2rem',
        alignItems: isFullScreen ? 'stretch' : 'center',
        justifyContent: isFullScreen ? 'stretch' : 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: isFullScreen ? '100vw' : '1040px',
          width: isFullScreen ? '100vw' : '95vw',
          maxHeight: isFullScreen ? '100vh' : '92vh',
          height: isFullScreen ? '100vh' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: isFullScreen ? 0 : '16px',
          boxShadow: isFullScreen ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* MODAL HEADER / BANNER (COMPACT & SLEEK) */}
        <div
          style={{
            background: 'var(--bg-card, #121826)',
            borderBottom: '1px solid var(--border)',
            padding: '1rem 1.4rem',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Header Action Controls (Fullscreen Toggle + Close) */}
          <div
            style={{
              position: 'absolute',
              top: '0.85rem',
              right: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              zIndex: 10
            }}
          >
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              style={{
                background: isFullScreen ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                border: isFullScreen ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border)',
                color: isFullScreen ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '0.35rem 0.65rem',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              title={isFullScreen ? "Exit Full Screen Mode (Esc)" : "Expand to Full Screen"}
            >
              <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
              <span>{isFullScreen ? 'Windowed' : 'Full Screen'}</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0.3rem 0.55rem',
                lineHeight: 1,
                borderRadius: '6px',
                transition: 'all 0.2s ease'
              }}
              title="Close Candidate Profile (Esc)"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.6rem', color: 'var(--primary)' }}></i>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Loading candidate profile...</p>
            </div>
          ) : !student ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)' }}>
              Candidate profile could not be loaded.
            </div>
          ) : (
            <div>
              {/* COMPACT TOP ROW: AVATAR + BASIC INFO + QUICK METRICS + ACTION STATUS */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  paddingRight: '12rem'
                }}
              >
                {/* Left: Avatar + Identity + Summary Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary, #3b82f6), var(--secondary, #8b5cf6))',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)',
                      border: '2px solid var(--border)',
                      flexShrink: 0
                    }}
                  >
                    {student.photoURL ? (
                      <img src={student.photoURL} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      student.name?.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                      <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {student.name}
                      </h2>
                      {student.isVerified && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '20px',
                            border: '1px solid #10b981',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <i className="fa-solid fa-circle-check"></i> Verified
                        </span>
                      )}
                      {student.squadId && student.squadId !== 'None' && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#a78bfa',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '20px',
                            border: '1px solid #8b5cf6',
                            fontWeight: 600
                          }}
                        >
                          <i className="fa-solid fa-users"></i> Squad: {student.squadId}
                        </span>
                      )}
                    </div>

                    {/* Contact & University row */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      <span><i className="fa-solid fa-envelope" style={{ color: 'var(--primary)' }}></i> {student.email}</span>
                      {student.phoneNumber && student.phoneNumber !== 'N/A' && (
                        <span><i className="fa-solid fa-phone" style={{ color: '#10b981' }}></i> {student.phoneNumber}</span>
                      )}
                      {student.university && student.university !== 'Not Specified' && (
                        <span><i className="fa-solid fa-graduation-cap" style={{ color: '#f59e0b' }}></i> {student.university}</span>
                      )}
                    </div>

                    {/* Quick Metric Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                        <i className="fa-solid fa-trophy"></i> Rank #{student.rank || 1}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.25)' }}>
                        <i className="fa-solid fa-bolt"></i> TQ {student.tqScore || 500}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <i className="fa-solid fa-code"></i> {student.practiceStats?.totalSolved || 0} Solved
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
                        <i className="fa-solid fa-brain"></i> {student.mockStats?.totalTests || 0} Tests
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.25)' }}>
                        <i className="fa-solid fa-comments"></i> {student.interviewStats?.totalInterviews || 0} Interviews
                      </span>
                      {student.resume && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary)', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
                          <i className="fa-solid fa-file-pdf"></i> Resume Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Application Decision Action Bar (If application context passed) */}
                {applicationId && (
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '0.5rem 0.8rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      alignItems: 'flex-end',
                      flexShrink: 0
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>Application: <strong>{jobTitle || 'Role'}</strong></span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '0.12rem 0.45rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: appStatus === 'accepted' || appStatus === 'shortlisted' ? 'rgba(16, 185, 129, 0.2)' : appStatus === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: appStatus === 'accepted' || appStatus === 'shortlisted' ? '#10b981' : appStatus === 'rejected' ? '#ef4444' : '#f59e0b'
                        }}
                      >
                        {appStatus}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {appStatus !== 'accepted' && (
                        <button
                          className="btn btn-sm btn-glass"
                          onClick={() => handleUpdateStatus('accepted')}
                          disabled={updatingStatus}
                          style={{ borderColor: '#10b981', color: '#10b981', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <i className="fa-solid fa-check"></i> Accept / Shortlist
                        </button>
                      )}
                      {appStatus !== 'rejected' && (
                        <button
                          className="btn btn-sm btn-glass"
                          onClick={() => handleUpdateStatus('rejected')}
                          disabled={updatingStatus}
                          style={{ borderColor: '#ef4444', color: '#ef4444', padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <i className="fa-solid fa-xmark"></i> Reject
                        </button>
                      )}
                      {appStatus !== 'pending' && (
                        <button
                          className="btn btn-sm btn-glass"
                          onClick={() => handleUpdateStatus('pending')}
                          disabled={updatingStatus}
                          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TAB NAVIGATION BAR */}
        <div
          className="hide-scrollbar"
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            background: 'var(--bg-card, #121826)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: '0 0.8rem',
            flexShrink: 0,
            minHeight: '46px',
            alignItems: 'center',
            gap: '0.2rem'
          }}
        >
          {[
            { id: 'overview', label: 'Overview & Profile', icon: 'fa-user' },
            { id: 'resume', label: `Resume (${student?.resume ? '1' : '0'})`, icon: 'fa-file-pdf' },
            { id: 'coding', label: `Code & Practice (${student?.practiceStats?.totalSolved || 0})`, icon: 'fa-code' },
            { id: 'tests', label: `Skill Tests (${student?.mockStats?.totalTests || 0})`, icon: 'fa-brain' },
            { id: 'interviews', label: `AI Interviews (${student?.interviewStats?.totalInterviews || 0})`, icon: 'fa-comments' },
            { id: 'verification', label: 'Verification Test', icon: 'fa-shield-halved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.75rem 0.95rem',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary, #3b82f6)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary, #3b82f6)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENTS (SCROLLABLE BODY) */}
        <div
          ref={contentBodyRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: activeTab === 'resume' ? 'hidden' : 'auto',
            padding: activeTab === 'resume' ? '0.85rem 1.4rem' : '1.5rem 1.8rem',
            background: 'var(--bg-main, #0b0f19)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
            </div>
          ) : !student ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No profile data available.
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & ACADEMIC PROFILE */}
              {activeTab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* HIGHLIGHT HERO STATS GRID */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                      gap: '0.75rem'
                    }}
                  >
                    {/* National Rank */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>National Rank</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary, #3b82f6)', marginTop: '0.1rem' }}>
                        #{student.rank || 1}
                      </div>
                    </div>

                    {/* TQ Score */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TQ Score</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.1rem' }}>
                        ⚡ {student.tqScore || 500}
                      </div>
                    </div>

                    {/* Problems Solved */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Solved Problems</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '0.1rem' }}>
                        💻 {student.practiceStats?.totalSolved || 0}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        DSA: {student.practiceStats?.dsaSolved || 0} | SQL: {student.practiceStats?.sqlSolved || 0}
                      </div>
                    </div>

                    {/* Skill Assessments */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Skill Tests</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.1rem' }}>
                        🎯 {student.mockStats?.totalTests || 0}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Avg: {student.mockStats?.avgAccuracy || 0}%
                      </div>
                    </div>

                    {/* AI Interviews */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: 'rgba(14, 165, 233, 0.05)', border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Interviews</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0ea5e9', marginTop: '0.1rem' }}>
                        🎙️ {student.interviewStats?.totalInterviews || 0}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Tech: {student.interviewStats?.avgTechScore || 0}%
                      </div>
                    </div>

                    {/* Verification Status */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: student.isVerified ? 'rgba(16, 185, 129, 0.05)' : 'rgba(100, 116, 139, 0.05)', border: student.isVerified ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verification</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: student.isVerified ? '#10b981' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {student.isVerified ? '🛡️ Verified' : 'Unverified'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {student.latestVerification?.certificateId || 'Standard Level'}
                      </div>
                    </div>

                    {/* Resume Status */}
                    <div className="glass-card" style={{ padding: '0.75rem 0.8rem', textAlign: 'center', background: student.resume ? 'rgba(59, 130, 246, 0.05)' : 'rgba(100, 116, 139, 0.05)', border: student.resume ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resume</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: student.resume ? 'var(--primary)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {student.resume ? '📄 Attached' : 'Missing'}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        {student.resume ? `${Math.round(student.resume.fileSize / 1024)} KB` : 'No file'}
                      </div>
                    </div>
                  </div>

                  {/* Academic & University Profile */}
                  <div className="glass-card" style={{ padding: '1.3rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                      <i className="fa-solid fa-graduation-cap"></i> Academic & Contact Background
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>University / College</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.university || 'Not Specified'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Degree / Stream</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.stream || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch / Specialization</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.branch || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Contact</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.phoneNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Address</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{student.email}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Platform Member Since</div>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Evaluation Box */}
                  <div className="glass-card" style={{ padding: '1.3rem', borderLeft: '4px solid #10b981' }}>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <i className="fa-solid fa-star"></i> Recruiter Talent Assessment Summary
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                      <strong>{student.name}</strong> holds a National Rank of <strong>#{student.rank || 1}</strong> with a Technical Quotient (TQ) of <strong>{student.tqScore || 500}</strong>.
                      {student.isVerified ? ' The candidate is an EarlyEdge Verified Talent through standard technical screening.' : ' The candidate is actively advancing towards merit verification.'}
                      {' '}They have solved <strong>{student.practiceStats?.totalSolved || 0} algorithmic problems</strong> (with {student.practiceStats?.acceptanceRate || 0}% acceptance rate), completed <strong>{student.mockStats?.totalTests || 0} skill assessments</strong> ({student.mockStats?.avgAccuracy || 0}% accuracy), and undergone <strong>{student.interviewStats?.totalInterviews || 0} AI technical interviews</strong>.
                    </p>
                  </div>

                  {/* Candidate Application History on EarlyEdge */}
                  {student.applications && student.applications.length > 0 && (
                    <div className="glass-card" style={{ padding: '1.3rem' }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary)' }}></i> EarlyEdge Job Applications ({student.applications.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {student.applications.map((app, idx) => (
                          <div
                            key={app._id || idx}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.7rem 0.9rem',
                              background: 'rgba(0,0,0,0.15)',
                              borderRadius: '8px',
                              border: '1px solid var(--border)'
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.92rem' }}>{app.jobTitle}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                                • {app.company}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                {new Date(app.appliedAt).toLocaleDateString()}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '4px',
                                  textTransform: 'uppercase',
                                  fontWeight: 700,
                                  background: app.status === 'accepted' ? 'rgba(16,185,129,0.2)' : app.status === 'rejected' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                                  color: app.status === 'accepted' ? '#10b981' : app.status === 'rejected' ? '#ef4444' : '#f59e0b'
                                }}
                              >
                                {app.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RESUME & ATS INSIGHTS */}
              {activeTab === 'resume' && (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {student.resume ? (
                    <>
                      {/* Resume Action & Details Header Bar (ALWAYS PINNED & VISIBLE AT TOP) */}
                      <div
                        className="glass-card"
                        style={{
                          padding: '0.75rem 1.1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          borderLeft: '4px solid var(--primary)',
                          flexShrink: 0
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.4rem' }}></i>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-main)' }}>
                              {student.resume.fileName || 'Candidate_Resume.pdf'}
                            </h4>
                            <p style={{ margin: '0.15rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                              Size: {Math.round((student.resume.fileSize || 0) / 1024)} KB • Type: {student.resume.fileType || 'application/pdf'} • Uploaded: {new Date(student.resume.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={handleOpenResume} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <i className="fa-solid fa-arrow-up-right-from-square"></i> Open in New Tab
                          </button>
                          <button className="btn btn-sm btn-glass" onClick={handleDownloadResume} style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <i className="fa-solid fa-download"></i> Download PDF
                          </button>
                        </div>
                      </div>

                      {/* Embedded PDF Preview (EXPANDS TO FILL ENTIRE REMAINING HEIGHT) */}
                      {student.resume.resumeData && (
                        <div
                          className="glass-card"
                          style={{
                            padding: '0.2rem',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'hidden',
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                        >
                          <iframe
                            src={resumeBlobUrl ? `${resumeBlobUrl}#view=FitH` : `${student.resume.resumeData}#view=FitH`}
                            title={`Resume - ${student.name}`}
                            style={{ width: '100%', height: '100%', flex: 1, border: 'none', borderRadius: '8px', display: 'block' }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: 'var(--border)' }}></i>
                      <h3>No Resume Uploaded</h3>
                      <p>The candidate has not uploaded a PDF resume yet.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CODE & PRACTICE ARENA */}
              {activeTab === 'coding' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.3rem' }}>
                  {/* Problem Solving Summary Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
                    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Solved</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                        {student.practiceStats?.totalSolved || 0}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Attempts: {student.practiceStats?.totalAttempts || 0}
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acceptance Rate</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {student.practiceStats?.acceptanceRate || 0}%
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Consistency Index</div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Difficulty Breakdown</div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.4rem', fontSize: '0.82rem' }}>
                        <span style={{ color: '#10b981' }}>Easy: <strong>{student.practiceStats?.easySolved || 0}</strong></span>
                        <span style={{ color: '#f59e0b' }}>Med: <strong>{student.practiceStats?.mediumSolved || 0}</strong></span>
                        <span style={{ color: '#ef4444' }}>Hard: <strong>{student.practiceStats?.hardSolved || 0}</strong></span>
                      </div>
                    </div>

                    <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Track Distribution</div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.4rem', fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--primary)' }}>DSA: <strong>{student.practiceStats?.dsaSolved || 0}</strong></span>
                        <span style={{ color: '#8b5cf6' }}>SQL: <strong>{student.practiceStats?.sqlSolved || 0}</strong></span>
                        <span style={{ color: '#0ea5e9' }}>OOPS: <strong>{student.practiceStats?.oopsSolved || 0}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '0.3rem' }}>Filter Problems:</span>
                    {['all', 'solved', 'dsa', 'sql', 'oops'].map(filterKey => (
                      <button
                        key={filterKey}
                        onClick={() => setPracticeFilter(filterKey)}
                        className={`btn btn-sm ${practiceFilter === filterKey ? 'btn-primary' : 'btn-glass'}`}
                        style={{ padding: '0.25rem 0.65rem', fontSize: '0.76rem', textTransform: 'uppercase' }}
                      >
                        {filterKey}
                      </button>
                    ))}
                  </div>

                  {/* Solved Problems List */}
                  {filteredSubmissions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-code" style={{ fontSize: '2rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      <p>No practice submissions match the selected filter.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {filteredSubmissions.map(sub => (
                        <div key={sub._id || sub.problemId} className="glass-card" style={{ padding: '0.9rem 1.1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  background: sub.status === 'Solved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                  color: sub.status === 'Solved' ? '#10b981' : '#f59e0b'
                                }}
                              >
                                {sub.status}
                              </span>
                              <strong style={{ fontSize: '0.95rem' }}>
                                #{sub.problemNumber || 1}. {sub.title}
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '0.1rem 0.4rem',
                                  borderRadius: '4px',
                                  background: sub.difficulty === 'Easy' ? 'rgba(16, 185, 129, 0.1)' : sub.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: sub.difficulty === 'Easy' ? '#10b981' : sub.difficulty === 'Hard' ? '#ef4444' : '#f59e0b'
                                }}
                              >
                                {sub.difficulty}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                [{sub.category}]
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Lang: <strong>{sub.lastLanguage || 'python'}</strong> • Attempts: {sub.attemptsCount || 1}
                              </span>
                              {sub.lastCode && (
                                <button
                                  className="btn btn-sm btn-glass"
                                  onClick={() => setExpandedCodeId(expandedCodeId === sub.problemId ? null : sub.problemId)}
                                  style={{ padding: '0.2rem 0.55rem', fontSize: '0.75rem' }}
                                >
                                  {expandedCodeId === sub.problemId ? 'Hide Code' : 'Inspect Code'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable Submitted Code Viewer */}
                          {expandedCodeId === sub.problemId && sub.lastCode && (
                            <div style={{ marginTop: '0.8rem', background: 'var(--arena-code-bg, #0d1117)', borderRadius: '8px', padding: '0.8rem', border: '1px solid var(--border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span><i className="fa-solid fa-code"></i> Submitted Solution Code ({sub.lastLanguage})</span>
                                <span>Solved: {sub.lastSolvedAt ? new Date(sub.lastSolvedAt).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <pre style={{ margin: 0, padding: 0, fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--arena-code-fg, #4ade80)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                {sub.lastCode}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SKILL ASSESSMENTS & MOCK TESTS */}
              {activeTab === 'tests' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {(!student.mockTests || student.mockTests.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-brain" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      <h3>No Mock Tests Taken Yet</h3>
                      <p>Candidate has not completed any full technical skill assessments.</p>
                    </div>
                  ) : (
                    student.mockTests.map((t, idx) => (
                      <div key={t._id || idx} className="glass-card" style={{ padding: '1.3rem', borderLeft: '4px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary)' }}>
                              {t.type || t.domain || 'Technical Assessment'}
                            </h4>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Date: {new Date(t.timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: t.accuracy >= 70 ? '#10b981' : '#f59e0b' }}>
                              {t.accuracy}% Accuracy
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Score: {t.score} / {t.total}</div>
                          </div>
                        </div>

                        {/* Part A, B, C Breakdown Box */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.9rem', textAlign: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Part A (MCQs)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>{t.partAScore || 0}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Part B (Subjective)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>{t.partBScore || 0}%</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Part C (Live Code)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>{t.partCScore || 0}%</div>
                          </div>
                        </div>

                        {/* Sage AI Evaluation Feedback */}
                        {t.aiEvaluation && (
                          <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '0.9rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '0.8rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <i className="fa-solid fa-robot"></i> Sage AI Evaluation & Hiring Recommendation
                            </div>
                            {t.aiEvaluation.aiSummary && (
                              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', lineHeight: '1.5' }}>
                                {t.aiEvaluation.aiSummary}
                              </p>
                            )}
                            {t.aiEvaluation.recommendation && (
                              <div style={{ fontSize: '0.82rem', color: '#10b981', fontWeight: 600 }}>
                                💡 Recommendation: {t.aiEvaluation.recommendation}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Part C Code Submission */}
                        {t.codeSubmitted && (
                          <details style={{ background: 'var(--arena-code-bg, #090d16)', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                            <summary style={{ color: '#10b981', cursor: 'pointer', fontWeight: 700 }}>
                              <i className="fa-solid fa-code"></i> View Part C DSA Submitted Code
                            </summary>
                            <pre style={{ margin: '0.6rem 0 0 0', fontFamily: 'monospace', color: 'var(--arena-code-fg, #4ade80)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                              {t.codeSubmitted}
                            </pre>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: AI TECHNICAL INTERVIEWS */}
              {activeTab === 'interviews' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {(!student.interviews || student.interviews.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-microphone-slash" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', display: 'block' }}></i>
                      <h3>No AI Interviews Recorded</h3>
                      <p>The candidate has not completed an interactive voice AI technical interview.</p>
                    </div>
                  ) : (
                    student.interviews.map((iv, idx) => (
                      <div key={iv._id || idx} className="glass-card" style={{ padding: '1.3rem', borderLeft: '4px solid #0ea5e9' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.8rem' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <i className="fa-solid fa-headset"></i> {iv.type || 'Technical Voice Interview'}
                            </h4>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              Stack: <strong>{iv.techStack || 'General Engineering'}</strong> • Duration: {iv.duration || 10} min • Date: {new Date(iv.timestamp).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.8rem', textAlign: 'center' }}>
                            <div style={{ background: 'rgba(14, 165, 233, 0.1)', padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Technical</div>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0ea5e9' }}>
                                {iv.scores?.technical || 0}%
                              </div>
                            </div>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.7rem', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Communication</div>
                              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                                {iv.scores?.communication || 0}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI Report */}
                        {iv.report && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.9rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.8rem', fontSize: '0.88rem', lineHeight: '1.6' }}>
                            <div style={{ fontWeight: 700, color: '#0ea5e9', marginBottom: '0.4rem' }}>
                              <i className="fa-solid fa-clipboard-check"></i> Interviewer Evaluation Report:
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: iv.report }} />
                          </div>
                        )}

                        {/* Interview Chat Transcript */}
                        {iv.chatHistory && iv.chatHistory.length > 0 && (
                          <details style={{ background: 'rgba(0,0,0,0.25)', padding: '0.7rem', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.82rem' }}>
                            <summary style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>
                              <i className="fa-solid fa-comments"></i> View Full Interview Q&A Transcript ({iv.chatHistory.length} Exchanges)
                            </summary>
                            <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                              {iv.chatHistory.map((item, qIdx) => (
                                <div key={qIdx} style={{ background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px' }}>
                                  <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.2rem' }}>
                                    🤖 AI Question: {item.question}
                                  </div>
                                  <div style={{ color: 'var(--text-main)', paddingLeft: '0.8rem', borderLeft: '2px solid #10b981' }}>
                                    🎙️ Candidate: {item.answer || '(No audible response)'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 6: PREMIUM VERIFICATION TEST */}
              {activeTab === 'verification' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {student.latestVerification ? (
                    <div className="glass-card" style={{ padding: '1.5rem', borderLeft: student.latestVerification.passed ? '4px solid #10b981' : '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: student.latestVerification.passed ? '#10b981' : '#ef4444' }}>
                            <i className={`fa-solid ${student.latestVerification.passed ? 'fa-certificate' : 'fa-circle-xmark'}`}></i>
                            {student.latestVerification.passed ? 'Official Verification Passed' : 'Verification Assessment Attempted'}
                          </h4>
                          <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            Completed: {new Date(student.latestVerification.timestamp).toLocaleDateString()} • Standard: 80% passing threshold
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: student.latestVerification.passed ? '#10b981' : '#ef4444' }}>
                            Score: {student.latestVerification.score} / {student.latestVerification.total}
                          </div>
                          {student.latestVerification.certificateId && (
                            <span style={{ fontSize: '0.78rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid #10b981', fontWeight: 700 }}>
                              ID: {student.latestVerification.certificateId}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Question Breakdown History */}
                      {student.latestVerification.history && student.latestVerification.history.length > 0 && (
                        <div>
                          <h5 style={{ margin: '0 0 0.8rem 0', color: 'var(--text-muted)' }}>Question-by-Question Result Breakdown:</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {student.latestVerification.history.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                style={{
                                  padding: '0.7rem 0.9rem',
                                  background: 'rgba(0,0,0,0.2)',
                                  borderRadius: '6px',
                                  borderLeft: q.isCorrect ? '3px solid #10b981' : '3px solid #ef4444',
                                  fontSize: '0.84rem'
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>
                                  Q{qIdx + 1}: {q.question}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                  <span>Selected: <strong style={{ color: q.isCorrect ? '#10b981' : '#ef4444' }}>{q.userAnswer}</strong></span>
                                  {!q.isCorrect && <span>Correct: <strong style={{ color: '#10b981' }}>{q.correct}</strong></span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                      <i className="fa-solid fa-shield-slash" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', color: 'var(--border)' }}></i>
                      <h3>No Verification Test Attempted</h3>
                      <p>The candidate has not taken the timed 5-question Premium Assessment yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div
          style={{
            padding: '0.85rem 1.6rem',
            background: 'var(--bg-card, #121826)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span>EarlyEdge Verified Talent Profile • Confidential Recruiter Review</span>
            {isFullScreen && (
              <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '0.12rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                Full Screen Mode
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn btn-sm btn-glass"
              onClick={() => setIsFullScreen(!isFullScreen)}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <i className={`fa-solid ${isFullScreen ? 'fa-compress' : 'fa-expand'}`}></i>
              {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
            <button className="btn btn-sm btn-glass" onClick={onClose} style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem' }}>
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
