// src/utils/api.js

/**
 * API Service for University Schedule Builder
 * 
 * This module provides a centralized interface for all backend API calls.
 * Currently uses localStorage for data persistence, but can be easily
 * extended to work with a real backend API.
 * 
 * To integrate with a backend:
 * 1. Update the BASE_URL to point to your backend server
 * 2. Uncomment and implement the actual API call functions
 * 3. Update the context files to use these API functions instead of localStorage
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  // Login admin user
  login: async (username, password) => {
    // TODO: Implement actual API call
    // return apiCall('/auth/login', {
    //   method: 'POST',
    //   body: JSON.stringify({ username, password })
    // });
    
    // Temporary localStorage implementation
    return { success: true, user: { username, role: 'admin' } };
  },

  // Logout
  logout: async () => {
    // TODO: Implement actual API call
    // return apiCall('/auth/logout', { method: 'POST' });
    return { success: true };
  },

  // Verify token
  verifyToken: async (token) => {
    // TODO: Implement actual API call
    // return apiCall('/auth/verify', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    return { success: true };
  }
};

// Schedule API
export const scheduleAPI = {
  // Get all schedules
  getAll: async () => {
    // TODO: Implement actual API call
    // return apiCall('/schedules');
    
    const saved = localStorage.getItem('universitySchedule');
    return saved ? JSON.parse(saved) : {};
  },

  // Get schedule by ID
  getById: async (id) => {
    // TODO: Implement actual API call
    // return apiCall(`/schedules/${id}`);
    return null;
  },

  // Create or update a class
  saveClass: async (scheduleData) => {
    // TODO: Implement actual API call
    // return apiCall('/schedules', {
    //   method: 'POST',
    //   body: JSON.stringify(scheduleData)
    // });
    return { success: true, data: scheduleData };
  },

  // Delete a class
  deleteClass: async (group, day, time) => {
    // TODO: Implement actual API call
    // return apiCall(`/schedules/${group}/${day}/${time}`, {
    //   method: 'DELETE'
    // });
    return { success: true };
  },

  // Get schedule by day
  getByDay: async (day) => {
    // TODO: Implement actual API call
    // return apiCall(`/schedules/day/${day}`);
    return [];
  },

  // Get schedule by teacher
  getByTeacher: async (teacher) => {
    // TODO: Implement actual API call
    // return apiCall(`/schedules/teacher/${encodeURIComponent(teacher)}`);
    return [];
  },

  // Export schedule
  export: async () => {
    // TODO: Implement actual API call
    // return apiCall('/schedules/export');
    const schedule = await scheduleAPI.getAll();
    return { success: true, data: schedule };
  },

  // Import schedule
  import: async (data) => {
    // TODO: Implement actual API call
    // return apiCall('/schedules/import', {
    //   method: 'POST',
    //   body: JSON.stringify(data)
    // });
    return { success: true };
  }
};

// Groups API
export const groupsAPI = {
  // Get all groups
  getAll: async () => {
    // TODO: Implement actual API call
    // return apiCall('/groups');
    
    const saved = localStorage.getItem('universityGroups');
    return saved ? JSON.parse(saved) : [];
  },

  // Add a group
  add: async (groupName) => {
    // TODO: Implement actual API call
    // return apiCall('/groups', {
    //   method: 'POST',
    //   body: JSON.stringify({ name: groupName })
    // });
    return { success: true, data: { name: groupName } };
  },

  // Delete a group
  delete: async (groupName) => {
    // TODO: Implement actual API call
    // return apiCall(`/groups/${encodeURIComponent(groupName)}`, {
    //   method: 'DELETE'
    // });
    return { success: true };
  }
};

// Teachers API
export const teachersAPI = {
  // Get all teachers
  getAll: async () => {
    // TODO: Implement actual API call
    // return apiCall('/teachers');
    return [];
  },

  // Add a teacher
  add: async (teacherName) => {
    // TODO: Implement actual API call
    // return apiCall('/teachers', {
    //   method: 'POST',
    //   body: JSON.stringify({ name: teacherName })
    // });
    return { success: true, data: { name: teacherName } };
  }
};

export default {
  auth: authAPI,
  schedule: scheduleAPI,
  groups: groupsAPI,
  teachers: teachersAPI
};
