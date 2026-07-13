import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import JobCard from '../components/JobCard.jsx';

export default function Feed({ onSwitchView }) {
  const { user, apiFetch } = useContext(AuthContext);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('Any');
  
  // Tracking candidate applications
  const [appliedJobIds, setAppliedJobIds] = useState([]);

  // Recruiter specific modals
  const [applicantsModalOpen, setApplicantsModalOpen] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [activeJobTitle, setActiveJobTitle] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Candidate viewing other profile modal
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Fetch Jobs & Applications
  const loadFeedData = async () => {
    setLoading(true);
    try {
      // 1. Fetch jobs
      const jobsRes = await apiFetch(`/api/jobs?search=${search}&location=${location}`);
      const jobsData = await jobsRes.json();
      if (jobsData.success) {
        setJobs(jobsData.jobs);
      }

      // 2. Fetch candidate applications
      if (user.role === 'student') {
        const appsRes = await apiFetch('/api/jobs/applications/me');
        const appsData = await appsRes.json();
        if (appsData.success) {
          const ids = appsData.applications.map(app => app.jobId);
          setAppliedJobIds(ids);
        }
      }
    } catch (err) {
      console.error('Error fetching feed data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeedData();
  }, [search, location]);

  // Candidate apply handler
  const handleApply = async (jobId, jobTitle, jobCompany) => {
    if (!confirm(`Apply for "${jobTitle}" at "${jobCompany}"?`)) return;

    try {
      // Check if user has uploaded a resume
      const resumeRes = await apiFetch('/api/assessments/resume');
      const resumeData = await resumeRes.json();

      if (!resumeData.resume) {
        const chooseUpload = confirm("You haven't uploaded a resume yet.\n\nClick OK to switch to your profile and upload one first, or Cancel to apply without a resume.");
        if (chooseUpload) {
          onSwitchView('profile');
          // Smooth scroll to resume section after DOM mounts
          setTimeout(() => {
            const section = document.getElementById('resume-section');
            if (section) {
              section.scrollIntoView({ behavior: 'smooth' });
              section.style.border = "2px solid var(--primary)";
              section.style.boxShadow = "0 0 20px var(--primary-glow)";
              setTimeout(() => {
                section.style.border = "";
                section.style.boxShadow = "";
              }, 4000);
            }
          }, 300);
          return;
        }
      }

      // Execute apply
      const applyRes = await apiFetch(`/api/jobs/${jobId}/apply`, { method: 'POST' });
      const applyData = await applyRes.json();

      if (applyData.success) {
        alert('✅ Application sent successfully!');
        loadFeedData(); // reload
      } else {
        alert(`Apply Failed: ${applyData.message}`);
      }
    } catch (err) {
      console.error('Apply error:', err);
      alert('Error submitting application');
    }
  };

  // Recruiter delete job
  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!confirm(`Are you sure you want to permanently delete job posting: "${jobTitle}"?`)) return;

    try {
      const res = await apiFetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('Job deleted successfully');
        loadFeedData();
      }
    } catch (err) {
      console.error('Delete job error:', err);
    }
  };

  // Recruiter view applicants modal
  const handleOpenApplicants = async (jobId, jobTitle) => {
    setActiveJobId(jobId);
    setActiveJobTitle(jobTitle);
    setApplicantsModalOpen(true);
    setLoadingApplicants(true);

    try {
      const res = await apiFetch(`/api/jobs/${jobId}/applicants`);
      const data = await res.json();
      if (data.success) {
        setApplicants(data.applicants);
      }
    } catch (err) {
      console.error('Error fetching applicants:', err);
    }
    setLoadingApplicants(false);
  };

  // Recruiter Keep / Remove applicant status changes
  const handleUpdateStatus = async (appId, status) => {
    const actionName = status === 'shortlisted' ? 'Keep' : 'Remove';
    if (!confirm(`Are you sure you want to ${actionName} this candidate application?`)) return;

    try {
      const res = await apiFetch(`/api/jobs/applications/${appId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      const data = await res.json();

      if (data.success) {
        // Refresh active applicants list
        handleOpenApplicants(activeJobId, activeJobTitle);
      } else {
        alert(`Failed to update: ${data.message}`);
      }
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  // Recruiter view student inline profile details
  const handleViewStudentProfile = async (studentId) => {
    setProfileModalOpen(true);
    setLoadingProfile(true);
    setSelectedStudent(null);
    setSelectedResume(null);

    try {
      // 1. Fetch user info
      const userRes = await apiFetch(`/api/auth/student/${studentId}`);
      const userData = await userRes.json();
      if (userData.success) {
        setSelectedStudent(userData.user);
      }

      // 2. Fetch resume metadata
      const resumeRes = await apiFetch(`/api/assessments/resume/${studentId}`);
      const resumeData = await resumeRes.json();
      if (resumeData.success) {
        setSelectedResume(resumeData.resume);
      }
    } catch (err) {
      console.log('Resume or profile not found');
    }
    setLoadingProfile(false);
  };

  // Recruiter view student PDF resume in new browser tab iframe
  const handleOpenStudentResume = async (studentId, fileName) => {
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
        } else {
          alert('Please allow popups to view candidate resumes.');
        }
      } else {
        alert('Resume file data missing or not found.');
      }
    } catch (err) {
      console.error('Fetch resume error:', err);
      alert('Error fetching candidate resume.');
    }
  };

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

  return (
    <div className="panel active">
      {/* Search Header Filters */}
      <div className="search-bar-container" style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search role, stack, or company..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-select"
          style={{ width: '200px' }}
          value={location}
          onChange={e => setLocation(e.target.value)}
        >
          <option value="Any">All Locations</option>
          <option value="Remote">Remote</option>
          <option value="Bengaluru">Bengaluru</option>
          <option value="Mumbai">Mumbai</option>
          <option value="Delhi">Delhi</option>
          <option value="Hyderabad">Hyderabad</option>
          <option value="Chennai">Chennai</option>
          <option value="Pune">Pune</option>
          <option value="Gurgaon">Gurgaon</option>
        </select>
      </div>

      <h3 style={{ marginBottom: '1.5rem' }}>
        {user.role === 'recruiter' ? 'Your Posted Opportunities' : 'Live Opportunities'}
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <p>Loading Opportunities...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-folder-open" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}></i>
          <h4>No Opportunities Found</h4>
          <p style={{ marginTop: '0.5rem' }}>
            {user.role === 'recruiter' ? "You haven't posted any jobs yet." : "Check back later for new opportunities."}
          </p>
          {user.role === 'recruiter' && (
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => onSwitchView('recruiter')}>
              Post a Job
            </button>
          )}
        </div>
      ) : (
        <div className="feed-grid">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedJobIds.includes(job.id)}
              onApply={() => handleApply(job.id, job.title, job.company)}
              onDelete={() => handleDeleteJob(job.id, job.title)}
              onViewApplicants={() => handleOpenApplicants(job.id, job.title)}
              onUnlockTrigger={() => onSwitchView('tests')}
            />
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* 📋 RECRUITER APPLICANTS MANAGEMENT MODAL             */}
      {/* ==================================================== */}
      {applicantsModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto' }}>
            <button onClick={() => setApplicantsModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ marginBottom: '1.5rem' }}>Applicants for "{activeJobTitle}"</h3>

            {loadingApplicants ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
              </div>
            ) : applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <i className="fa-solid fa-users-slash" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></i>
                <p>No applicants yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applicants.map(app => {
                  const isShortlisted = app.status === 'shortlisted';
                  const isRejected = app.status === 'rejected';

                  return (
                    <div key={app._id} className="glass-card" style={{
                      padding: '1.2rem',
                      opacity: isRejected ? 0.6 : 1,
                      border: isShortlisted ? '1px solid var(--success)' : isRejected ? '1px solid var(--error)' : '1px solid var(--border)',
                      background: isShortlisted ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-card)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            {app.studentName}
                            {isShortlisted && (
                              <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-check"></i> Kept
                              </span>
                            )}
                            {isRejected && (
                              <span style={{ fontSize: '0.75rem', background: 'var(--error)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-xmark"></i> Removed
                              </span>
                            )}
                          </h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                            <i className="fa-solid fa-envelope"></i> {app.studentEmail}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            <i className="fa-solid fa-clock"></i> Applied {formatTimeAgo(app.appliedAt)}
                            {app.resumeFileName && ` • File: ${app.resumeFileName}`}
                          </p>

                          {/* Keep/Remove actions */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {!isShortlisted && (
                              <button className="btn btn-sm btn-glass" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleUpdateStatus(app._id, 'shortlisted')}>
                                <i className="fa-solid fa-check"></i> Keep
                              </button>
                            )}
                            {!isRejected && (
                              <button className="btn btn-sm btn-glass" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => handleUpdateStatus(app._id, 'rejected')}>
                                <i className="fa-solid fa-trash"></i> Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-glass" onClick={() => handleViewStudentProfile(app.studentId)}>
                            <i className="fa-solid fa-eye"></i> View Profile
                          </button>
                          {app.hasResume ? (
                            <button className="btn btn-sm btn-primary" onClick={() => handleOpenStudentResume(app.studentId, app.resumeFileName)}>
                              <i className="fa-solid fa-file-pdf"></i> View Resume
                            </button>
                          ) : (
                            <button className="btn btn-sm btn-glass" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                              No Resume
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 👤 STUDENT DETAIL PROFILE CARD MODAL                 */}
      {/* ==================================================== */}
      {profileModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setProfileModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            {loadingProfile ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem' }}></i>
              </div>
            ) : !selectedStudent ? (
              <p style={{ textAlign: 'center' }}>Profile profile could not be loaded.</p>
            ) : (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '80px', height: '80px', background: 'var(--primary)', color: 'white',
                    fontSize: '2rem', fontWeight: 'bold', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                    boxShadow: '0 0 20px var(--primary-glow)', overflow: 'hidden'
                  }}>
                    {selectedStudent.photoURL ? (
                      <img src={selectedStudent.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      selectedStudent.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{selectedStudent.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{selectedStudent.email}</p>
                  {selectedStudent.isVerified && (
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
                      <div>{new Date(selectedStudent.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {(selectedStudent.university || selectedStudent.stream || selectedStudent.branch) && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem' }}>
                      <h5 style={{ marginBottom: '0.8rem', color: 'var(--primary)' }}>Education Details</h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {selectedStudent.university && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>University / College</div>
                            <div style={{ fontWeight: 500 }}>{selectedStudent.university}</div>
                          </div>
                        )}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          {selectedStudent.stream && (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stream</div>
                              <div>{selectedStudent.stream}</div>
                            </div>
                          )}
                          {selectedStudent.branch && (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Branch</div>
                              <div>{selectedStudent.branch}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStudent.squadId && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Hiring Squad</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-users" style={{ color: 'var(--secondary)' }}></i>
                        <span>{selectedStudent.squadId}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>Resume</h4>
                  {selectedResume ? (
                    <div className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>Resume Available</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            <i className="fa-solid fa-file-pdf"></i> {selectedResume.fileName} ({Math.round(selectedResume.fileSize / 1024)} KB)
                          </div>
                        </div>
                        <button className="btn btn-sm btn-primary" onClick={() => handleOpenStudentResume(selectedStudent.uid, selectedResume.fileName)}>
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

                <button className="btn btn-glass" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setProfileModalOpen(false)}>
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
