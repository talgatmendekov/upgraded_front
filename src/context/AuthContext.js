// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_ADMIN } from '../data/constants';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('scheduleUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (username, password) => {
    // TODO: Replace with actual API call to backend
    if (username === DEFAULT_ADMIN.username && password === DEFAULT_ADMIN.password) {
      const userData = { username, role: 'admin' };
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('scheduleUser', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('scheduleUser');
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
