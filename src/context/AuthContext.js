// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if saved token is still valid
  useEffect(() => {
    const savedToken = localStorage.getItem('scheduleToken');
    const savedUser  = localStorage.getItem('scheduleUser');
    if (savedToken && savedUser) {
      // Verify token is still valid with backend
      authAPI.verify()
        .then(() => {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
        })
        .catch(() => {
          // Token expired or invalid â€” clear storage
          localStorage.removeItem('scheduleToken');
          localStorage.removeItem('scheduleUser');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      // Backend returns { success, token, user: { username, role } }
      if (data.token) {
        localStorage.setItem('scheduleToken', data.token);
        localStorage.setItem('scheduleUser', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: 'No token received' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('scheduleToken');
    localStorage.removeItem('scheduleUser');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};