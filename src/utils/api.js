// src/utils/api.js â€” connects to Railway backend

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Get stored JWT token
const getToken = () => localStorage.getItem('scheduleToken');

// Core fetch helper
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
};

// â”€â”€ Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const authAPI = {
  login: (username, password) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  verify: () => apiCall('/auth/verify'),
};

// â”€â”€ Schedule â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const scheduleAPI = {
  // Returns { "GROUP-DAY-TIME": { group, day, time, course, teacher, room, subjectType } }
  getAll: () => apiCall('/schedules'),

  // Save / update one class slot
  save: (group, day, time, course, teacher, room, subjectType) =>
    apiCall('/schedules', {
      method: 'POST',
      body: JSON.stringify({ group, day, time, course, teacher, room, subjectType }),
    }),

  // Delete one class slot
  delete: (group, day, time) =>
    apiCall(`/schedules/${encodeURIComponent(group)}/${day}/${encodeURIComponent(time)}`, {
      method: 'DELETE',
    }),
};

// â”€â”€ Groups â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const groupsAPI = {
  getAll: () => apiCall('/groups'),

  add: (name) =>
    apiCall('/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  delete: (name) =>
    apiCall(`/groups/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    }),
};