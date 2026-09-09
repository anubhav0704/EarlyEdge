import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export default function Sidebar({ currentView, onSwitchView, onLogout, mobileOpen, onCloseMobile, collapsed, onToggleCollapse, theme }) {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const logoSrc = theme === 'light' ? '/logo-light.png' : '/logo-dark.png';

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`} id="app-sidebar">
      {/* Brand Heading & Minimizer Toggle Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: '2rem' }}>
        <span onClick={() => onSwitchView('landing')} className="sidebar-brand" style={{ cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center' }}>
          {collapsed ? (
            <img src={logoSrc} alt="EarlyEdge Logo" style={{ height: '26px', maxWidth: '30px', objectFit: 'contain' }} />
          ) : (
            <img src={logoSrc} alt="EarlyEdge Logo" style={{ height: '38px', maxHeight: '42px', objectFit: 'contain' }} />
          )}
        </span>

        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn desktop-only"
          title={collapsed ? "Expand Sidebar" : "Minimize Sidebar"}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
            borderRadius: '6px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginLeft: collapsed ? 0 : '0.5rem'
          }}
        >
          <i className={`fa-solid ${collapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
        </button>
      </div>

      {/* Sidebar navigation links */}
      <nav id="nav-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 70px)' }}>
        <button
          onClick={() => onSwitchView('feed')}
          className={`nav-item ${currentView === 'feed' ? 'active' : ''}`}
          title={collapsed ? "Jobs Feed" : ""}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <i className="fa-solid fa-bolt"></i> {!collapsed && <span>Jobs</span>}
        </button>

        {/* Student actions */}
        {user.role === 'student' && (
          <>
            <button
              onClick={() => onSwitchView('squad')}
              className={`nav-item ${currentView === 'squad' ? 'active' : ''}`}
              title={collapsed ? "Hiring Squads" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-users"></i> {!collapsed && <span>Squads</span>}
            </button>

            <button
              onClick={() => onSwitchView('tests')}
              className={`nav-item ${currentView === 'tests' ? 'active' : ''}`}
              title={collapsed ? "Skill Tests" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-code"></i> {!collapsed && <span>Skill Tests</span>}
            </button>

            <button
              onClick={() => onSwitchView('interviews')}
              className={`nav-item ${currentView === 'interviews' ? 'active' : ''}`}
              title={collapsed ? "Mock Interviews" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-video"></i> {!collapsed && <span>Mock Interview</span>}
            </button>

            <button
              onClick={() => onSwitchView('results')}
              className={`nav-item ${currentView === 'results' ? 'active' : ''}`}
              title={collapsed ? "My Progress" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-chart-bar"></i> {!collapsed && <span>My Progress</span>}
            </button>

            <button
              onClick={() => onSwitchView('coach')}
              className={`nav-item ${currentView === 'coach' ? 'active' : ''}`}
              title={collapsed ? "Career Guide" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-compass"></i> {!collapsed && <span>Career Guide</span>}
            </button>
          </>
        )}

        {/* RECRUITER VIEWS ONLY */}
        {user.role === 'recruiter' && (
          <>
            <button
              onClick={() => onSwitchView('recruiter')}
              className={`nav-item ${currentView === 'recruiter' ? 'active' : ''}`}
              title={collapsed ? "Post a Job" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-briefcase"></i> {!collapsed && <span>Post Job</span>}
            </button>

            <button
              onClick={() => onSwitchView('analytics')}
              className={`nav-item ${currentView === 'analytics' ? 'active' : ''}`}
              title={collapsed ? "Platform Analytics" : ""}
              style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
            >
              <i className="fa-solid fa-chart-pie"></i> {!collapsed && <span>Analytics</span>}
            </button>
          </>
        )}

        {/* PROFILE LINK */}
        <button
          onClick={() => onSwitchView('profile')}
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
          title={collapsed ? "My Profile" : ""}
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <i className="fa-solid fa-user-circle"></i> {!collapsed && <span>My Profile</span>}
        </button>

        {/* LOGOUT */}
        <button
          onClick={onLogout}
          className="nav-item"
          title={collapsed ? "Log Out" : ""}
          style={{ color: 'var(--error)', marginTop: 'auto', border: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <i className="fa-solid fa-right-from-bracket"></i> {!collapsed && <span>Log Out</span>}
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
