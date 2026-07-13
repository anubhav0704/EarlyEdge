import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { io } from 'socket.io-client';

export default function SquadMarket() {
  const { user, apiFetch, updateProfile } = useContext(AuthContext);
  
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Real-time toast notifications state
  const [toast, setToast] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [creatingSquad, setCreatingSquad] = useState(false);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeSquad, setActiveSquad] = useState(null);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);
  
  const socketRef = useRef(null);

  // Fetch all squads from server
  const loadSquads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiFetch('/api/squads');
      const data = await res.json();
      if (data.success) {
        setSquads(data.squads);
      }
    } catch (err) {
      console.error('Error loading squads:', err);
    }
    if (!silent) setLoading(false);
  };

  // Configure Socket.io connections for real-time syncing
  useEffect(() => {
    // Connect to server
    const serverUrl = window.location.origin === 'http://localhost:5173' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(serverUrl, { withCredentials: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to live squad WebSockets channel');
    });

    // Global synchronizer when any squad gets altered
    socket.on('squad_global_update', ({ squadId, type, data }) => {
      console.log(`🔁 Real-time Global Sync [${type}]:`, data);
      loadSquads(true); // silent reload

      // Update active squad details modal inline if open
      if (detailsModalOpen && activeSquad) {
        if (type === 'deleted' && activeSquad.id === squadId) {
          setDetailsModalOpen(false);
          alert(`The squad "${activeSquad.name}" has been deleted by the leader.`);
        } else if (activeSquad.id === squadId || data.id === squadId) {
          // REST reload to grab fresh values
          refreshActiveSquad(squadId);
        }
      }
    });

    // Receive live user notifications
    socket.on('squad_live_toast', ({ title, message, type }) => {
      setToast({ title, message, type });
      setTimeout(() => setToast(null), 5000);
    });

    loadSquads();

    return () => {
      socket.disconnect();
    };
  }, [detailsModalOpen, activeSquad]);

  // Sync squad WebSocket room when candidate is inside a squad
  useEffect(() => {
    if (socketRef.current && user?.squadId) {
      socketRef.current.emit('join_squad_room', user.squadId);

      // Listen for chat messages inside the room
      socketRef.current.on('receive_squad_message', (msg) => {
        setChatMessages(prev => [...prev, msg]);
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      });
    }
    return () => {
      if (socketRef.current && user?.squadId) {
        socketRef.current.emit('leave_squad_room', user.squadId);
        socketRef.current.off('receive_squad_message');
      }
    };
  }, [user?.squadId]);

  // Handle sending squad messages
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (socketRef.current && user.squadId) {
      socketRef.current.emit('send_squad_message', {
        squadName: user.squadId,
        senderName: user.name,
        senderEmail: user.email,
        text: chatInput.trim()
      });
      setChatInput('');
    }
  };

  // Reloads a single squad's metadata
  const refreshActiveSquad = async (squadId) => {
    try {
      const res = await apiFetch('/api/squads');
      const data = await res.json();
      if (data.success) {
        const found = data.squads.find(s => s._id === squadId);
        if (found) {
          setActiveSquad({
            id: found._id,
            name: found.name,
            creatorId: found.creatorId,
            creatorName: found.creatorName,
            members: found.members,
            memberCount: found.memberCount
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Create Squad Handler
  const handleCreateSquad = async (e) => {
    e.preventDefault();
    if (!newSquadName.trim()) return alert('Squad name is required');
    setCreatingSquad(true);

    try {
      const res = await apiFetch('/api/squads', {
        method: 'POST',
        body: JSON.stringify({ name: newSquadName })
      });
      const data = await res.json();

      if (data.success) {
        // Sync local auth user squadId state
        await updateProfile({ squadId: data.squad.name });
        
        alert(`✅ Squad "${data.squad.name}" created successfully!\n\nYou are now the squad leader.`);
        setCreateModalOpen(false);
        setNewSquadName('');
        loadSquads();
      } else {
        alert(`Create Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
    setCreatingSquad(false);
  };

  // Join Squad Handler
  const handleJoinSquad = async (squadId, squadName) => {
    if (!confirm(`Join the squad "${squadName}"?`)) return;

    try {
      const res = await apiFetch(`/api/squads/${squadId}/join`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        await updateProfile({ squadId: squadName });
        
        // Notify socket channel
        if (socketRef.current) {
          socketRef.current.emit('squad_event_notification', {
            squadName,
            title: '👋 New Member Joined',
            message: `${user.name} joined ${squadName}`,
            type: 'success'
          });
        }

        alert(`Successfully joined "${squadName}"!`);
        loadSquads();
      } else {
        alert(`Join Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Leave Squad Handler
  const handleLeaveSquad = async (squadId, squadName) => {
    if (!confirm(`Are you sure you want to leave the squad "${squadName}"?`)) return;

    try {
      const res = await apiFetch(`/api/squads/${squadId}/leave`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        await updateProfile({ squadId: null });

        // Notify socket channel
        if (socketRef.current) {
          socketRef.current.emit('squad_event_notification', {
            squadName,
            title: '👋 Member Left',
            message: `${user.name} left ${squadName}`,
            type: 'warning'
          });
        }

        alert(`You have left the squad "${squadName}"`);
        setDetailsModalOpen(false);
        loadSquads();
      } else {
        alert(`Leave Failed: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: Promote Member
  const handlePromoteMember = async (squadId, memberId, memberName, squadName) => {
    if (!confirm(`Promote "${memberName}" to squad leader? You will become a regular member.`)) return;

    try {
      const res = await apiFetch(`/api/squads/${squadId}/promote`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
      });
      const data = await res.json();

      if (data.success) {
        alert(`${memberName} has been promoted to Squad Leader!`);
        refreshActiveSquad(squadId);
      } else {
        alert(`Failed to promote: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: Kick Member
  const handleRemoveMember = async (squadId, memberId, memberName, squadName) => {
    if (!confirm(`Remove "${memberName}" from the squad?`)) return;

    try {
      const res = await apiFetch(`/api/squads/${squadId}/remove`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
      });
      const data = await res.json();

      if (data.success) {
        alert(`${memberName} has been removed from the squad.`);
        refreshActiveSquad(squadId);
      } else {
        alert(`Failed to remove: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: Delete Squad
  const handleDeleteSquad = async (squadId, squadName) => {
    if (!confirm(`Are you sure you want to permanently delete "${squadName}"?\n\nThis cannot be undone.`)) return;

    try {
      const res = await apiFetch(`/api/squads/${squadId}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        await updateProfile({ squadId: null });
        alert(`✅ Squad "${squadName}" deleted successfully.`);
        setDetailsModalOpen(false);
        loadSquads();
      } else {
        alert(`Failed to delete: ${data.message}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Details Modal
  const handleOpenDetails = (squad) => {
    setActiveSquad({
      id: squad._id,
      name: squad.name,
      creatorId: squad.creatorId,
      creatorName: squad.creatorName,
      members: squad.members,
      memberCount: squad.memberCount
    });
    setDetailsModalOpen(true);
  };

  const currentSquad = squads.find(s => s.name === user.squadId);
  const maxSpots = 5;

  return (
    <div className="panel active">
      {/* Real-time sync notifications toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
          animation: 'slideInRight 0.3s ease', maxWidth: '350px'
        }}>
          <div className="glass-card" style={{
            padding: '1rem', borderLeft: '4px solid var(--primary)',
            background: 'var(--primary-glow)', marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '40px', height: '40px', background: 'var(--primary-glow)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fa-solid fa-users" style={{ color: 'var(--primary)' }}></i>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{toast.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{toast.message}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Squad Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h3>Squad Market</h3>
        {!user.squadId && (
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> Create Squad
          </button>
        )}
      </div>

      {/* Candidate's active squad display */}
      {user.squadId && currentSquad && (
        <div className="glass-card" style={{ borderColor: 'var(--success)', marginBottom: '2.5rem', padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ color: 'var(--success)', marginBottom: '0.25rem' }}>
                <i className="fa-solid fa-users"></i> {currentSquad.name}
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {currentSquad.members?.length || 1} member{(currentSquad.members?.length || 1) !== 1 ? 's' : ''} •
                {currentSquad.creatorId === user.uid ? ' Your Squad (Lead)' : ' Member'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => handleOpenDetails(currentSquad)}>
                <i className="fa-solid fa-eye"></i> View Members
              </button>
              <button className="btn btn-glass" onClick={() => handleLeaveSquad(currentSquad._id, currentSquad.name)}>
                Leave Squad
              </button>
            </div>
          </div>

          {/* Real-time chat inside the active squad card */}
          <div>
            <h5 style={{ color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              <i className="fa-solid fa-comments"></i> Real-time Squad Chat
            </h5>
            <div style={{
              height: '180px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)',
              padding: '1.2rem', borderRadius: '8px', border: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.2rem'
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
                  <i className="fa-solid fa-message" style={{ display: 'block', fontSize: '1.5rem', marginBottom: '0.5rem' }}></i>
                  No messages yet. Say hello to your squadmates!
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isMe = msg.senderEmail === user.email;
                  return (
                    <div key={idx} style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        maxWidth: '75%', padding: '0.6rem 1.2rem', borderRadius: '12px',
                        background: isMe ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                        border: isMe ? '1px solid var(--primary)' : '1px solid var(--border)',
                        color: 'white', fontSize: '0.9rem'
                      }}>
                        <strong style={{ display: 'block', fontSize: '0.75rem', color: isMe ? 'var(--primary)' : 'var(--secondary)', marginBottom: '0.25rem' }}>
                          {msg.senderName} {isMe ? '(You)' : ''}
                        </strong>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginInline: '0.4rem' }}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.8rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Type a message to your squadmates..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button className="btn btn-primary" type="submit" style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>Send</span>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SQUADS GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
        </div>
      ) : squads.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <i className="fa-solid fa-users-slash" style={{ fontSize: '3.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}></i>
          <h4 style={{ color: 'var(--text-muted)' }}>No Squads Active</h4>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '2rem' }}>Be the first to build a hiring squad!</p>
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> Create First Squad
          </button>
        </div>
      ) : (
        <div className="grid-cards">
          {squads.map(s => {
            const isCreator = s.creatorId === user.uid;
            const isMember = s.members.some(m => m.id === user.uid);
            
            return (
              <div key={s._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ marginBottom: '0.2rem' }}>{s.name}</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <i className="fa-solid fa-user"></i> Leader: {s.creatorName}
                      </p>
                    </div>
                    {isCreator && (
                      <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        <i className="fa-solid fa-crown"></i> Lead
                      </span>
                    )}
                  </div>

                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {s.members.length}/{maxSpots} members
                      </span>
                      <div style={{ width: '80px', height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${(s.members.length / maxSpots) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                    </div>

                    <div style={{ padding: '0.8rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                      {s.members.slice(0, 3).map((m, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                          <i className={m.role === 'Lead' ? "fa-solid fa-crown" : "fa-solid fa-user"} style={{ fontSize: '0.7rem', color: m.role === 'Lead' ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                          <span style={{ color: m.id === user.uid ? 'var(--primary)' : 'var(--text-main)' }}>
                            {m.name} {m.id === user.uid ? '(You)' : ''}
                          </span>
                        </div>
                      ))}
                      {s.members.length > 3 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.2rem', textAlign: 'center' }}>
                          +{s.members.length - 3} more members
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleOpenDetails(s)}>
                    <i className="fa-solid fa-eye"></i> Members
                  </button>

                  {!isMember && !user.squadId && (
                    <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => handleJoinSquad(s._id, s.name)}>
                      <i className="fa-solid fa-user-plus"></i> Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================================================== */}
      {/* ➕ CREATE NEW SQUAD MODAL OVERLAY                   */}
      {/* ==================================================== */}
      {createModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <button onClick={() => setCreateModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <h3 style={{ marginBottom: '1.5rem' }}><i className="fa-solid fa-users"></i> Create New Squad</h3>
            
            <form onSubmit={handleCreateSquad}>
              <div className="form-group">
                <label className="form-label">Squad Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. React Warriors, Data Avengers"
                  value={newSquadName}
                  onChange={e => setNewSquadName(e.target.value)}
                  required
                />
              </div>

              <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <p style={{ color: 'var(--primary)', margin: 0 }}>
                  <i className="fa-solid fa-info-circle"></i> As the creator, you will be the squad leader. You can invite up to 4 more members and manage this squad globally in real-time.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-primary" type="submit" style={{ flex: 1 }} disabled={creatingSquad}>
                  {creatingSquad ? 'Creating...' : 'Create Squad'}
                </button>
                <button className="btn btn-glass" type="button" style={{ flex: 1 }} onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 👥 SQUAD MEMBERS DETAIL ACTIONS MODAL OVERLAY        */}
      {/* ==================================================== */}
      {detailsModalOpen && activeSquad && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '85vh', overflowY: 'auto' }}>
            <button onClick={() => setDetailsModalOpen(false)} style={{
              position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none',
              color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem'
            }}>
              <i className="fa-solid fa-xmark"></i>
            </button>

            <div style={{ display: 'flex', alignPage: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '55px', height: '55px', background: 'var(--primary-glow)', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fa-solid fa-users" style={{ color: 'var(--primary)', fontSize: '1.6rem' }}></i>
              </div>
              <div>
                <h3 style={{ marginBottom: '0.2rem' }}>{activeSquad.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {activeSquad.memberCount} members • Managed in Real-Time
                </p>
              </div>
            </div>

            {/* QUICK STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--primary)' }}>{activeSquad.memberCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Members</div>
              </div>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--success)' }}>1</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lead</div>
              </div>
              <div className="glass-card" style={{ padding: '0.8rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{maxSpots - activeSquad.memberCount}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Spots Left</div>
              </div>
            </div>

            <h4 style={{ marginBottom: '1rem' }}><i className="fa-solid fa-user-group"></i> Active Squad Members</h4>

            {/* MEMBERS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {activeSquad.members?.map((member, index) => {
                const isUser = member.id === user.uid;
                const isLeader = member.role === 'Lead';
                const amILeader = activeSquad.creatorId === user.uid;

                return (
                  <div key={index} className="glass-card" style={{
                    padding: '1rem',
                    borderLeft: isUser ? '4px solid var(--primary)' : '1px solid var(--border)',
                    background: isUser ? 'var(--primary-glow)' : 'var(--bg-card)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '40px', height: '40px', background: isLeader ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {isLeader ? (
                            <i className="fa-solid fa-crown" style={{ color: 'var(--primary)' }}></i>
                          ) : (
                            <span style={{ fontWeight: 'bold' }}>{member.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: isUser ? 'var(--primary)' : 'var(--text-main)' }}>{member.name} {isUser && '(You)'}</span>
                            <span className="badge" style={{
                              background: isLeader ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                              color: isLeader ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '4px'
                            }}>
                              {member.role}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                            <i className="fa-solid fa-envelope"></i> {member.email}
                          </div>
                        </div>
                      </div>

                      {/* LEADER ACTIONS ON OTHER MEMBERS */}
                      {amILeader && !isLeader && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-sm btn-glass" onClick={() => handlePromoteMember(activeSquad.id, member.id, member.name, activeSquad.name)}>
                            <i className="fa-solid fa-crown"></i> Promote
                          </button>
                          <button className="btn btn-sm btn-error" onClick={() => handleRemoveMember(activeSquad.id, member.id, member.name, activeSquad.name)}>
                            <i className="fa-solid fa-user-minus"></i> Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BASE MODAL ACTIONS */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '1rem' }}>
              {activeSquad.creatorId === user.uid ? (
                <>
                  <button className="btn btn-error" style={{ flex: 1 }} onClick={() => handleDeleteSquad(activeSquad.id, activeSquad.name)}>
                    <i className="fa-solid fa-trash"></i> Delete Squad
                  </button>
                  <button className="btn btn-glass" style={{ flex: 1 }} onClick={() => setDetailsModalOpen(false)}>
                    Close
                  </button>
                </>
              ) : activeSquad.members.some(m => m.id === user.uid) ? (
                <button className="btn btn-error" style={{ width: '100%' }} onClick={() => handleLeaveSquad(activeSquad.id, activeSquad.name)}>
                  <i className="fa-solid fa-sign-out-alt"></i> Leave Squad
                </button>
              ) : (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => handleJoinSquad(activeSquad.id, activeSquad.name)}>
                  <i className="fa-solid fa-user-plus"></i> Join Squad
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
