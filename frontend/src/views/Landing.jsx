import React from 'react';

export default function Landing({ onEnterPortal, onToggleTheme, theme, isAuthenticated }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-dark)',
      color: 'var(--text-main)',
      transition: 'background-color 0.3s, color 0.3s',
      fontFamily: 'var(--font-body)',
      paddingBottom: '4rem'
    }}>
      {/* HEADER NAVBAR */}
      {!isAuthenticated && (
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 5%',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer' }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div style={{
              height: '40px',
              width: '40px',
              background: 'var(--primary-glow)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--primary)'
            }}>
              <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--primary)', fontSize: '1.2rem' }}></i>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, fontFamily: 'var(--font-brand)' }}>
              EarlyEdge
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn btn-glass" onClick={onToggleTheme} style={{ padding: '0.6rem' }}>
              <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
            <button className="btn btn-primary" onClick={onEnterPortal}>
              Enter Portal <i className="fa-solid fa-right-to-bracket" style={{ marginLeft: '0.5rem' }}></i>
            </button>
          </div>
        </header>
      )}

      {/* HERO SECTION */}
      <section style={{
        padding: '5rem 5% 4rem',
        textAlign: 'center',
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        <span style={{
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontSize: '0.85rem',
          color: 'var(--primary)',
          fontWeight: 'bold',
          display: 'block',
          marginBottom: '1rem'
        }}>
          Merit-First Career & Talent Orchestration
        </span>
        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          fontFamily: 'var(--font-brand)',
          lineHeight: '1.2'
        }}>
          The Ultimate Ecosystem for Emerging Developers
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1.2rem',
          lineHeight: '1.7',
          marginBottom: '2.5rem'
        }}>
          Prove your tech capability through live verification tests, practice vocal interviews with our speech-synthesis AI coach, organize into collaborative hiring squads, and unlock exclusive time-locked postings.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem' }} onClick={onEnterPortal}>
            {isAuthenticated ? 'Go to Dashboard' : 'Enter Portal Now'} <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i>
          </button>
          <a href="#features" className="btn btn-glass" style={{ padding: '0.8rem 2.5rem', fontSize: '1.1rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Explore Features
          </a>
        </div>
      </section>

      {/* CORE STATS OVERVIEW */}
      <section style={{
        padding: '2rem 5%',
        maxWidth: '1100px',
        margin: '0 auto 4rem'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '0.5rem' }}>100%</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Merit-First Process</div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Real-Time</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Vocal AI Interviewing</div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color: 'var(--success)', marginBottom: '0.5rem' }}>Active</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Squad Market Matching</div>
          </div>
        </div>
      </section>

      {/* DETAILED PORTAL DESCRIPTION & FEATURES */}
      <section id="features" style={{
        padding: '4rem 5%',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '2.2rem',
          marginBottom: '3rem',
          fontFamily: 'var(--font-brand)'
        }}>
          Ecosystem Capabilities
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem'
        }}>
          {/* Feature 1 */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            borderLeft: '4px solid var(--primary)',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'var(--primary-glow)',
                padding: '0.8rem',
                borderRadius: '6px',
                color: 'var(--primary)'
              }}>
                <i className="fa-solid fa-microphone-lines" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontFamily: 'var(--font-brand)' }}>Vocal AI Technical Coach</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Practice out-loud technical responses. Our vocal AI guide dynamically dictates questions using speech synthesis and parses your spoken responses. It compiles detailed technical reports and analytics instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            borderLeft: '4px solid var(--secondary)',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(91, 137, 166, 0.1)',
                padding: '0.8rem',
                borderRadius: '6px',
                color: 'var(--secondary)'
              }}>
                <i className="fa-solid fa-users" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontFamily: 'var(--font-brand)' }}>Collaborative Hiring Squads</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Form active project squads with fellow students. Leverage Socket.io live chat rooms to synchronize codebases, align on tech stacks, and showcase complete high-functioning engineering teams directly to companies.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            borderLeft: '4px solid var(--success)',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'var(--primary-glow)',
                padding: '0.8rem',
                borderRadius: '6px',
                color: 'var(--success)'
              }}>
                <i className="fa-solid fa-lock" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontFamily: 'var(--font-brand)' }}>Locked Time-Gated Postings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Promote fair hiring through merit unlocks. Top opportunities are locked for unverified applicants, encouraging developers to take verification tests, solve code challenges, and unlock early access to high-tier roles.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="glass-card" style={{
            padding: '2.5rem',
            borderLeft: '4px solid var(--warning)',
            background: 'var(--bg-card)',
            borderTop: '1px solid var(--border)',
            borderRight: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{
                background: 'rgba(212, 163, 115, 0.1)',
                padding: '0.8rem',
                borderRadius: '6px',
                color: 'var(--warning)'
              }}>
                <i className="fa-solid fa-chart-line" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.8rem', fontFamily: 'var(--font-brand)' }}>Coach Sage & TQ Metric</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Monitor your Technical Quotient (TQ) out of 1000. Interact with Coach Sage, our custom AI career guide that maps out customized study paths, audits your educational verification statuses, and advises on code skills.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section style={{
        marginTop: '6rem',
        padding: '4rem 5%',
        textAlign: 'center',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)'
      }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem', fontFamily: 'var(--font-brand)' }}>
          Ready to showcase your talent?
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2rem', fontSize: '1.05rem' }}>
          Join the meritocracy. Build verified credibility, collaborate with peer developers, and get hired on your own technical merits.
        </p>
        <button className="btn btn-primary" style={{ padding: '0.8rem 3rem', fontSize: '1.1rem' }} onClick={onEnterPortal}>
          {isAuthenticated ? 'Go to Dashboard' : 'Get Started'} <i className="fa-solid fa-rocket" style={{ marginLeft: '0.5rem' }}></i>
        </button>
      </section>
    </div>
  );
}
