import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import CandidateProfileModal from '../components/CandidateProfileModal.jsx';

export default function RecruiterAnalytics({ onSwitchView }) {
  const { user, apiFetch } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  
  // Compiled general analytics stats
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    avgApps: 0,
    jobsWithApps: 0
  });

  // Detailed specific job analytics modal
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobApps, setSelectedJobApps] = useState([]);

  // Candidate dossier modal states
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedAppStatus, setSelectedAppStatus] = useState('pending');

  // Fetch all recruiter data
  const loadRecruiterData = async () => {
    setLoading(true);
    try {
      // 1. Fetch posted jobs
      const jobsRes = await apiFetch('/api/jobs');
      const jobsData = await jobsRes.json();
      
      if (jobsData.success) {
        setJobs(jobsData.jobs);

        // Fetch applications for each job to compile recruiter stats
        const jobIds = jobsData.jobs.map(j => j.id);
        if (jobIds.length > 0) {
          // Loop and fetch applicants contextually (REST monorepo standard)
          const allAppsPromises = jobIds.map(async id => {
            const res = await apiFetch(`/api/jobs/${id}/applicants`);
            const data = await res.json();
            return data.success ? data.applicants : [];
          });

          const resolvedApps = await Promise.all(allAppsPromises);
          const flatApps = resolvedApps.flat();
          setApplications(flatApps);

          // Calculate metrics
          const totalJobs = jobsData.jobs.length;
          const totalApplications = flatApps.length;
          const avgApps = totalJobs > 0 ? (totalApplications / totalJobs).toFixed(1) : 0;
          
          const uniqueJobIdsWithApps = [...new Set(flatApps.map(app => app.jobId))];
          const jobsWithApps = uniqueJobIdsWithApps.length;

          setStats({ totalJobs, totalApplications, avgApps, jobsWithApps });
        }
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRecruiterData();
  }, [user.uid]);

  // Open detailed job modal
  const handleOpenJobDetails = (job) => {
    const jobApps = applications.filter(app => app.jobId === job.id);
    setSelectedJob(job);
    setSelectedJobApps(jobApps);
    setJobModalOpen(true);
  };

  // Open student candidate profile dossier modal
  const handleOpenStudentProfile = (studentId, appId = null, status = 'pending') => {
    setSelectedStudentId(studentId);
    setSelectedAppId(appId);
    setSelectedAppStatus(status || 'pending');
    setStudentModalOpen(true);
  };

  return (
    <div className="panel active">
      {/* General Stats Grid */}
      <div className="grid-cards" style={{ marginBottom: '2.5rem' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', color: 'var(--primary)', fontWeight: 'bold' }}>{stats.totalJobs}</div>
          <div style={{ color: 'var(--text-muted)' }}>Jobs Posted</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', color: 'var(--success)', fontWeight: 'bold' }}>{stats.totalApplications}</div>
          <div style={{ color: 'var(--text-muted)' }}>Total Applications</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', color: 'var(--secondary)', fontWeight: 'bold' }}>{stats.avgApps}</div>
          <div style={{ color: 'var(--text-muted)' }}>Avg. Applications / Job</div>
        </div>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.2rem', color: 'var(--error)', fontWeight: 'bold' }}>{stats.jobsWithApps}/{stats.totalJobs}</div>
          <div style={{ color: 'var(--text-muted)' }}>Jobs with Applications</div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>Job Metrics Dashboard</h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-chart-line" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block' }}></i>
          <h4>No Analytics Data</h4>
          <p style={{ marginTop: '0.5rem' }}>Post job opportunities to track candidate applications.</p>
          <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onSwitchView('recruiter')}>
            Post a Job
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '1.8rem' }}>
          <h5 style={{ marginBottom: '1.2rem', color: 'var(--text-muted)' }}><i className="fa-solid fa-list"></i> Select Job to View Details</h5>
          
          {/* JOBS LISTING */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {jobs.map(job => {
              const jobApps = applications.filter(app => app.jobId === job.id);
              return (
                <div key={job.id} className="history-item" onClick={() => handleOpenJobDetails(job)}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{job.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {job.company} • {job.location} • {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{jobApps.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>applications</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 📊 SPECIFIC JOB METRICS DETAIL MODAL OVERLAY         */}
      {/* ==================================================== */}
      {jobModalOpen && selectedJob && (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setJobModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ color: 'var(--primary)', marginBottom: '0.25rem' }}>{selectedJob.title}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              {selectedJob.company} • {selectedJob.location} • Posted: {new Date(selectedJob.createdAt).toLocaleDateString()}
            </p>

            {/* Quick Metrics */}
            <div className="grid-cards" style={{ marginBottom: '2rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--primary)' }}>{selectedJobApps.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Applications</div>
              </div>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)' }}>
                  {selectedJobApps.filter(a => a.hasResume).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>With Resume</div>
              </div>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{selectedJob.views || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unique Views</div>
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-users"></i> Applicant Profiles</h4>

            {/* APPLICANTS CHECKLIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '350px', overflowY: 'auto' }}>
              {selectedJobApps.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No applications yet.</p>
              ) : (
                selectedJobApps.map(app => (
                  <div key={app._id} className="history-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', padding: '0.9rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.98rem' }}>{app.studentName}</strong>
                        {app.isVerified && (
                          <span style={{ fontSize: '0.68rem', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid #10b981', fontWeight: 600 }}>
                            <i className="fa-solid fa-check-circle"></i> Verified
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          background: app.status === 'accepted' ? 'rgba(16,185,129,0.15)' : app.status === 'rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                          color: app.status === 'accepted' ? '#10b981' : app.status === 'rejected' ? '#ef4444' : '#f59e0b'
                        }}>
                          {app.status || 'pending'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {app.studentEmail} {app.university && app.university !== 'Not Specified' ? `• 🎓 ${app.university}` : ''}
                      </div>

                      {/* Performance Micro Chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.45rem' }}>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          🏆 #{app.rank || 1}
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          ⚡ {app.tqScore || 500} TQ
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          💻 {app.practiceStats?.totalSolved || 0} Solved
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          🎯 {app.mockTestStats?.count || 0} Tests
                        </span>
                        <span style={{ fontSize: '0.72rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 600 }}>
                          🎙️ {app.interviewStats?.count || 0} Interviews
                        </span>
                        <span style={{ fontSize: '0.72rem', background: app.hasResume ? 'rgba(59, 130, 246, 0.1)' : 'rgba(100, 116, 139, 0.1)', color: app.hasResume ? 'var(--primary)' : 'var(--text-muted)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          📄 {app.hasResume ? 'Resume Attached' : 'No Resume'}
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleOpenStudentProfile(app.studentId, app._id, app.status)}
                      style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <i className="fa-solid fa-id-card"></i> View Full Profile
                    </button>
                  </div>
                ))
              )}
            </div>

            <button className="btn btn-glass" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setJobModalOpen(false)}>
              Close Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 👤 RECRUITER COMPREHENSIVE CANDIDATE PROFILE MODAL    */}
      {/* ==================================================== */}
      {studentModalOpen && selectedStudentId && (
        <CandidateProfileModal
          studentId={selectedStudentId}
          applicationId={selectedAppId}
          currentStatus={selectedAppStatus}
          jobTitle={selectedJob?.title || ''}
          onClose={() => {
            setStudentModalOpen(false);
            setSelectedStudentId(null);
          }}
          onStatusChange={(appId, newStatus) => {
            setSelectedAppStatus(newStatus);
            setSelectedJobApps(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
            setApplications(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
          }}
        />
      )}

    </div>
  );
}
