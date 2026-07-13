import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function JobCard({ job, applied, onApply, onDelete, onViewApplicants, onUnlockTrigger }) {
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

    // Delay a bit to ensure user actually saw it
    const delay = setTimeout(trackView, 1500);
    return () => clearTimeout(delay);
  }, [isLocked, job.id]);

  // Calculate clean time ago formatting
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

  const isOwner = user.role === 'recruiter' && user.uid === job.recruiterId;

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

      {/* Actual Job Info */}
      <div style={{ filter: isLocked ? 'blur(4px)' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ marginBottom: '0.2rem' }}>{job.title}</h4>
            <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}>{job.company}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
              {job.type || 'Full Time'}
            </span>
            {isOwner && (
              <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                Your Post
              </span>
            )}
          </div>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <span><i className="fa-solid fa-location-dot"></i> {job.location || 'Remote'}</span>
          <span><i className="fa-solid fa-clock"></i> {formatTimeAgo(job.createdAt)}</span>
          <span><i className="fa-solid fa-eye"></i> {job.views || 0} view{job.views !== 1 ? 's' : ''}</span>
        </div>

        <p style={{ marginBottom: '1rem', lineHeight: '1.5', fontSize: '0.95rem' }}>{job.description}</p>

        {job.requirements && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Requirements:</strong>
            <div dangerouslySetInnerHTML={{ __html: job.requirements }} style={{ paddingLeft: '1rem' }}></div>
          </div>
        )}

        {/* CTA ACTIONS BAR */}
        {user.role === 'student' ? (
          !isLocked && (
            applied ? (
              <button className="btn btn-glass" style={{ width: '100%', cursor: 'not-allowed', opacity: 0.7 }} disabled>
                <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> Applied
              </button>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={onApply}>
                Apply Now <i className="fa-solid fa-paper-plane"></i>
              </button>
            )
          )
        ) : (
          isOwner && (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={onViewApplicants}>
                <i className="fa-solid fa-users"></i> View Applicants
              </button>
              <button className="btn btn-error" style={{ flex: 1 }} onClick={onDelete}>
                <i className="fa-solid fa-trash"></i> Delete Job
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
