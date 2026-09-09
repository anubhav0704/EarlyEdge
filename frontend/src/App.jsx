import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext.jsx';
import './App.css';

// Component Imports
import Sidebar from './components/Sidebar.jsx';

// Views Imports (We will write these components next!)
import Feed from './views/Feed.jsx';
import SquadMarket from './views/SquadMarket.jsx';
import MockTests from './views/MockTests.jsx';
import AIInterview from './views/AIInterview.jsx';
import Results from './views/Results.jsx';
import Profile from './views/Profile.jsx';
import PostJob from './views/PostJob.jsx';
import RecruiterAnalytics from './views/RecruiterAnalytics.jsx';
import AICareerCoach from './views/AICareerCoach.jsx';
import Landing from './views/Landing.jsx';

export default function App() {
  const { user, loading, login, signup, loginWithGoogle, logout, forgotPassword, resetPassword } = useContext(AuthContext);
  const [currentView, setCurrentView] = useState(sessionStorage.getItem('currentView') || 'feed');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAuthPortal, setShowAuthPortal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(localStorage.getItem('sidebarCollapsed') === 'true');

  // Sync sidebar collapse preference
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed);
  }, [sidebarCollapsed]);

  // Authenticate state helpers
  const [isLoginView, setIsLoginView] = useState(true); // Login vs Signup toggle
  const [authRole, setAuthRole] = useState(null); // 'student' | 'recruiter' for forms
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Sign up states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regUni, setRegUni] = useState('');
  const [regStream, setRegStream] = useState('');
  const [regBranch, setRegBranch] = useState('');

  // Forgot / Reset Password states
  const [isForgotView, setIsForgotView] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Request Code, 2: Reset Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetStatus, setResetStatus] = useState({ type: null, message: '' });
  const [demoCode, setDemoCode] = useState('');

  // Init themes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync views in session storage
  const handleSwitchView = (viewId) => {
    setCurrentView(viewId);
    sessionStorage.setItem('currentView', viewId);
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPass) return alert('Please enter credentials');
    
    const result = await login(loginEmail, loginPass);
    if (!result.success) {
      alert(`Login Failed: ${result.message}`);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPass) return alert('Please fill all fields');
    
    const signupData = {
      name: regName,
      email: regEmail,
      password: regPass,
      phoneNumber: regPhone,
      role: authRole,
      company: authRole === 'recruiter' ? regCompany : '',
      university: authRole === 'student' ? regUni : '',
      stream: authRole === 'student' ? regStream : '',
      branch: authRole === 'student' ? regBranch : ''
    };

    if (authRole === 'student' && (!regUni || !regStream || !regBranch)) {
      return alert('Please fill in your education details');
    }

    const result = await signup(signupData);
    if (result.success) {
      alert('Account created successfully!');
    } else {
      alert(`Sign up Failed: ${result.message}`);
    }
  };

  const handleGoogleAuthSubmit = async () => {
    const defaultEmail = authRole === 'student' ? 'alex.student@gmail.com' : 'hr@techcorp.com';
    const googleEmail = prompt('Enter your Google Account email:', defaultEmail);
    if (!googleEmail) return;

    const result = await loginWithGoogle({
      email: googleEmail,
      name: googleEmail.split('@')[0].toUpperCase(),
      role: authRole || 'student',
      googleId: `google_${Date.now()}`,
      phoneNumber: regPhone || ''
    });

    if (result.success) {
      alert(`Successfully signed in with Google as ${googleEmail}!`);
    } else {
      alert(`Google Auth Failed: ${result.message}`);
    }
  };

  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return setResetStatus({ type: 'error', message: 'Please enter your email address' });

    setResetStatus({ type: null, message: '' });
    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      setForgotStep(2);
      setDemoCode(result.resetCode || '');
      setResetStatus({
        type: 'success',
        message: 'Authorization reset code generated!'
      });
    } else {
      setResetStatus({ type: 'error', message: result.message || 'Failed to generate code' });
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetCodeInput || !newPass || !confirmPass) {
      return setResetStatus({ type: 'error', message: 'Please complete all required fields' });
    }

    if (newPass !== confirmPass) {
      return setResetStatus({ type: 'error', message: 'Passwords do not match' });
    }

    if (newPass.length < 6) {
      return setResetStatus({ type: 'error', message: 'Password must be at least 6 characters long' });
    }

    setResetStatus({ type: null, message: '' });
    const result = await resetPassword(forgotEmail, resetCodeInput, newPass);

    if (result.success) {
      alert('Password reset successful! You can now log in with your new password.');
      setLoginEmail(forgotEmail);
      setIsForgotView(false);
      setIsLoginView(true);
      setForgotStep(1);
      setResetCodeInput('');
      setNewPass('');
      setConfirmPass('');
      setDemoCode('');
      setResetStatus({ type: null, message: '' });
    } else {
      setResetStatus({ type: 'error', message: result.message || 'Failed to reset password' });
    }
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'var(--bg-dark)', zIndex: 9999,
        display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}></i>
          <p style={{ fontFamily: 'var(--font-body)', color: 'var(--text-main)' }}>Loading EarlyEdge Dashboard...</p>
        </div>
      </div>
    );
  }

  // RENDER AUTH LOGIN / SIGNUP PANEL
  if (!user) {
    if (!showAuthPortal) {
      return (
        <Landing
          onEnterPortal={() => setShowAuthPortal(true)}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
      );
    }

    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100vh', background: 'var(--login-bg)', padding: '1rem', position: 'relative'
      }}>
        {/* Brand Return Link */}
        <div
          style={{
            position: 'absolute',
            top: '2rem',
            left: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            cursor: 'pointer'
          }}
          onClick={() => {
            setShowAuthPortal(false);
            setAuthRole(null);
            setIsLoginView(true);
            setIsForgotView(false);
          }}
        >
          <img src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="EarlyEdge Logo" style={{ height: '42px', objectFit: 'contain' }} />
        </div>

        <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
          <button className="btn btn-glass" onClick={toggleTheme} style={{ padding: '0.6rem' }}>
            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
          </button>
        </div>

        {/* ROLE SELECTION PHASE */}
        {!authRole ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', width: '100%', maxWidth: '900px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              <div className="glass-card nav-item" onClick={() => setAuthRole('student')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '2.5rem', border: '1px solid var(--border)' }}>
                <div style={{
                  height: '60px', width: '60px', background: 'var(--primary-glow)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                }}>
                  <i className="fa-solid fa-user-graduate" style={{ fontSize: '1.8rem', color: 'var(--primary)' }}></i>
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Student / Talent</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Log in to take skill tests, form squads, and unlock exclusive Time-Gated opportunities.</p>
              </div>

              <div className="glass-card nav-item" onClick={() => setAuthRole('recruiter')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '2.5rem', border: '1px solid var(--border)' }}>
                <div style={{
                  height: '60px', width: '60px', background: 'rgba(91, 137, 166, 0.1)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
                }}>
                  <i className="fa-solid fa-building-user" style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}></i>
                </div>
                <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Recruiter / Company</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>Log in to post job listings, review merit lists, and hire complete candidate squads.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setShowAuthPortal(false)}>
                <i className="fa-solid fa-house"></i> Back to Homepage
              </span>
            </div>
          </div>
        ) : isForgotView ? (
          /* FORGOT / RESET PASSWORD FORM */
          <div className="glass-card" style={{ maxWidth: '420px', width: '100%', borderTop: `4px solid ${authRole === 'student' ? 'var(--primary)' : 'var(--secondary)'}` }}>
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Password</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {forgotStep === 1
                ? 'Enter your account email to receive a 6-digit authorization reset code.'
                : 'Enter your 6-digit authorization reset code and new password.'}
            </p>

            {resetStatus.message && (
              <div style={{
                padding: '0.8rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem',
                background: resetStatus.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border: `1px solid ${resetStatus.type === 'error' ? '#ef4444' : '#22c55e'}`,
                color: resetStatus.type === 'error' ? '#f87171' : '#4ade80'
              }}>
                <i className={`fa-solid ${resetStatus.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`} style={{ marginRight: '0.5rem' }}></i>
                {resetStatus.message}
              </div>
            )}

            {forgotStep === 2 && demoCode && (
              <div style={{
                padding: '0.8rem', borderRadius: '6px', marginBottom: '1.2rem', fontSize: '0.85rem',
                background: 'var(--primary-glow)', border: '1px solid var(--primary)', textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Authorized Reset Code:</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '3px', color: 'var(--primary)', margin: '0.2rem 0' }}>
                  {demoCode}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Valid for 10 minutes</div>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder={authRole === 'student' ? 'student@university.edu' : 'hr@company.com'}
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem', background: authRole === 'recruiter' ? 'var(--secondary)' : 'var(--primary)', color: authRole === 'recruiter' ? 'white' : 'black' }}>
                  Get Authorization Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Authorization Reset Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="6-digit code (e.g. 123456)"
                    value={resetCodeInput}
                    onChange={e => setResetCodeInput(e.target.value)}
                    maxLength={6}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={newPass}
                    onChange={e => setNewPass(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem', background: authRole === 'recruiter' ? 'var(--secondary)' : 'var(--primary)', color: authRole === 'recruiter' ? 'white' : 'black' }}>
                  Confirm Reset Password
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setIsForgotView(false); setResetStatus({ type: null, message: '' }); }}>
                <i className="fa-solid fa-arrow-left"></i> Back to Log In
              </span>
            </div>
          </div>
        ) : (
          /* REGISTRATION / LOGIN FORMS */
          <div className="glass-card" style={{ maxWidth: '400px', width: '100%', borderTop: `4px solid ${authRole === 'student' ? 'var(--primary)' : 'var(--secondary)'}` }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {authRole === 'student' ? 'Student' : 'Recruiter'} {isLoginView ? 'Login' : 'Sign Up'}
            </h2>

            <form onSubmit={isLoginView ? handleLoginSubmit : handleSignupSubmit}>
              {!isLoginView && (
                <>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" placeholder="John Doe" value={regName} onChange={e => setRegName(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-input" placeholder="+91 98765 43210" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                  </div>

                  {authRole === 'student' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">University / College</label>
                        <input type="text" className="form-input" placeholder="e.g. IIT Bombay" value={regUni} onChange={e => setRegUni(e.target.value)} required />
                      </div>
                      <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                          <label className="form-label">Stream</label>
                          <input type="text" className="form-input" placeholder="e.g. B.Tech" value={regStream} onChange={e => setRegStream(e.target.value)} required />
                        </div>
                        <div>
                          <label className="form-label">Branch</label>
                          <input type="text" className="form-input" placeholder="e.g. CSE" value={regBranch} onChange={e => setRegBranch(e.target.value)} required />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Company Name</label>
                      <input type="text" className="form-input" placeholder="e.g. Swiggy" value={regCompany} onChange={e => setRegCompany(e.target.value)} required />
                    </div>
                  )}
                </>
              )}

              <div className="form-group">
                <label className="form-label">{authRole === 'student' ? 'College Email ID' : 'Work Email'}</label>
                <input type="email" className="form-input" placeholder={authRole === 'student' ? 'student@university.edu' : 'hr@company.com'} value={isLoginView ? loginEmail : regEmail} onChange={e => isLoginView ? setLoginEmail(e.target.value) : setRegEmail(e.target.value)} required />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                  {isLoginView && (
                    <span
                      style={{ fontSize: '0.8rem', color: authRole === 'recruiter' ? 'var(--secondary)' : 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => {
                        setIsForgotView(true);
                        setForgotStep(1);
                        setForgotEmail(loginEmail);
                        setResetStatus({ type: null, message: '' });
                      }}
                    >
                      Forgot password?
                    </span>
                  )}
                </div>
                <input type="password" className="form-input" placeholder="••••••••" value={isLoginView ? loginPass : regPass} onChange={e => isLoginView ? setLoginPass(e.target.value) : setRegPass(e.target.value)} required />
              </div>

              <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1rem', background: authRole === 'recruiter' ? 'var(--secondary)' : 'var(--primary)', color: 'white' }}>
                {isLoginView ? 'Log In' : 'Create Account'}
              </button>
            </form>

            {/* GOOGLE SIGN IN BUTTON */}
            <div style={{ margin: '1rem 0 0.5rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', margin: '0.8rem 0' }}>
                <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }}></div>
                <span style={{ padding: '0 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>OR</span>
                <div style={{ flex: 1, borderBottom: '1px solid var(--border)' }}></div>
              </div>

              <button
                type="button"
                className="btn btn-glass"
                onClick={handleGoogleAuthSubmit}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  padding: '0.65rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: 'var(--text-main)'
                }}
              >
                <i className="fa-brands fa-google" style={{ color: '#EA4335', fontSize: '1rem' }}></i>
                Continue with Google
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              {isLoginView ? (
                <p>New here? <span style={{ textDecoration: 'underline', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => setIsLoginView(false)}>Create an account</span></p>
              ) : (
                <p>Already have an account? <span style={{ textDecoration: 'underline', color: 'var(--text-main)', cursor: 'pointer' }} onClick={() => setIsLoginView(true)}>Log In</span></p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { setAuthRole(null); setIsLoginView(true); setIsForgotView(false); }}>
                <i className="fa-solid fa-arrow-left"></i> Switch Role
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RENDER AUTHENTICATED DASHBOARD SHELL
  return (
    <div className="app-layout">
      {/* MOBILE HEADER BAR OVERLAY */}
      <div id="mobile-overlay" style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40,
        display: mobileMenuOpen ? 'block' : 'none'
      }} onClick={() => setMobileMenuOpen(false)}></div>

      {/* DASHBOARD NAVIGATION SIDEBAR */}
      <Sidebar
        currentView={currentView}
        onSwitchView={handleSwitchView}
        onLogout={logout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        theme={theme}
      />

      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Main navigation header */}
        <header className="app-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>
              <i className="fa-solid fa-bars"></i>
            </button>
            <div>
              <h2>{currentView === 'landing' ? 'HOME' : currentView.toUpperCase().replace('_', ' ')}</h2>
              {currentView !== 'landing' && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Hiring Platform</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn btn-glass" onClick={toggleTheme} style={{ padding: '0.6rem' }}>
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user.role === 'student' && (
                <button
                  className="btn btn-glass"
                  style={{
                    background: user.isVerified ? 'var(--success)' : '',
                    color: user.isVerified ? 'var(--bg-dark)' : 'var(--text-main)',
                    borderColor: user.isVerified ? 'var(--success)' : 'var(--border)'
                  }}
                  onClick={() => user.isVerified ? null : handleSwitchView('tests')}
                  disabled={user.isVerified}
                >
                  <i className={user.isVerified ? "fa-solid fa-check-circle" : "fa-solid fa-circle"}></i>
                  {user.isVerified ? 'Verified' : 'Get Verified'}
                </button>
              )}

              <div style={{ textAlign: 'right', paddingRight: '10px' }} className="desktop-only">
                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.role.toUpperCase()}</div>
              </div>

              {/* User profile avatar preview */}
              <div
                onClick={() => handleSwitchView('profile')}
                style={{
                  width: '35px', height: '35px', background: 'var(--secondary)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                  cursor: 'pointer', overflow: 'hidden', objectFit: 'cover', border: '2px solid var(--border)'
                }}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* View switchboard */}
        {currentView === 'landing' && <Landing onEnterPortal={() => handleSwitchView('feed')} onToggleTheme={toggleTheme} theme={theme} isAuthenticated={true} />}
        {currentView === 'feed' && <Feed onSwitchView={handleSwitchView} />}
        {currentView === 'squad' && <SquadMarket />}
        {currentView === 'tests' && <MockTests />}
        {currentView === 'interviews' && <AIInterview />}
        {currentView === 'results' && <Results onSwitchView={handleSwitchView} />}
        {currentView === 'profile' && <Profile />}
        {currentView === 'recruiter' && <PostJob onSwitchView={handleSwitchView} />}
        {currentView === 'analytics' && <RecruiterAnalytics onSwitchView={handleSwitchView} />}
        {currentView === 'coach' && <AICareerCoach onSwitchView={handleSwitchView} />}
      </main>
    </div>
  );
}
