import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

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

  // Student Profile detail view inside modal
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentResume, setStudentResume] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

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

  // Open student profile preview
  const handleOpenStudentProfile = async (studentId) => {
    setStudentModalOpen(true);
    setLoadingStudent(true);
    setStudentProfile(null);
    setStudentResume(null);

    try {
      const userRes = await apiFetch(`/api/auth/student/${studentId}`);
      const userData = await userRes.json();
      if (userData.success) {
        setStudentProfile(userData.user);
      }

      const resumeRes = await apiFetch(`/api/assessments/resume/${studentId}`);
      const resumeData = await resumeRes.json();
      if (resumeData.success) {
        setStudentResume(resumeData.resume);
      }
    } catch (err) {
      console.log('Error opening profile');
    }
    setLoadingStudent(false);
  };

  // View PDF resume in new tab iframe
  const handleViewResume = async (studentId, fileName) => {
    try {
      const res = await apiFetch(`/api/assessments/resume/${studentId}`);
      const data = await res.json();
      if (data.success && data.resume?.resumeData) {
        const win = window.open();
        if (win) {
          win.document.write(
            `<iframe src="${data.resume.resumeData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
          win.document.title = `Verified Resume - ${fileName || 'Candidate'}`;
        }
      } else {
        alert('Resume not found or data missing.');
      }
    } catch (err) {
      console.error(err);
    }
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '300px', overflowY: 'auto' }}>
              {selectedJobApps.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No applications yet.</p>
              ) : (
                selectedJobApps.map(app => (
                  <div key={app._id} className="history-item">
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{app.studentName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                        {app.studentEmail} • {app.hasResume ? 'Resume PDF Loaded' : 'No Resume'}
                      </div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleOpenStudentProfile(app.studentId)}>
                      <i className="fa-solid fa-eye"></i> View Profile
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
      {/* 👤 STUDENT DETAIL PROFILE MODAL INSIDE ANALYTICS     */}
      {/* ==================================================== */}
      {studentModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setStudentModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {loadingStudent ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
              </div>
            ) : !studentProfile ? (
              <p style={{ textAlign: 'center' }}>Could not load student profile.</p>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '80px', height: '80px', background: 'var(--primary)', color: 'white',
                    fontSize: '2rem', fontWeight: 'bold', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                    boxShadow: '0 0 20px var(--primary-glow)', overflow: 'hidden'
                  }}>
                    {studentProfile.photoURL ? (
                      <img src={studentProfile.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      studentProfile.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{studentProfile.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{studentProfile.email}</p>
                  {studentProfile.isVerified && (
                    <span className="badge" style={{ background: 'var(--success)', color: 'white', marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', display: 'inline-block' }}>
                      <i className="fa-solid fa-check-circle"></i> Verified Student
                    </span>
                  )}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                    Profile Details
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Role</div>
                      <div>Student / Talent</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Joined</div>
                      <div>{new Date(studentProfile.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {(studentProfile.university || studentProfile.stream || studentProfile.branch) && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <h5 style={{ marginBottom: '0.8rem', color: 'var(--primary)' }}>Education Details</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {studentProfile.university && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>University / College</div>
                            <div style={{ fontWeight: 500 }}>{studentProfile.university}</div>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {studentProfile.stream && (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stream</div>
                              <div>{studentProfile.stream}</div>
                            </div>
                          )}
                          {studentProfile.branch && (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch</div>
                              <div>{studentProfile.branch}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>Resume</h4>
                  {studentResume ? (
                    <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Resume Available</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            <i className="fa-solid fa-file-pdf"></i> {studentResume.fileName} ({Math.round(studentResume.fileSize / 1024)} KB)
                          </div>
                        </div>
                        <button className="btn btn-sm btn-primary" onClick={() => handleViewResume(studentProfile.uid, studentResume.fileName)}>
                          <i className="fa-solid fa-eye"></i> View
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                      <i className="fa-solid fa-file-circle-xmark" style={{ fontSize: '1.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'block' }}></i>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No resume uploaded by candidate.</p>
                    </div>
                  )}
                </div>

                <button className="btn btn-glass" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setStudentModalOpen(false)}>
                  Close Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
