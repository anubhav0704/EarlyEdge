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

  // Job Details & Edit Modal states
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState('Full Time');
  const [editDescription, setEditDescription] = useState('');
  const [editRequirementsText, setEditRequirementsText] = useState('');
  const [updatingJob, setUpdatingJob] = useState(false);

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

  // Export applicants CSV handler
  const handleExportApplicantsCSV = () => {
    if (!applicants || applicants.length === 0) {
      return alert('No applicants available to export.');
    }

    const headers = [
      'Candidate Name',
      'Email Address',
      'Phone Number',
      'Status',
      'Applied Date',
      'University / College',
      'Stream',
      'Branch',
      'Verification Status',
      'Hiring Squad ID',
      'Resume Available',
      'Resume File Name'
    ];

    const rows = applicants.map(app => [
      `"${(app.studentName || '').replace(/"/g, '""')}"`,
      `"${(app.studentEmail || '').replace(/"/g, '""')}"`,
      `"${(app.phoneNumber || 'N/A').replace(/"/g, '""')}"`,
      `"${(app.status === 'accepted' || app.status === 'shortlisted') ? 'Accepted' : app.status === 'rejected' ? 'Removed / Rejected' : 'Pending'}"`,
      `"${new Date(app.appliedAt).toLocaleString()}"`,
      `"${(app.university || '').replace(/"/g, '""')}"`,
      `"${(app.stream || '').replace(/"/g, '""')}"`,
      `"${(app.branch || '').replace(/"/g, '""')}"`,
      `"${app.isVerified ? 'Verified' : 'Unverified'}"`,
      `"${(app.squadId || 'None').replace(/"/g, '""')}"`,
      `"${app.hasResume ? 'Yes' : 'No'}"`,
      `"${(app.resumeFileName || 'N/A').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const cleanTitle = (activeJobTitle || 'Job').replace(/[^a-zA-Z0-9_\-]/g, '_');
    link.setAttribute('href', url);
    link.setAttribute('download', `${cleanTitle}_Applicants_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Recruiter Accept / Remove applicant status changes
  const handleUpdateStatus = async (appId, status) => {
    const actionName = (status === 'accepted' || status === 'shortlisted') ? 'Accept' : 'Remove';
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

  // Job Details & Edit Modal Handlers
  const handleOpenJobDetails = (job) => {
    setSelectedJobDetails(job);
    setIsEditingJob(false);
  };

  const handleStartEditJob = () => {
    if (!selectedJobDetails) return;
    setEditTitle(selectedJobDetails.title || '');
    setEditCompany(selectedJobDetails.company || '');
    setEditLocation(selectedJobDetails.location || 'Remote');
    setEditType(selectedJobDetails.type || 'Full Time');
    setEditDescription(selectedJobDetails.description || '');

    let reqText = selectedJobDetails.rawRequirements || '';
    if (!reqText && selectedJobDetails.requirements) {
      reqText = selectedJobDetails.requirements.replace(/•\s*/g, '').replace(/<br\s*\/?>/gi, '\n');
    }
    setEditRequirementsText(reqText);
    setIsEditingJob(true);
  };

  const handleSaveEditJob = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return alert('Job title is required');
    setUpdatingJob(true);

    try {
      const res = await apiFetch(`/api/jobs/${selectedJobDetails.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle.trim(),
          company: editCompany.trim(),
          location: editLocation,
          type: editType,
          description: editDescription,
          requirementsText: editRequirementsText
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✅ Job details updated successfully!');

        let formattedReqs = '';
        if (editRequirementsText && editRequirementsText.trim()) {
          formattedReqs = editRequirementsText
            .split('\n')
            .map(l => `• ${l.replace(/^[•\-*\d.]+\s*/, '').trim()}`)
            .filter(Boolean)
            .join('<br>');
        }

        const updatedLocal = {
          ...selectedJobDetails,
          title: editTitle.trim(),
          company: editCompany.trim(),
          location: editLocation,
          type: editType,
          description: editDescription,
          requirements: formattedReqs,
          rawRequirements: editRequirementsText
        };

        setSelectedJobDetails(updatedLocal);
        setIsEditingJob(false);
        loadFeedData();
      } else {
        alert(`Update Failed: ${data.message}`);
      }
    } catch (err) {
      console.error('Update job error:', err);
      alert('Error updating job opportunity.');
    }
    setUpdatingJob(false);
  };

  // Helper component to render job description into points & structured sections
  const renderStructuredDescription = (text, jobType = 'Full Time') => {
    if (!text) return null;

    const lower = text.toLowerCase();
    const hasSections = lower.includes('role overview:') || lower.includes('key responsibilities:') || lower.includes('salary:');

    if (!hasSections) {
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length > 1) {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.2rem' }}>
            {lines.map((line, i) => {
              const cleanLine = line.replace(/^[•\-*\d.]+\s*/, '');
              const isHeader = line.endsWith(':');
              if (isHeader) {
                return (
                  <div key={i} style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.4rem', fontSize: '0.92rem' }}>
                    {cleanLine}
                  </div>
                );
              }
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem', lineHeight: '1.5' }}>
                  <i className="fa-solid fa-angle-right" style={{ color: 'var(--primary)', marginTop: '0.3rem', fontSize: '0.75rem' }}></i>
                  <span>{cleanLine}</span>
                </div>
              );
            })}
          </div>
        );
      }
      return <p style={{ marginBottom: '1.2rem', lineHeight: '1.6', fontSize: '0.93rem', color: 'var(--text-main)' }}>{text}</p>;
    }

    let overview = '';
    const salaryMatch = text.match(/(Salary|Stipend|Compensation):\s*([^\n\.]+)/i);
    let salary = '';
    let salaryLabel = (jobType === 'Internship') ? 'Stipend' : (jobType === 'Part Time') ? 'Compensation' : 'Salary';

    if (salaryMatch) {
      salaryLabel = salaryMatch[1];
      salary = salaryMatch[2].trim();
    } else {
      const idx = text.search(/Salary:/i);
      if (idx !== -1) {
        salary = text.slice(idx + 7).trim();
        const dotIdx = salary.indexOf('.');
        if (dotIdx !== -1) salary = salary.slice(0, dotIdx).trim();
      }
    }

    if (salary) {
      // Fix misformatted numbers like 12,000,00 -> convert to clean Indian Number format (12,00,000) or LPA
      salary = salary.replace(/₹?\s*(\d+),(\d{3}),(\d{2})$/, (m, g1, g2, g3) => {
        const totalDigits = (g1 + g2 + g3).replace(/^0+/, '');
        const val = parseInt(totalDigits, 10);
        if (!isNaN(val) && val >= 100000) {
          const inLakhs = (val / 100000).toFixed(val % 100000 === 0 ? 0 : 1);
          return `₹${inLakhs} LPA (${val.toLocaleString('en-IN')})`;
        }
        return isNaN(val) ? salary : `₹${val.toLocaleString('en-IN')}`;
      });

      // Collapse min and max salary if identical (e.g. ₹30,000 - ₹30,000)
      const parts = salary.split(/\s*[-–—]\s*/);
      if (parts.length === 2) {
        const p1 = parts[0].trim();
        const p2 = parts[1].trim();
        const num1 = p1.replace(/[^\d]/g, '');
        const num2 = p2.replace(/[^\d]/g, '');
        if (num1 && num2 && num1 === num2) {
          salary = p1;
        }
      }
    }

    const salaryIndex = text.search(/(Salary|Stipend|Compensation):/i);
    const roleIdx = text.search(/Role Overview:/i);
    const respIdx = text.search(/Key Responsibilities:/i);

    if (roleIdx !== -1) {
      const endIdx = respIdx !== -1 ? respIdx : (salaryIndex !== -1 ? salaryIndex : text.length);
      overview = text.slice(roleIdx + 14, endIdx).trim();
    }

    let responsibilities = [];
    if (respIdx !== -1) {
      const endIdx = salaryIndex !== -1 ? salaryIndex : text.length;
      const respRaw = text.slice(respIdx + 21, endIdx).trim();

      const knownKeys = ['Software Development:', 'Debugging & Maintenance:', 'Collaborate:', 'Testing:', 'Documentation:'];
      let foundMatches = [];

      knownKeys.forEach(key => {
        const kIdx = respRaw.indexOf(key);
        if (kIdx !== -1) {
          foundMatches.push({ title: key.replace(':', ''), idx: kIdx, keyLength: key.length });
        }
      });

      foundMatches.sort((a, b) => a.idx - b.idx);

      if (foundMatches.length > 0) {
        foundMatches.forEach((m, idx) => {
          const start = m.idx + m.keyLength;
          const nextStart = foundMatches[idx + 1] ? foundMatches[idx + 1].idx : respRaw.length;
          let content = respRaw.slice(start, nextStart).trim().replace(/\.$/, '');
          responsibilities.push({ title: m.title, content });
        });
      } else {
        const sentences = respRaw.split('.').map(s => s.trim()).filter(Boolean);
        sentences.forEach(s => responsibilities.push({ title: '', content: s }));
      }
    } else if (!overview) {
      overview = text;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {overview && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '0.9rem 1.1rem',
            borderRadius: '8px',
            borderLeft: '4px solid var(--primary)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <i className="fa-solid fa-compass" style={{ color: 'var(--primary)', fontSize: '0.95rem' }}></i>
              <strong style={{ color: 'var(--primary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Role Overview
              </strong>
            </div>
            <p style={{ margin: 0, lineHeight: '1.55', fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {overview}
            </p>
          </div>
        )}

        {responsibilities.length > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.18)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className="fa-solid fa-list-check" style={{ color: 'var(--primary)' }}></i>
              <span>Key Responsibilities:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {responsibilities.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.7rem',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div style={{
                    height: '20px', width: '20px', minWidth: '20px', borderRadius: '50%',
                    background: 'var(--primary-glow)', border: '1px solid var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.1rem'
                  }}>
                    <i className="fa-solid fa-check" style={{ color: 'var(--primary)', fontSize: '0.65rem' }}></i>
                  </div>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-main)' }}>
                    {item.title && <strong style={{ color: 'var(--primary)', marginRight: '0.35rem' }}>{item.title}:</strong>}
                    <span>{item.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {salary && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            padding: '0.6rem 1rem',
            borderRadius: '6px',
            color: '#4ade80',
            fontSize: '0.9rem',
            fontWeight: '500',
            width: 'fit-content'
          }}>
            <i className="fa-solid fa-wallet" style={{ fontSize: '1rem', color: '#22c55e' }}></i>
            <span><strong>{salaryLabel}:</strong> {salary}</span>
          </div>
        )}
      </div>
    );
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
              onOpenDetails={(j) => handleOpenJobDetails(j)}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem', paddingRight: '2rem' }}>
              <h3 style={{ margin: 0 }}>Applicants for "{activeJobTitle}"</h3>
              {applicants.length > 0 && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleExportApplicantsCSV}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem' }}
                >
                  <i className="fa-solid fa-file-csv"></i> Export Applicants CSV
                </button>
              )}
            </div>

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
                  const isAccepted = app.status === 'accepted' || app.status === 'shortlisted';
                  const isRejected = app.status === 'rejected';

                  return (
                    <div key={app._id} className="glass-card" style={{
                      padding: '1.2rem',
                      opacity: isRejected ? 0.6 : 1,
                      border: isAccepted ? '1px solid var(--success)' : isRejected ? '1px solid var(--error)' : '1px solid var(--border)',
                      background: isAccepted ? 'rgba(16, 185, 129, 0.03)' : 'var(--bg-card)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                            {app.studentName}
                            {app.isVerified && (
                              <span style={{ fontSize: '0.7rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid var(--primary)' }}>
                                <i className="fa-solid fa-check-circle"></i> Verified Talent
                              </span>
                            )}
                            {isAccepted && (
                              <span style={{ fontSize: '0.75rem', background: 'var(--success)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-check"></i> Accepted
                              </span>
                            )}
                            {isRejected && (
                              <span style={{ fontSize: '0.75rem', background: 'var(--error)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                <i className="fa-solid fa-xmark"></i> Removed
                              </span>
                            )}
                          </h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                            <i className="fa-solid fa-envelope" style={{ color: 'var(--primary)' }}></i> {app.studentEmail}
                            {app.phoneNumber && app.phoneNumber !== 'N/A' && ` • 📞 ${app.phoneNumber}`}
                            {app.university && app.university !== 'Not Specified' && ` • ${app.university}`}
                            {app.stream && app.stream !== 'N/A' && ` (${app.stream}${app.branch && app.branch !== 'N/A' ? ' - ' + app.branch : ''})`}
                          </p>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                            <i className="fa-solid fa-clock"></i> Applied {formatTimeAgo(app.appliedAt)}
                            {app.squadId && app.squadId !== 'None' && ` • Squad: ${app.squadId}`}
                            {app.resumeFileName && ` • File: ${app.resumeFileName}`}
                          </p>

                          {/* Accept/Remove actions */}
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            {!isAccepted && (
                              <button className="btn btn-sm btn-glass" style={{ borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleUpdateStatus(app._id, 'accepted')}>
                                <i className="fa-solid fa-check"></i> Accept
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
                    {selectedStudent.phoneNumber && (
                      <div style={{ gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Phone Number</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>📞 {selectedStudent.phoneNumber}</div>
                      </div>
                    )}
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

                  {/* Candidate Rank & TQ Badge */}
                  <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--primary)', marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>National Rank</div>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>🏆 #{selectedStudent.rank || 1}</strong>
                    </div>
                    <div style={{ width: '1px', height: '30px', background: 'var(--border)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Technical Quotient</div>
                      <strong style={{ fontSize: '1.2rem', color: 'var(--secondary)' }}>⚡ {selectedStudent.tqScore || 500} TQ</strong>
                    </div>
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

                  {/* AI Mock Test Evaluation & Submitted Code History */}
                  {selectedStudent.mockTests && selectedStudent.mockTests.length > 0 && (
                    <div style={{ marginTop: '1.5rem' }}>
                      <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="fa-solid fa-brain" style={{ color: 'var(--primary)' }}></i> AI Mock Test Evaluations ({selectedStudent.mockTests.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {selectedStudent.mockTests.map((t, idx) => (
                          <div key={t._id || idx} className="glass-card" style={{ padding: '1rem', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>{t.type || t.domain}</strong>
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--success)' }}>
                                Overall: {t.accuracy}%
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', marginBottom: '0.6rem' }}>
                              <div>Part A (MCQs): <strong>{t.partAScore || 0}%</strong></div>
                              <div>Part B (Subj): <strong>{t.partBScore || 0}%</strong></div>
                              <div>Part C (Code): <strong>{t.partCScore || 0}%</strong></div>
                            </div>

                            {t.aiEvaluation?.aiSummary && (
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5', margin: '0 0 0.6rem 0' }}>
                                💡 <strong>Sage AI Feedback:</strong> {t.aiEvaluation.aiSummary}
                              </p>
                            )}

                            {t.codeSubmitted && (
                              <details style={{ background: '#090d16', padding: '0.6rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                                <summary style={{ color: '#4ade80', cursor: 'pointer', fontWeight: 'bold' }}>
                                  View Part C Code Submission
                                </summary>
                                <pre style={{ color: '#4ade80', fontFamily: 'monospace', margin: '0.5rem 0 0 0', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                                  {t.codeSubmitted}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <button className="btn btn-glass" style={{ width: '100%', marginTop: '2rem' }} onClick={() => setProfileModalOpen(false)}>
                  Close Profile
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 🔍 FULL JOB DETAILS & EDIT MODAL                    */}
      {/* ==================================================== */}
      {selectedJobDetails && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            {/* Close Button */}
            <button
              onClick={() => { setSelectedJobDetails(null); setIsEditingJob(false); }}
              style={{
                position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>

            {isEditingJob ? (
              /* RECRUITER EDIT JOB FORM */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <i className="fa-solid fa-pen-to-square" style={{ color: 'var(--primary)', fontSize: '1.5rem' }}></i>
                  <h3 style={{ margin: 0 }}>Edit Job Opportunity</h3>
                </div>

                <form onSubmit={handleSaveEditJob}>
                  <div className="form-group">
                    <label className="form-label">Job Title *</label>
                    <input type="text" className="form-input" value={editTitle} onChange={e => setEditTitle(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input type="text" className="form-input" value={editCompany} onChange={e => setEditCompany(e.target.value)} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input type="text" className="form-input" value={editLocation} onChange={e => setEditLocation(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Job Type</label>
                      <select className="form-select" value={editType} onChange={e => setEditType(e.target.value)}>
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Job Description / Overview</label>
                    <textarea className="form-input" rows="5" value={editDescription} onChange={e => setEditDescription(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Requirements (one per line)</label>
                    <textarea className="form-input" rows="5" value={editRequirementsText} onChange={e => setEditRequirementsText(e.target.value)} />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={updatingJob}>
                      {updatingJob ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                    <button className="btn btn-glass" type="button" style={{ flex: 1 }} onClick={() => setIsEditingJob(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* FULL JOB DETAILS VIEW */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.3rem' }}>{selectedJobDetails.title}</h3>
                    <p style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', margin: 0 }}>
                      {selectedJobDetails.company}
                    </p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', fontSize: '0.85rem', padding: '0.3rem 0.8rem', borderRadius: '4px' }}>
                    {selectedJobDetails.type || 'Full Time'}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <span><i className="fa-solid fa-location-dot" style={{ color: 'var(--primary)' }}></i> {selectedJobDetails.location || 'Remote'}</span>
                  <span><i className="fa-solid fa-clock"></i> Posted {formatTimeAgo(selectedJobDetails.createdAt)}</span>
                  <span><i className="fa-solid fa-eye"></i> {selectedJobDetails.views || 0} views</span>
                </div>

                {/* Structured Description Points */}
                {renderStructuredDescription(selectedJobDetails.description, selectedJobDetails.type)}

                {/* Requirements */}
                {selectedJobDetails.requirements && (
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1rem' }}>
                      <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--secondary)' }}></i> Requirements & Eligibility:
                    </strong>
                    <div dangerouslySetInnerHTML={{ __html: selectedJobDetails.requirements }} style={{ paddingLeft: '0.5rem', lineHeight: '1.7', fontSize: '0.92rem' }}></div>
                  </div>
                )}

                {/* MODAL ACTION FOOTER */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
                  {user.role === 'student' ? (
                    appliedJobIds.includes(selectedJobDetails.id) ? (
                      <button className="btn btn-glass" style={{ width: '100%', cursor: 'not-allowed', opacity: 0.8 }} disabled>
                        <i className="fa-solid fa-check" style={{ color: 'var(--success)' }}></i> Already Applied
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                        onClick={() => {
                          handleApply(selectedJobDetails.id, selectedJobDetails.title, selectedJobDetails.company);
                          setSelectedJobDetails(null);
                        }}
                      >
                        Apply Now <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    )
                  ) : (
                    user.uid === selectedJobDetails.recruiterId && (
                      <>
                        <button
                          className="btn btn-primary"
                          style={{ flex: 1 }}
                          onClick={() => {
                            handleOpenApplicants(selectedJobDetails.id, selectedJobDetails.title);
                            setSelectedJobDetails(null);
                          }}
                        >
                          <i className="fa-solid fa-users"></i> View Applicants
                        </button>
                        <button
                          className="btn btn-glass"
                          style={{ flex: 1, borderColor: 'var(--primary)', color: 'var(--primary)' }}
                          onClick={handleStartEditJob}
                        >
                          <i className="fa-solid fa-pen-to-square"></i> Edit Job
                        </button>
                        <button
                          className="btn btn-error"
                          style={{ padding: '0.6rem 1.2rem' }}
                          onClick={() => {
                            handleDeleteJob(selectedJobDetails.id, selectedJobDetails.title);
                            setSelectedJobDetails(null);
                          }}
                        >
                          <i className="fa-solid fa-trash"></i> Delete
                        </button>
                      </>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
