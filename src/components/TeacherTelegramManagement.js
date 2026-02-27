// Frontend: src/components/TeacherTelegramManagement.js
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import BroadcastMessage from './BroadcastMessage';
import './TeacherTelegramManagement.css';

const TeacherTelegramManagement = () => {
  const { t } = useLanguage();
  const [teachers, setTeachers]     = useState([]);
  const [groups, setGroups]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState('teachers');

  const [editingId, setEditingId]         = useState(null);
  const [telegramInput, setTelegramInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [groupChatInput, setGroupChatInput] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const token   = () => localStorage.getItem('scheduleToken');

  const fetchTeachers = async () => {
    try {
      const res  = await fetch(`${API_URL}/teachers`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setTeachers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchGroupChannels = async () => {
    try {
      const res  = await fetch(`${API_URL}/group-channels`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTeachers(), fetchGroupChannels()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveTelegramId = async (id) => {
    try {
      const res  = await fetch(`${API_URL}/teachers/${id}/telegram`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramInput.trim() }),
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); setTelegramInput(''); fetchTeachers(); }
      else alert(`Error: ${data.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const handleDeleteTelegramId = async (id, name) => {
    if (!window.confirm(`Remove Telegram ID for ${name}?`)) return;
    try {
      const res  = await fetch(`${API_URL}/teachers/${id}/telegram`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) fetchTeachers();
      else alert(`Error: ${data.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const handleSaveGroupChannel = async (groupName) => {
    try {
      const res  = await fetch(`${API_URL}/group-channels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, chat_id: groupChatInput.trim() }),
      });
      const data = await res.json();
      if (data.success) { setEditingGroupId(null); setGroupChatInput(''); fetchGroupChannels(); }
      else alert(`Error: ${data.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  const handleDeleteGroupChannel = async (groupName) => {
    if (!window.confirm(`Remove Telegram channel for group ${groupName}?`)) return;
    try {
      const res  = await fetch(`${API_URL}/group-channels/${encodeURIComponent(groupName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) fetchGroupChannels();
      else alert(`Error: ${data.error}`);
    } catch (e) { alert(`Error: ${e.message}`); }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="teacher-telegram-management">
      <div className="management-header">
        <h2>📱 {t('telegramNotifications') || 'Telegram Notifications'}</h2>
        <button onClick={fetchAll} className="btn-refresh">🔄</button>
      </div>

      <div className="section-tabs">
        {[
          { id: 'teachers',  icon: '👨‍🏫', label: 'Teachers' },
          { id: 'groups',    icon: '👥',   label: 'Group Channels' },
          { id: 'broadcast', icon: '📢',   label: 'Broadcast' },
        ].map(s => (
          <button key={s.id} className={`section-tab ${activeSection === s.id ? 'active' : ''}`} onClick={() => setActiveSection(s.id)}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── TEACHERS ── */}
      {activeSection === 'teachers' && (
        <>
          <div className="info-box">
            <h3>ℹ️ How to Setup</h3>
            <ol>
              <li>Teachers open the bot and send <code>/start</code></li>
              <li>They receive their Telegram ID — paste it below</li>
              <li>They get schedule-change alerts + 1-hour class reminders</li>
            </ol>
          </div>
          <div className="teachers-list">
            {teachers.length === 0 ? <p className="no-teachers">No teachers found.</p> : (
              <table className="teachers-table">
                <thead>
                  <tr><th>Teacher Name</th><th>Telegram ID</th><th>Notifications</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {teachers.map(teacher => (
                    <tr key={teacher.id}>
                      <td className="teacher-name">{teacher.name}</td>
                      <td>
                        {editingId === teacher.id
                          ? <input type="text" value={telegramInput} onChange={e => setTelegramInput(e.target.value)} placeholder="e.g. 1300165738" className="telegram-input" autoFocus />
                          : <span className={teacher.telegram_id ? 'has-id' : 'no-id'}>{teacher.telegram_id || 'Not set'}</span>
                        }
                      </td>
                      <td>
                        <span className={`status ${teacher.telegram_id && teacher.notifications_enabled ? 'enabled' : 'disabled'}`}>
                          {teacher.telegram_id ? (teacher.notifications_enabled ? 'ON' : 'OFF') : '—'}
                        </span>
                      </td>
                      <td className="action-cell">
                        {editingId === teacher.id ? (
                          <>
                            <button onClick={() => handleSaveTelegramId(teacher.id)} className="btn btn-save">💾 Save</button>
                            <button onClick={() => { setEditingId(null); setTelegramInput(''); }} className="btn btn-cancel">✕ Cancel</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => { setEditingId(teacher.id); setTelegramInput(teacher.telegram_id || ''); }} className="btn btn-edit">✏️ Edit</button>
                            {teacher.telegram_id && (
                              <button onClick={() => handleDeleteTelegramId(teacher.id, teacher.name)} className="btn btn-delete">🗑️ Delete</button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="bot-commands">
            <h3>Bot Commands for Teachers</h3>
            <ul>
              <li><code>/start</code> — Get your Telegram ID</li>
              <li><code>/status</code> — Check registration status</li>
              <li><code>/enable</code> — Enable notifications</li>
              <li><code>/disable</code> — Disable notifications</li>
            </ul>
          </div>
        </>
      )}

      {/* ── GROUP CHANNELS ── */}
      {activeSection === 'groups' && (
        <>
          <div className="info-box">
            <h3>ℹ️ How to link a group channel</h3>
            <ol>
              <li>Create a Telegram group or channel for each student group</li>
              <li>Add your bot as an <strong>Admin</strong></li>
              <li>Get the chat ID (negative number, e.g. <code>-1001234567890</code>) via <code>@getidsbot</code></li>
              <li>Paste it here — students receive schedule changes automatically</li>
            </ol>
          </div>
          <div className="teachers-list">
            <table className="teachers-table">
              <thead>
                <tr><th>Group</th><th>Telegram Chat ID</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {groups.length === 0 && <tr><td colSpan={4} className="no-teachers">No group channels configured yet.</td></tr>}
                {groups.map(group => (
                  <tr key={group.group_name}>
                    <td className="teacher-name">{group.group_name}</td>
                    <td>
                      {editingGroupId === group.group_name
                        ? <input type="text" value={groupChatInput} onChange={e => setGroupChatInput(e.target.value)} placeholder="e.g. -1001234567890" className="telegram-input" autoFocus />
                        : <span className={group.chat_id ? 'has-id' : 'no-id'}>{group.chat_id || 'Not set'}</span>
                      }
                    </td>
                    <td><span className={`status ${group.chat_id ? 'enabled' : 'disabled'}`}>{group.chat_id ? 'Linked' : 'Not linked'}</span></td>
                    <td className="action-cell">
                      {editingGroupId === group.group_name ? (
                        <>
                          <button onClick={() => handleSaveGroupChannel(group.group_name)} className="btn btn-save">💾 Save</button>
                          <button onClick={() => { setEditingGroupId(null); setGroupChatInput(''); }} className="btn btn-cancel">✕ Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditingGroupId(group.group_name); setGroupChatInput(group.chat_id || ''); }} className="btn btn-edit">✏️ Edit</button>
                          {group.chat_id && <button onClick={() => handleDeleteGroupChannel(group.group_name)} className="btn btn-delete">🗑️ Delete</button>}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── BROADCAST ── */}
      {activeSection === 'broadcast' && <BroadcastMessage />}
    </div>
  );
};

export default TeacherTelegramManagement;