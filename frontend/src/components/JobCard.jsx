import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function JobCard({ job, applied, onApply, onDelete, onViewApplicants, onUnlockTrigger, onOpenDetails }) {
  const { user, apiFetch } = useContext(AuthContext);
  const [remaining, setRemaining] = useState(job.lockRemainingMinutes || 0);
  const [isLocked, setIsLocked] = useState(job.isLocked);

  // Countdown timer handler for locked jobs
  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsLocked(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, [isLocked]);

  // Track unique job views dynamically
  useEffect(() => {
    if (isLocked) return;

    const trackView = async () => {
      try {
        await apiFetch(`/api/jobs/${job.id}/view`, { method: 'POST' });
      } catch (err) {
        console.error('View tracking failed:', err);
      }
    };

    const delay = setTimeout(trackView, 1500);
    return () => clearTimeout(delay);
  }, [isLocked, job.id]);

  const formatTimeAgo = (ts) => {
    const now = Date.now();
    const diff = now - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
  };

  const isOwner = user?.role === 'recruiter' && user?.uid === job.recruiterId;

  return (
    <div className={`job-card ${isLocked ? 'locked' : ''}`} style={{ position: 'relative' }}>
      
      {/* Blurred countdown cover for unverified candidates */}
      {isLocked && (
        <div className="lock-overlay" onClick={onUnlockTrigger} style={{ cursor: 'pointer' }}>
          <div className="timer-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fa-solid fa-lock"></i>
            <span>Exclusive: {remaining}m remaining</span>
          </div>
        </div>
      )}

      {/* Compact Summary Header */}
      <div style={{ filter: isLocked ? 'blur(4px)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <div>
            <h4
              style={{
                marginBottom: '0.25rem',
                cursor: isLocked ? 'default' : 'pointer',
                color: 'var(--text-main)',
                transition: 'color 0.2s'
              }}
              onClick={() => !isLocked && onOpenDetails && onOpenDetails(job)}
            >
              {job.title}
            </h4>
            <p style={{ color: 'var(--primary)', fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{job.company}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {job.type || 'Full Time'}
            </span>
            {isOwner && (
              <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                Your Post
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.2rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i> {job.location || 'Remote'}</span>
          <span><i className="fa-solid fa-clock"></i> {formatTimeAgo(job.createdAt)}</span>
          <span><i className="fa-solid fa-eye"></i> {job.views || 0} view{job.views !== 1 ? 's' : ''}</span>
          {applied && (
            <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <i className="fa-solid fa-check-circle"></i> Applied
            </span>
          )}
        </div>

        {/* Compact Action Bar */}
        {!isLocked && (
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.8rem' }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              onClick={() => onOpenDetails && onOpenDetails(job)}
            >
              <i className="fa-solid fa-circle-info"></i> {user?.role === 'recruiter' || applied ? 'View Details' : 'View Details & Apply'}
            </button>
            {isOwner && (
              <button
                className="btn btn-glass"
                style={{ padding: '0.6rem 1rem' }}
                onClick={onViewApplicants}
                title="View Applicants"
              >
                <i className="fa-solid fa-users"></i> Applicants
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
