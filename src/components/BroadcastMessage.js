// Frontend: src/components/BroadcastMessage.js
import React, { useState, useEffect } from 'react';
import './BroadcastMessage.css';

const BroadcastMessage = () => {
  const [teachers, setTeachers]   = useState([]);
  const [groups, setGroups]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState(null); // { sent, failed, details }

  // Recipient selection
  const [recipientType, setRecipientType] = useState('all'); // 'all' | 'teachers' | 'groups' | 'pick'
  const [selectedTeachers, setSelectedTeachers] = useState(new Set());
  const [selectedGroups, setSelectedGroups]     = useState(new Set());

  // Message
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const token   = () => localStorage.getItem('scheduleToken');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tRes, gRes] = await Promise.all([
          fetch(`${API_URL}/teachers`,       { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API_URL}/group-channels`, { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        const [tData, gData] = await Promise.all([tRes.json(), gRes.json()]);
        if (tData.success) setTeachers(tData.data.filter(t => t.telegram_id));
        if (gData.success) setGroups(gData.data.filter(g => g.chat_id));
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, []);

  const toggleTeacher = (id) => {
    setSelectedTeachers(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleGroup = (name) => {
    setSelectedGroups(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const selectAllTeachers = () => setSelectedTeachers(new Set(teachers.map(t => t.id)));
  const clearAllTeachers  = () => setSelectedTeachers(new Set());
  const selectAllGroups   = () => setSelectedGroups(new Set(groups.map(g => g.group_name)));
  const clearAllGroups    = () => setSelectedGroups(new Set());

  const recipientSummary = () => {
    if (recipientType === 'all')      return `Everyone (${teachers.length} teachers + ${groups.length} groups)`;
    if (recipientType === 'teachers') return `All teachers (${teachers.length})`;
    if (recipientType === 'groups')   return `All groups (${groups.length})`;
    if (recipientType === 'pick') {
      const parts = [];
      if (selectedTeachers.size) parts.push(`${selectedTeachers.size} teacher(s)`);
      if (selectedGroups.size)   parts.push(`${selectedGroups.size} group(s)`);
      return parts.length ? parts.join(' + ') : 'Nobody selected yet';
    }
    return '';
  };

  const handleSend = async () => {
    if (!message.trim()) { alert('Please enter a message.'); return; }

    // Build recipient lists
    let teacherIds = [];
    let groupNames = [];

    if (recipientType === 'all') {
      teacherIds = teachers.map(t => t.id);
      groupNames = groups.map(g => g.group_name);
    } else if (recipientType === 'teachers') {
      teacherIds = teachers.map(t => t.id);
    } else if (recipientType === 'groups') {
      groupNames = groups.map(g => g.group_name);
    } else {
      teacherIds = [...selectedTeachers];
      groupNames = [...selectedGroups];
    }

    if (teacherIds.length === 0 && groupNames.length === 0) {
      alert('No recipients selected. Please select at least one teacher or group.');
      return;
    }

    setSending(true);
    setResult(null);
    try {
      const res  = await fetch(`${API_URL}/broadcast`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), message: message.trim(), teacherIds, groupNames }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setMessage('');
        setSubject('');
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="bc-loading">Loading recipients...</div>;

  const totalReachable = teachers.length + groups.length;

  return (
    <div className="broadcast-wrap">
      <div className="bc-header">
        <h2>📢 Broadcast Message</h2>
        <p className="bc-subtitle">
          Send a Telegram message to teachers and/or group channels.
          <br />
          <span className="bc-reach">
            Currently reachable: <strong>{teachers.length} teachers</strong> with Telegram IDs
            + <strong>{groups.length} group channels</strong> linked.
          </span>
          {totalReachable === 0 && (
            <span className="bc-warn"> ⚠️ No recipients configured yet — go to the Telegram tab to add IDs.</span>
          )}
        </p>
      </div>

      {/* ── Step 1: Recipients ── */}
      <div className="bc-card">
        <h3 className="bc-step">① Recipients</h3>

        <div className="bc-type-grid">
          {[
            { value: 'all',      icon: '🌐', label: 'Everyone',       sub: `${teachers.length} teachers + ${groups.length} groups` },
            { value: 'teachers', icon: '👨‍🏫', label: 'All Teachers',  sub: `${teachers.length} people` },
            { value: 'groups',   icon: '👥', label: 'All Groups',     sub: `${groups.length} channels` },
            { value: 'pick',     icon: '🎯', label: 'Pick manually',  sub: 'Choose specific ones' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`bc-type-btn ${recipientType === opt.value ? 'selected' : ''}`}
              onClick={() => setRecipientType(opt.value)}
            >
              <span className="bc-type-icon">{opt.icon}</span>
              <span className="bc-type-label">{opt.label}</span>
              <span className="bc-type-sub">{opt.sub}</span>
            </button>
          ))}
        </div>

        {/* Manual picker */}
        {recipientType === 'pick' && (
          <div className="bc-picker">
            {/* Teachers picker */}
            {teachers.length > 0 && (
              <div className="bc-pick-section">
                <div className="bc-pick-header">
                  <span>👨‍🏫 Teachers</span>
                  <div className="bc-pick-actions">
                    <button onClick={selectAllTeachers} className="bc-link">Select all</button>
                    <button onClick={clearAllTeachers}  className="bc-link">Clear</button>
                  </div>
                </div>
                <div className="bc-chips">
                  {teachers.map(t => (
                    <button
                      key={t.id}
                      className={`bc-chip ${selectedTeachers.has(t.id) ? 'selected' : ''}`}
                      onClick={() => toggleTeacher(t.id)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Groups picker */}
            {groups.length > 0 && (
              <div className="bc-pick-section">
                <div className="bc-pick-header">
                  <span>👥 Group Channels</span>
                  <div className="bc-pick-actions">
                    <button onClick={selectAllGroups} className="bc-link">Select all</button>
                    <button onClick={clearAllGroups}  className="bc-link">Clear</button>
                  </div>
                </div>
                <div className="bc-chips">
                  {groups.map(g => (
                    <button
                      key={g.group_name}
                      className={`bc-chip ${selectedGroups.has(g.group_name) ? 'selected' : ''}`}
                      onClick={() => toggleGroup(g.group_name)}
                    >
                      {g.group_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {teachers.length === 0 && groups.length === 0 && (
              <p className="bc-empty">No recipients with Telegram configured yet.</p>
            )}
          </div>
        )}

        <div className="bc-summary">
          📬 Will send to: <strong>{recipientSummary()}</strong>
        </div>
      </div>

      {/* ── Step 2: Message ── */}
      <div className="bc-card">
        <h3 className="bc-step">② Message</h3>

        <input
          className="bc-subject"
          type="text"
          placeholder="Subject / title (optional)  e.g. «Schedule change»"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={120}
        />

        <textarea
          className="bc-textarea"
          placeholder="Type your message here…"
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={6}
          maxLength={3000}
        />
        <div className="bc-char-count">{message.length} / 3000</div>

        {/* Preview */}
        {(subject || message) && (
          <div className="bc-preview">
            <p className="bc-preview-label">Preview:</p>
            <div className="bc-preview-bubble">
              {subject && <p className="bc-preview-subject">📢 <strong>{subject}</strong></p>}
              <p className="bc-preview-body">{message || '…'}</p>
              <p className="bc-preview-footer">— University Admin</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Send button ── */}
      <button
        className="bc-send-btn"
        onClick={handleSend}
        disabled={sending || !message.trim() || totalReachable === 0}
      >
        {sending ? '⏳ Sending…' : '🚀 Send Message'}
      </button>

      {/* ── Result ── */}
      {result && (
        <div className={`bc-result ${result.failed === 0 ? 'success' : 'partial'}`}>
          <p>
            ✅ Sent to <strong>{result.sent}</strong> recipient(s)
            {result.failed > 0 && <span> · ❌ Failed: <strong>{result.failed}</strong></span>}
          </p>
          {result.details && result.details.length > 0 && (
            <details>
              <summary>Details</summary>
              <ul>
                {result.details.map((d, i) => (
                  <li key={i} className={d.ok ? 'ok' : 'fail'}>
                    {d.ok ? '✅' : '❌'} {d.name}
                    {!d.ok && d.error && <span className="err-msg"> — {d.error}</span>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

export default BroadcastMessage;