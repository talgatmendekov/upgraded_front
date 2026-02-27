// Frontend: src/components/TeacherTelegramManagement.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import BroadcastMessage from './BroadcastMessage';
import './TeacherTelegramManagement.css';

// ── Same normalization as ScheduleContext (inline copy so no circular import) ─
const CANONICAL = {
  'dr. daniyar satybaldiev':          'Dr. Daniiar Satybaldiev',
  'mr. daniyar satybaldiev':          'Dr. Daniiar Satybaldiev',
  'dr daniiar satybaldiev':           'Dr. Daniiar Satybaldiev',
  'mr. daniiar satybaldiev':          'Dr. Daniiar Satybaldiev',
  'dr. daniar satybaldiev':           'Dr. Daniiar Satybaldiev',
  'mr. daniar satybaldiev':           'Dr. Daniiar Satybaldiev',
  'mr. nurlan mukambetov':            'Mr. Nurlan Mukambaev',
  'mr. erustan erkebulanov':          'Mr. Erustan Erkebulanov',
  'dr. sheraly matanov':              'Dr. Sherali Matanov',
  'mr. hussien chebsi':               'Mr. Hussein Chebsi',
  'mr. ahmad sarosh':                 'Dr. Ahmad Sarosh',
  'ms. cholpon alieva':               'Dr. Cholpon Alieva',
  'alimpieva.l.v':                    'Alimpieva L.',
  'ms. saidalieva a.':                'Ms. Saidalieva',
  'ms. bopushova asina':              'Ms. Asina',
  'ms. meerim':                       'Ms. Meerim Chukaeva',
  'ms. meerim chukaeva (own device)': 'Ms. Meerim Chukaeva',
  'mr. murrey':                       'Mr. Murrey Eldred',
  'ms. tattybubu arap kyzy':          'Ms. Tattybubu',
};

function normalizeName(raw) {
  if (!raw) return '';
  let s = raw.trim();
  s = s.replace(/([a-z])(LAB\d*|BIGLAB|B\d+)/g, '$1 $2');
  s = s.replace(/^\/+/, '').replace(/\/.*$/, '').trim();
  s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();
  s = s.replace(/\s+until+\b.*/i, '').trim();
  s = s.replace(/\s+(?:with\s+)?own\b.*/i, '').trim();
  s = s.replace(/\s+make\s+up\b.*/i, '').trim();
  s = s.replace(/\s+at\s+\d+[:.]\d+.*/i, '').trim();
  s = s.replace(/\s*\+.*$/, '').trim();
  const TRAIL = /\s+([Bb]\s?\d*\w*|[Aa]\d+|LAB\d*(\(\d+\))?|BIGLAB|BigLab|Lab\d*(\(\d+\))?|LINK|WEB|web|link|WeB|и\d+)$/i;
  let prev; do { prev = s; s = s.replace(TRAIL, '').trim(); } while (s !== prev);
  s = s.replace(/,\s*[Bb]\d+.*$/, '').replace(/[,]+$/, '').trim();
  s = s.replace(/\b(Dr|Mr|Ms|Mrs|Prof)\.(\w)/g, '$1. $2');
  s = s.replace(/\b(Dr|Mr|Ms|Mrs|Prof)\s+(?=[A-Z])/g, '$1. ');
  s = s.replace(/\s{2,}/g, ' ').trim();
  if (!s) return '';
  if (/^[Bb]\d+/.test(s)) return '';
  if (/^(ALATOO|German\s|DevOps\s|COM\b|\(COM\)|B201)/i.test(s)) return '';
  return CANONICAL[s.toLowerCase()] || s;
}

function deduplicateTeachers(rows) {
  // Group all DB rows by their canonical name
  const groups = new Map(); // canonicalName → [row, ...]
  for (const row of rows) {
    const key = normalizeName(row.name) || row.name.trim();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  // For each group: pick the row with a telegram_id if any, else first row
  return Array.from(groups.entries())
    .map(([canonicalName, members]) => {
      const winner = members.find(r => r.telegram_id) || members[0];
      return {
        ...winner,
        displayName: canonicalName,
        duplicateIds: members.map(r => r.id),   // all DB ids in this group
        duplicateCount: members.length,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

// ─────────────────────────────────────────────────────────────────────────────

const TeacherTelegramManagement = () => {
  const { t } = useLanguage();
  const [rawTeachers, setRawTeachers] = useState([]);
  const [groups, setGroups]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('teachers'); // teachers | groups | broadcast
  const [search, setSearch]           = useState('');

  const [editingId, setEditingId]           = useState(null);
  const [telegramInput, setTelegramInput]   = useState('');
  const [editingGroup, setEditingGroup]     = useState(null);
  const [groupChatInput, setGroupChatInput] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  const token   = () => localStorage.getItem('scheduleToken');

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchTeachers = async () => {
    try {
      const res  = await fetch(`${API_URL}/teachers`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setRawTeachers(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchGroups = async () => {
    try {
      const res  = await fetch(`${API_URL}/group-channels`, { headers: { Authorization: `Bearer ${token()}` } });
      const data = await res.json();
      if (data.success) setGroups(data.data);
    } catch (e) { console.error(e); }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchTeachers(), fetchGroups()]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Deduplicated + filtered teacher list ────────────────────────────────────
  const teachers = useMemo(() => {
    const deduped = deduplicateTeachers(rawTeachers);
    if (!search.trim()) return deduped;
    const q = search.toLowerCase();
    return deduped.filter(t => t.displayName.toLowerCase().includes(q));
  }, [rawTeachers, search]);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    teachers.length,
    linked:   teachers.filter(t => t.telegram_id).length,
    dupes:    rawTeachers.length - deduplicateTeachers(rawTeachers).length,
    gLinked:  groups.filter(g => g.chat_id).length,
    gTotal:   groups.length,
  }), [teachers, rawTeachers, groups]);

  // ── Teacher actions ─────────────────────────────────────────────────────────
  const saveTelegramId = async (teacher) => {
    try {
      const res  = await fetch(`${API_URL}/teachers/${teacher.id}/telegram`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramInput.trim() }),
      });
      const data = await res.json();
      if (data.success) { setEditingId(null); setTelegramInput(''); fetchTeachers(); }
      else alert('Error: ' + data.error);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const removeTelegramId = async (teacher) => {
    if (!window.confirm(`Remove Telegram ID for ${teacher.displayName}?`)) return;
    try {
      const res  = await fetch(`${API_URL}/teachers/${teacher.id}/telegram`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { success: false, error: text }; }
      if (data.success) fetchTeachers();
      else alert('Delete failed (' + res.status + '): ' + (data.error || text));
    } catch (e) { alert('Network error: ' + e.message); }
  };

  const deleteTeacher = async (teacher) => {
    const extra = teacher.duplicateCount > 1
      ? `\n\nThis will remove ${teacher.duplicateCount} duplicate records.` : '';
    if (!window.confirm(`Permanently delete "${teacher.displayName}"?${extra}`)) return;
    try {
      await Promise.all(teacher.duplicateIds.map(id =>
        fetch(`${API_URL}/teachers/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token()}` },
        })
      ));
      fetchTeachers();
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ── Group actions ───────────────────────────────────────────────────────────
  const saveGroup = async (groupName) => {
    try {
      const res  = await fetch(`${API_URL}/group-channels`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: groupName, chat_id: groupChatInput.trim() }),
      });
      const data = await res.json();
      if (data.success) { setEditingGroup(null); setGroupChatInput(''); fetchGroups(); }
      else alert('Error: ' + data.error);
    } catch (e) { alert('Error: ' + e.message); }
  };

  const deleteGroup = async (groupName) => {
    if (!window.confirm(`Remove channel for group ${groupName}?`)) return;
    try {
      const res  = await fetch(`${API_URL}/group-channels/${encodeURIComponent(groupName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { success: false, error: text }; }
      if (data.success) fetchGroups();
      else alert('Delete failed: ' + (data.error || text));
    } catch (e) { alert('Error: ' + e.message); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <div className="ttm-loading"><span>Loading…</span></div>;

  return (
    <div className="ttm">

      {/* ── Header ── */}
      <div className="ttm-header">
        <div className="ttm-header-left">
          <h1 className="ttm-title">Telegram</h1>
          <p className="ttm-subtitle">Manage notifications & broadcast messages</p>
        </div>
        <button className="ttm-refresh" onClick={fetchAll} title="Refresh">↻</button>
      </div>

      {/* ── Stats bar ── */}
      <div className="ttm-stats">
        <div className="ttm-stat">
          <span className="ttm-stat-val">{stats.linked}</span>
          <span className="ttm-stat-lbl">teachers linked</span>
        </div>
        <div className="ttm-stat-div" />
        <div className="ttm-stat">
          <span className="ttm-stat-val">{stats.total - stats.linked}</span>
          <span className="ttm-stat-lbl">not linked</span>
        </div>
        <div className="ttm-stat-div" />
        <div className="ttm-stat">
          <span className="ttm-stat-val">{stats.gLinked}</span>
          <span className="ttm-stat-lbl">group channels</span>
        </div>
        {stats.dupes > 0 && (
          <>
            <div className="ttm-stat-div" />
            <div className="ttm-stat ttm-stat-warn">
              <span className="ttm-stat-val">{stats.dupes}</span>
              <span className="ttm-stat-lbl">dupes hidden</span>
            </div>
          </>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="ttm-tabs">
        {[
          { id: 'teachers',  label: 'Teachers' },
          { id: 'groups',    label: 'Group Channels' },
          { id: 'broadcast', label: 'Broadcast' },
        ].map(t => (
          <button key={t.id} className={`ttm-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          TEACHERS
      ════════════════════════════════════════ */}
      {tab === 'teachers' && (
        <div className="ttm-pane">
          {/* Search */}
          <div className="ttm-search-wrap">
            <input
              className="ttm-search"
              type="text"
              placeholder="Search teacher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="ttm-search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>

          {/* Setup hint */}
          <div className="ttm-hint">
            Teacher sends <code>/start</code> to the bot → gets their ID → you paste it here
          </div>

          {/* Table */}
          <div className="ttm-table-wrap">
            <table className="ttm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Telegram ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.length === 0 && (
                  <tr><td colSpan={4} className="ttm-empty">No teachers found</td></tr>
                )}
                {teachers.map(teacher => (
                  <tr key={teacher.id} className={teacher.telegram_id ? 'row-linked' : ''}>

                    {/* Name */}
                    <td className="ttm-name-cell">
                      <span className="ttm-name">{teacher.displayName}</span>
                      {teacher.duplicateCount > 1 && (
                        <span className="ttm-dupe-tag" title={`${teacher.duplicateCount} duplicate records merged`}>
                          {teacher.duplicateCount} records
                        </span>
                      )}
                    </td>

                    {/* Telegram ID */}
                    <td>
                      {editingId === teacher.id ? (
                        <input
                          className="ttm-input"
                          type="text"
                          value={telegramInput}
                          onChange={e => setTelegramInput(e.target.value)}
                          placeholder="e.g. 1300165738"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveTelegramId(teacher);
                            if (e.key === 'Escape') { setEditingId(null); setTelegramInput(''); }
                          }}
                        />
                      ) : (
                        <span className={teacher.telegram_id ? 'ttm-id-set' : 'ttm-id-empty'}>
                          {teacher.telegram_id || '—'}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`ttm-badge ${teacher.telegram_id ? 'badge-on' : 'badge-off'}`}>
                        {teacher.telegram_id ? 'Linked' : 'Not set'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="ttm-actions">
                        {editingId === teacher.id ? (
                          <>
                            <button className="ttm-btn save" onClick={() => saveTelegramId(teacher)}>Save</button>
                            <button className="ttm-btn cancel" onClick={() => { setEditingId(null); setTelegramInput(''); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button
                              className="ttm-btn edit"
                              onClick={() => { setEditingId(teacher.id); setTelegramInput(teacher.telegram_id || ''); }}
                            >
                              Edit
                            </button>
                            {teacher.telegram_id && (
                              <button className="ttm-btn remove" onClick={() => removeTelegramId(teacher)}>
                                Remove ID
                              </button>
                            )}
                            <button className="ttm-btn danger" onClick={() => deleteTeacher(teacher)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bot commands */}
          <div className="ttm-commands">
            <p className="ttm-commands-title">Bot commands for teachers</p>
            <div className="ttm-commands-grid">
              <code>/start</code><span>Get your Telegram ID</span>
              <code>/status</code><span>Check if registered</span>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          GROUP CHANNELS
      ════════════════════════════════════════ */}
      {tab === 'groups' && (
        <div className="ttm-pane">
          <div className="ttm-hint">
            Add bot as <strong>Admin</strong> to the group/channel → get chat ID via <code>@getidsbot</code> → paste below
          </div>

          <div className="ttm-table-wrap">
            <table className="ttm-table">
              <thead>
                <tr>
                  <th>Group</th>
                  <th>Chat ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 && (
                  <tr><td colSpan={4} className="ttm-empty">No groups configured yet</td></tr>
                )}
                {groups.map(g => (
                  <tr key={g.group_name} className={g.chat_id ? 'row-linked' : ''}>
                    <td className="ttm-name-cell"><span className="ttm-name">{g.group_name}</span></td>
                    <td>
                      {editingGroup === g.group_name ? (
                        <input
                          className="ttm-input"
                          type="text"
                          value={groupChatInput}
                          onChange={e => setGroupChatInput(e.target.value)}
                          placeholder="e.g. -1001234567890"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter')  saveGroup(g.group_name);
                            if (e.key === 'Escape') { setEditingGroup(null); setGroupChatInput(''); }
                          }}
                        />
                      ) : (
                        <span className={g.chat_id ? 'ttm-id-set' : 'ttm-id-empty'}>{g.chat_id || '—'}</span>
                      )}
                    </td>
                    <td>
                      <span className={`ttm-badge ${g.chat_id ? 'badge-on' : 'badge-off'}`}>
                        {g.chat_id ? 'Linked' : 'Not set'}
                      </span>
                    </td>
                    <td>
                      <div className="ttm-actions">
                        {editingGroup === g.group_name ? (
                          <>
                            <button className="ttm-btn save" onClick={() => saveGroup(g.group_name)}>Save</button>
                            <button className="ttm-btn cancel" onClick={() => { setEditingGroup(null); setGroupChatInput(''); }}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className="ttm-btn edit" onClick={() => { setEditingGroup(g.group_name); setGroupChatInput(g.chat_id || ''); }}>Edit</button>
                            {g.chat_id && <button className="ttm-btn danger" onClick={() => deleteGroup(g.group_name)}>Delete</button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          BROADCAST
      ════════════════════════════════════════ */}
      {tab === 'broadcast' && <BroadcastMessage />}
    </div>
  );
};

export default TeacherTelegramManagement;