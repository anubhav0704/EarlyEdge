import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Sidebar({ currentView, onSwitchView, onLogout, mobileOpen, onCloseMobile }) {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`} id="app-sidebar">
      {/* Brand Heading */}
      <span onClick={() => onSwitchView('landing')} className="sidebar-brand" style={{ cursor: 'pointer' }}>
        <i className="fa-solid fa-layer-group"></i> Early<span style={{ color: 'var(--primary)' }}>Edge</span>
      </span>

      {/* Sidebar navigation links */}
      <nav id="nav-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 80px)' }}>
        <button
          onClick={() => onSwitchView('feed')}
          className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-bolt"></i> Jobs
        </button>

        {/* Student actions */}
        {user.role === 'student' && (
          <>
            <button
              onClick={() => onSwitchView('squad')}
              className={`nav-item ${currentView === 'squad' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-users"></i> Squads
            </button>

            <button
              onClick={() => onSwitchView('tests')}
              className={`nav-item ${currentView === 'tests' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-code"></i> Skill Tests
            </button>

            <button
              onClick={() => onSwitchView('interviews')}
              className={`nav-item ${currentView === 'interviews' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-video"></i> Mock Interview
            </button>

            <button
              onClick={() => onSwitchView('results')}
              className={`nav-item ${currentView === 'results' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-chart-bar"></i> My Progress
            </button>

            <button
              onClick={() => onSwitchView('coach')}
              className={`nav-item ${currentView === 'coach' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-compass"></i> Career Guide
            </button>
          </>
        )}

        {/* RECRUITER VIEWS ONLY */}
        {user.role === 'recruiter' && (
          <>
            <button
              onClick={() => onSwitchView('recruiter')}
              className={`nav-item ${currentView === 'recruiter' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-briefcase"></i> Post Job
            </button>

            <button
              onClick={() => onSwitchView('analytics')}
              className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
            >
              <i className="fa-solid fa-chart-pie"></i> Analytics
            </button>
          </>
        )}

        {/* PROFILE LINK */}
        <button
          onClick={() => onSwitchView('profile')}
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
        >
          <i className="fa-solid fa-user-circle"></i> My Profile
        </button>

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className="nav-item"
          style={{ color: 'var(--error)', marginTop: 'auto', border: 'none' }}
        >
          <i className="fa-solid fa-right-from-bracket"></i> Log Out
        </button>

        {mobileOpen && (
          <button
            className="btn btn-glass"
            style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={onCloseMobile}
          >
            Close Menu
          </button>
        )}
      </nav>
    </aside>
  );
}
