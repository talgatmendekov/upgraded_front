// src/context/ScheduleContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UNIVERSITY_GROUPS, TIME_SLOTS, DAYS } from '../data/constants';

const ScheduleContext = createContext();

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider = ({ children }) => {
  const [groups, setGroups] = useState(UNIVERSITY_GROUPS);
  const [schedule, setSchedule] = useState({});
  const [teachers, setTeachers] = useState(new Set());

  useEffect(() => {
    // Load schedule from localStorage
    const savedSchedule = localStorage.getItem('universitySchedule');
    const savedGroups = localStorage.getItem('universityGroups');
    
    if (savedSchedule) {
      const parsedSchedule = JSON.parse(savedSchedule);
      setSchedule(parsedSchedule);
      extractTeachers(parsedSchedule);
    }
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  const extractTeachers = (scheduleData) => {
    const teacherSet = new Set();
    Object.values(scheduleData).forEach(entry => {
      if (entry.teacher) {
        teacherSet.add(entry.teacher);
      }
    });
    setTeachers(teacherSet);
  };

  const saveSchedule = (newSchedule) => {
    setSchedule(newSchedule);
    localStorage.setItem('universitySchedule', JSON.stringify(newSchedule));
    extractTeachers(newSchedule);
  };

  const addOrUpdateClass = (group, day, time, classData) => {
    const key = `${group}-${day}-${time}`;
    const newSchedule = {
      ...schedule,
      [key]: {
        ...classData,
        group,
        day,
        time
      }
    };
    saveSchedule(newSchedule);
  };

  const deleteClass = (group, day, time) => {
    const key = `${group}-${day}-${time}`;
    const newSchedule = { ...schedule };
    delete newSchedule[key];
    saveSchedule(newSchedule);
  };

  const addGroup = (groupName) => {
    const newGroups = [...groups, groupName];
    setGroups(newGroups);
    localStorage.setItem('universityGroups', JSON.stringify(newGroups));
  };

  const deleteGroup = (groupName) => {
    const newGroups = groups.filter(g => g !== groupName);
    setGroups(newGroups);
    localStorage.setItem('universityGroups', JSON.stringify(newGroups));
    
    // Delete all classes for this group
    const newSchedule = {};
    Object.entries(schedule).forEach(([key, value]) => {
      if (value.group !== groupName) {
        newSchedule[key] = value;
      }
    });
    saveSchedule(newSchedule);
  };

  const clearSchedule = () => {
    saveSchedule({});
  };

  const getClassByKey = (group, day, time) => {
    const key = `${group}-${day}-${time}`;
    return schedule[key] || null;
  };

  const getScheduleByDay = (day) => {
    return Object.entries(schedule).filter(([_, value]) => value.day === day);
  };

  const getScheduleByTeacher = (teacher) => {
    return Object.entries(schedule).filter(([_, value]) => value.teacher === teacher);
  };

  const exportSchedule = () => {
    const data = {
      groups,
      schedule,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importSchedule = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.groups && data.schedule) {
        setGroups(data.groups);
        saveSchedule(data.schedule);
        localStorage.setItem('universityGroups', JSON.stringify(data.groups));
        return { success: true };
      }
      return { success: false, error: 'Invalid data format' };
    } catch (error) {
      return { success: false, error: 'Invalid JSON' };
    }
  };

  const value = {
    groups,
    schedule,
    teachers: Array.from(teachers),
    timeSlots: TIME_SLOTS,
    days: DAYS,
    addOrUpdateClass,
    deleteClass,
    addGroup,
    deleteGroup,
    clearSchedule,
    getClassByKey,
    getScheduleByDay,
    getScheduleByTeacher,
    exportSchedule,
    importSchedule
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};
