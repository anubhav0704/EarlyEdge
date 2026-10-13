import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateProfile, apiFetch } = useContext(AuthContext);

  // Profile forms
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [profileUni, setProfileUni] = useState(user?.university || '');
  const [profileStream, setProfileStream] = useState(user?.stream || '');
  const [profileBranch, setProfileBranch] = useState(user?.branch || '');
  const [profileCompany, setProfileCompany] = useState(user?.company || '');
  
  // Base64 user avatar
  const [avatarPreview, setAvatarPreview] = useState(user?.photoURL || null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Resume file states
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [atsAnalysis, setAtsAnalysis] = useState(null);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [atsModalOpen, setAtsModalOpen] = useState(false);
  
  // Candidate applications list
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Sync state values on load
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phoneNumber || '');
      setProfileUni(user.university || '');
      setProfileStream(user.stream || '');
      setProfileBranch(user.branch || '');
      setProfileCompany(user.company || '');
      setAvatarPreview(user.photoURL || null);
    }
  }, [user]);

  // Fetch resume metadata & candidate application logs
  const loadProfileData = async () => {
    if (user?.role !== 'student') return;

    setLoadingResume(true);
    setLoadingApps(true);

    try {
      // 1. Fetch resume details
      const resRes = await apiFetch('/api/assessments/resume');
      const resData = await resRes.json();
      if (resData.success) {
        setResume(resData.resume);
      }

      // 2. Fetch applications logs
      const appsRes = await apiFetch('/api/jobs/applications/me');
      const appsData = await appsRes.json();
      if (appsData.success) {
        setApplications(appsData.applications);
      }
    } catch (err) {
      console.error(err);
    }

    setLoadingResume(false);
    setLoadingApps(false);
  };

  useEffect(() => {
    loadProfileData();
  }, [user?.uid]);

  // Profile save controller
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) return alert('Name is required');
    setSavingProfile(true);

    const updateData = {
      name: profileName,
      phoneNumber: profilePhone,
      photoURL: avatarPreview,
      university: user.role === 'student' ? profileUni : '',
      stream: user.role === 'student' ? profileStream : '',
      branch: user.role === 'student' ? profileBranch : '',
      company: user.role === 'recruiter' ? profileCompany : ''
    };

    const result = await updateProfile(updateData);
    if (result.success) {
      alert('✓ Profile Updated Successfully!');
    } else {
      alert(`Update Failed: ${result.message}`);
    }
    setSavingProfile(false);
  };

  // Avatar upload handler
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      return alert('Image size too large! Max file size is 500KB.');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAvatarPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
  };

  // Password Update controller
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return alert('Please enter both password fields');
    if (newPassword.length < 6) return alert('New password must be at least 6 characters long.');
    setUpdatingPassword(true);

    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        alert('Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        alert(`Update Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Authentication check failed. Incorrect current password.');
    }
    setUpdatingPassword(false);
  };

  // Base64 PDF resume upload handler
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      return alert('Resume PDF size too large for this demo. Max size is 500KB.');
    }

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      return alert('Please upload a valid PDF file.');
    }

    setUploadingResume(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target.result;

        const res = await apiFetch('/api/assessments/resume', {
          method: 'POST',
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            resumeData: dataUrl
          })
        });

        const data = await res.json();
        if (data.success) {
          alert('Resume uploaded successfully!');
          setResume(data.resume);
          loadProfileData(); // reload
        } else {
          alert(`Upload Failed: ${data.message}`);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
    }
    setUploadingResume(false);
  };

  // Delete resume
  const handleDeleteResume = async () => {
    if (!confirm('Are you sure you want to permanently delete your resume?')) return;

    try {
      const res = await apiFetch('/api/assessments/resume', { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        alert('Resume deleted successfully.');
        setResume(null);
        loadProfileData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // View PDF resume in new iframe tab
  const handleViewResume = () => {
    if (!resume?.resumeData) return;

    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${resume.resumeData}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = `View Resume - ${resume.fileName}`;
    } else {
      alert('Please allow popups to view the resume PDF.');
    }
  };

  // AI ATS Resume Review Agent
  const handleAnalyzeResume = async () => {
    if (!resume) return;
    setAnalyzingResume(true);
    try {
      const res = await apiFetch('/api/ai/review-resume', {
        method: 'POST',
        body: JSON.stringify({
          // Send the actual PDF base64 so backend can extract real text
          resumeData: resume.resumeData || null,
          candidateInfo: {
            name: profileName || user.name,
            university: profileUni || user.university,
            stream: profileStream,
            branch: profileBranch,
            fileName: resume.fileName
          }
        })
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        setAtsAnalysis(data.analysis);
        setAtsModalOpen(true);
      } else {
        alert(data.error || 'Failed to review resume with AI.');
      }
    } catch (err) {
      console.error('Resume review error:', err);
      alert('Error connecting to Groq AI Resume Reviewer.');
    }
    setAnalyzingResume(false);
  };

  // Formats relative time logs
  const formatTimeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="panel active">
      <div className="glass-card" style={{ maxWidth: '650px', margin: '0 auto', padding: '2.5rem' }}>
        
        {/* Profile Avatar Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: '100px', height: '100px', background: 'var(--secondary)', borderRadius: '50%',
            margin: '0 auto 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden', position: 'relative',
            objectFit: 'cover', border: '3px solid var(--primary-glow)'
          }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profileName ? profileName.charAt(0).toUpperCase() : 'U'
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button className="btn btn-sm btn-glass" onClick={() => document.getElementById('profile-photo-upload').click()}>
              <i className="fa-solid fa-camera"></i> Change Photo
            </button>
            {avatarPreview && (
              <button className="btn btn-sm btn-error" onClick={handleRemoveAvatar}>
                <i className="fa-solid fa-trash"></i> Remove
              </button>
            )}
          </div>
          {profilePhone && (
            <div style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <i className="fa-solid fa-phone"></i> {profilePhone}
            </div>
          )}

          {user?.role === 'student' && (
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.4rem 0.9rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                🏆 National Rank: #{user?.rank || 1}
              </span>
              <span className="badge" style={{ background: 'rgba(249, 115, 22, 0.15)', color: 'var(--secondary)', border: '1px solid var(--secondary)', padding: '0.4rem 0.9rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                ⚡ TQ Score: {user?.tqScore || 500} Points
              </span>
            </div>
          )}
          <input
            type="file"
            id="profile-photo-upload"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarUpload}
          />
        </div>

        {/* PROFILE CREDENTIALS FORM */}
        <form onSubmit={handleSaveProfile}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input type="text" className="form-input" value={profileName} onChange={e => setProfileName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Registered Email</label>
            <input type="email" className="form-input" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" placeholder="+91 98765 43210" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} />
          </div>

          {user.role === 'student' ? (
            <>
              <div className="form-group">
                <label className="form-label">University / College</label>
                <input type="text" className="form-input" value={profileUni} onChange={e => setProfileUni(e.target.value)} />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Stream</label>
                  <input type="text" className="form-input" value={profileStream} onChange={e => setProfileStream(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Branch</label>
                  <input type="text" className="form-input" value={profileBranch} onChange={e => setProfileBranch(e.target.value)} />
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input type="text" className="form-input" value={profileCompany} onChange={e => setProfileCompany(e.target.value)} />
            </div>
          )}

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem' }} disabled={savingProfile}>
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* ==================================================== */}
        {/* 📋 STUDENT RESUME MANAGEMENT SECTION                 */}
        {/* ==================================================== */}
        {user.role === 'student' && (
          <div id="resume-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.2rem' }}>
              <i className="fa-solid fa-file-pdf" style={{ color: 'var(--primary)' }}></i> My Resume PDF
            </h4>

            <div style={{
              background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px',
              border: '1px solid var(--border)', marginBottom: '1.5rem'
            }}>
              {loadingResume ? (
                <p style={{ color: 'var(--text-muted)' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading resume...</p>
              ) : !resume ? (
                <p style={{ color: 'var(--text-muted)' }}>No resume uploaded yet. Recruiters require a resume PDF to shortlist applications.</p>
              ) : (
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{resume.fileName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Uploaded {new Date(resume.uploadedAt).toLocaleDateString()} • {Math.round(resume.fileSize / 1024)} KB
                  </div>
                </div>
              )}
            </div>

            <input
              type="file"
              id="resume-upload"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={handleResumeUpload}
            />

            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => document.getElementById('resume-upload').click()} disabled={uploadingResume}>
                <i className="fa-solid fa-upload"></i> {uploadingResume ? 'Uploading...' : 'Upload PDF'}
              </button>
              {resume && (
                <>
                  <button className="btn btn-glass" onClick={handleViewResume}>
                    <i className="fa-solid fa-eye"></i> View Resume
                  </button>
                  {/* Show ATS button only if analysis hasn't been done yet */}
                  {!atsAnalysis ? (
                    <button className="btn btn-glass" style={{ borderColor: '#14b8a6', color: '#14b8a6' }} onClick={handleAnalyzeResume} disabled={analyzingResume}>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> {analyzingResume ? 'Analyzing...' : 'AI ATS Review'}
                    </button>
                  ) : (
                    <button className="btn btn-glass" style={{ borderColor: '#14b8a6', color: '#14b8a6', opacity: 0.7 }} onClick={() => setAtsModalOpen(true)}>
                      <i className="fa-solid fa-chart-bar"></i> ATS Score: {atsAnalysis.atsScore}%
                    </button>
                  )}
                  <button className="btn btn-error" onClick={handleDeleteResume}>
                    <i className="fa-solid fa-trash"></i> Delete
                  </button>
                </>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.6rem' }}>Supported formats: PDF (Max size 500KB)</p>
          </div>
        )}

        {/* ==================================================== */}
        {/* 🔒 SECURITY PASSWORD CHANGE MANAGEMENT SECTION       */}
        {/* ==================================================== */}
        <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <h4 style={{ marginBottom: '1.2rem' }}>
            <i className="fa-solid fa-lock" style={{ color: 'var(--primary)' }}></i> Security & Password
          </h4>

          <form onSubmit={handleUpdatePassword}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Current Password</label>
              <input type="password" className="form-input" placeholder="••••••••" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.8rem' }}>New Password</label>
              <input type="password" className="form-input" placeholder="Min 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            </div>

            <button className="btn btn-glass" type="submit" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }} disabled={updatingPassword}>
              {updatingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* ==================================================== */}
        {/* 💼 CANDIDATE RECENT APPLICATION LOGS                */}
        {/* ==================================================== */}
        {user.role === 'student' && (
          <div id="applied-jobs-section" style={{ marginTop: '2.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <h4 style={{ marginBottom: '1.2rem' }}>
              <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary)' }}></i> Recent Job Applications
            </h4>

            {loadingApps ? (
              <div style={{ textAlign: 'center' }}><i className="fa-solid fa-spinner fa-spin"></i></div>
            ) : applications.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>No job applications submitted yet.</p>
            ) : (
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {applications.map(app => {
                  const isAccepted = app.status === 'accepted' || app.status === 'shortlisted';
                  const isRejected = app.status === 'rejected';

                  return (
                    <div key={app._id} className="history-item" style={{
                      borderColor: isAccepted ? 'var(--success)' : isRejected ? 'var(--error)' : 'var(--border)'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {app.company} • Applied {formatTimeAgo(app.appliedAt)}
                        </div>
                      </div>
                      <span className="badge" style={{
                        background: isAccepted ? 'var(--success)' : isRejected ? 'var(--error)' : 'rgba(255,255,255,0.05)',
                        color: isAccepted || isRejected ? 'white' : 'var(--text-muted)',
                        fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px'
                      }}>
                        {isAccepted ? 'ACCEPTED' : app.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* AI ATS REVIEW MODAL */}
      {atsModalOpen && atsAnalysis && (
        <div className="modal-backdrop active" onClick={() => setAtsModalOpen(false)} style={{ display: 'flex', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2.5rem', borderTop: '4px solid #14b8a6', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <i className="fa-solid fa-wand-magic-sparkles" style={{ color: '#14b8a6' }}></i>
                <span>Sage AI ATS Resume Analysis</span>
              </h3>
              <button className="btn btn-sm btn-glass" onClick={() => setAtsModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', background: 'rgba(20, 184, 166, 0.1)', padding: '1.2rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #14b8a6' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#14b8a6' }}>
                {atsAnalysis.atsScore}%
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem' }}>Overall ATS Compatibility</strong>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {atsAnalysis.summary}
                </p>
              </div>
            </div>

            {atsAnalysis.keyStrengths?.length > 0 && (
              <div style={{ marginBottom: '1.2rem' }}>
                <strong style={{ color: 'var(--success)', display: 'block', marginBottom: '0.4rem' }}>
                  <i className="fa-solid fa-circle-check"></i> Key Strengths
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {atsAnalysis.keyStrengths.map((s, idx) => <li key={idx}>{s}</li>)}
                </ul>
              </div>
            )}

            {atsAnalysis.areasToImprove?.length > 0 && (
              <div style={{ marginBottom: '1.2rem' }}>
                <strong style={{ color: 'var(--secondary)', display: 'block', marginBottom: '0.4rem' }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> Recommended Enhancements
                </strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-main)' }}>
                  {atsAnalysis.areasToImprove.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>
            )}

            {atsAnalysis.missingKeywords?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>
                  <i className="fa-solid fa-key"></i> Suggested Missing ATS Keywords
                </strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {atsAnalysis.missingKeywords.map((kw, idx) => (
                    <span key={idx} style={{ background: 'var(--primary-glow)', color: 'var(--primary)', border: '1px solid var(--primary)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-primary" onClick={() => setAtsModalOpen(false)}>Close Report</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
