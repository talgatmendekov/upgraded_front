import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { DAYS } from '../data/constants';

const ScheduleContext = createContext();

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};

export const ScheduleProvider = ({ children }) => {
  const [groups, setGroups] = useState([]);
  const [schedule, setSchedule] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [groupsData, scheduleData, teachersData] = await Promise.all([
        api.groups.getAll(),
        api.schedule.getAll(),
        api.schedule.getAllTeachers()
      ]);
      
      setGroups(groupsData);
      setSchedule(scheduleData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addOrUpdateClass = async (group, day, time, classData) => {
    try {
      const result = await api.schedule.saveClass({
        group,
        day,
        time,
        ...classData
      });

      if (result.success) {
        // Update local state
        const key = `${group}-${day}-${time}`;
        setSchedule(prev => ({
          ...prev,
          [key]: {
            ...classData,
            group,
            day,
            time,
            id: result.data.id
          }
        }));

        // Reload teachers list
        const teachersData = await api.schedule.getAllTeachers();
        setTeachers(teachersData);

        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error saving class:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteClass = async (group, day, time) => {
    try {
      const result = await api.schedule.deleteClass(group, day, time);
      
      if (result.success) {
        // Update local state
        const key = `${group}-${day}-${time}`;
        setSchedule(prev => {
          const newSchedule = { ...prev };
          delete newSchedule[key];
          return newSchedule;
        });

        // Reload teachers list
        const teachersData = await api.schedule.getAllTeachers();
        setTeachers(teachersData);

        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error deleting class:', error);
      return { success: false, error: error.message };
    }
  };

  const addGroup = async (groupName) => {
    try {
      const result = await api.groups.add(groupName);
      
      if (result.success) {
        setGroups(prev => [...prev, groupName]);
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error adding group:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteGroup = async (groupName) => {
    try {
      const result = await api.groups.delete(groupName);
      
      if (result.success) {
        setGroups(prev => prev.filter(g => g !== groupName));
        
        // Remove schedules for this group from local state
        setSchedule(prev => {
          const newSchedule = {};
          Object.entries(prev).forEach(([key, value]) => {
            if (value.group !== groupName) {
              newSchedule[key] = value;
            }
          });
          return newSchedule;
        });

        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error deleting group:', error);
      return { success: false, error: error.message };
    }
  };

  const clearSchedule = async () => {
    // This would need a backend endpoint to clear all schedules
    // For now, you'd need to delete each schedule individually
    console.warn('Clear schedule not implemented with backend');
  };

  const getClassByKey = (group, day, time) => {
    const key = `${group}-${day}-${time}`;
    return schedule[key] || null;
  };

  const exportSchedule = () => {
    const data = {
      groups,
      schedule,
      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  };

  const importSchedule = async (jsonData) => {
    // This would need careful handling with backend
    console.warn('Import schedule not fully implemented with backend');
    return { success: false, error: 'Import not yet supported' };
  };

  const value = {
    groups,
    schedule,
    teachers,
    timeSlots: ['08:00', '08:45', '09:30', '10:15', '11:00', '11:45', '12:30', '13:10', '14:00', '14:45', '15:30', '16:15', '17:00', '17:45'],
    days: DAYS,
    loading,
    addOrUpdateClass,
    deleteClass,
    addGroup,
    deleteGroup,
    clearSchedule,
    getClassByKey,
    exportSchedule,
    importSchedule,
    reload: loadData
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
};