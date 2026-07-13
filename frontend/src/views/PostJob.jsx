import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function PostJob({ onSwitchView }) {
  const { user, apiFetch } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user?.company || '');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full Time');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');

  const [posting, setPosting] = useState(false);

  // REST POST job submission
  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!title.trim()) return alert('Job title is required');
    if (!requirements.trim()) return alert('Requirements list is required');
    setPosting(true);

    const salaryString = salaryMin && salaryMax ? `₹${salaryMin} - ₹${salaryMax}` : '';
    const jobDescription = salaryString ? `${description}\n\nSalary: ${salaryString}` : description;

    try {
      const res = await apiFetch('/api/jobs', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim() || user.company || 'Not Specified',
          location: location || 'Remote',
          type,
          requirementsText: requirements.trim(),
          description: jobDescription || 'New opportunity posted.'
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('✓ Job Opportunity Posted Successfully!');
        
        // Reset form
        setTitle('');
        setCompany(user?.company || '');
        setLocation('');
        setType('Full Time');
        setSalaryMin('');
        setSalaryMax('');
        setDescription('');
        setRequirements('');

        onSwitchView('feed'); // Go back to feed
      } else {
        alert(`Failed to post: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error posting job opportunity.');
    }
    setPosting(false);
  };

  return (
    <div className="panel active">
      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', padding: '2.5rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', background: 'var(--primary-glow)', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary)', fontSize: '1.8rem' }}></i>
          </div>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>Post a Job</h3>
            <p style={{ color: 'var(--text-muted)' }}>Create job opportunities for verified talent</p>
          </div>
        </div>

        {/* POST FORM */}
        <form onSubmit={handlePostJob}>
          <div className="form-group">
            <label className="form-label">Job Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Senior Frontend Developer"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Google, Stripe"
              value={company}
              onChange={e => setCompany(e.target.value)}
            />
          </div>

          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Location</label>
              <select className="form-select" value={location} onChange={e => setLocation(e.target.value)}>
                <option value="">Select location</option>
                <option value="Remote">Remote</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Job Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Salary Range (Monthly / Optional)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input type="text" className="form-input" placeholder="Min (e.g. ₹50,000)" value={salaryMin} onChange={e => setSalaryMin(e.target.value)} />
              <input type="text" className="form-input" placeholder="Max (e.g. ₹1,20,000)" value={salaryMax} onChange={e => setSalaryMax(e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea
              className="form-input"
              rows="4"
              placeholder="Describe the role, candidate responsibilities, and team architecture..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Requirements * (one per line)</label>
            <textarea
              className="form-input"
              rows="6"
              placeholder="Example requirements (one per line):&#10;• 3+ years experience with React.js&#10;• Strong understanding of Javascript ES6+&#10;• Knowledge of modern web balancers"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
              required
            />
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              We will format each line automatically with clean vector bullet marks.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
            <button className="btn btn-primary" type="submit" style={{ flex: 1, padding: '1rem' }} disabled={posting}>
              {posting ? 'Posting...' : 'Post Job Opportunity'}
            </button>
            <button className="btn btn-glass" type="button" style={{ flex: 1 }} onClick={() => onSwitchView('feed')}>
              Cancel
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
