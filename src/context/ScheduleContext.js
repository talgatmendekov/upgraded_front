// src/context/ScheduleContext.js

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UNIVERSITY_GROUPS, TIME_SLOTS, DAYS } from '../data/constants';
import { scheduleAPI, groupsAPI } from '../utils/api';

const ScheduleContext = createContext();

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error('useSchedule must be used within a ScheduleProvider');
  return context;
};

// ─── Teacher name normalisation ───────────────────────────────────────────────
// Strips ALL trailing room/location noise from teacher strings so that:
//   "Dr. Mekuria B110 LAB"   → "Dr. Mekuria"
//   "Dr. Mekuria B 202"      → "Dr. Mekuria"   (space inside room code)
//   "Dr. Mekuria LAB3(210)"  → "Dr. Mekuria"
//   "Mr. X BIGLAB + make up" → "Mr. X"
//   "Ms. Y B109 (APPLE LAB)" → "Ms. Y"
//   "Ms. Z B204/(15:30...)"  → "Ms. Z"
//   "Mr. A b109"             → "Mr. A"          (lowercase room)
//   "Mr. B LINK"             → "Mr. B"
//   "Mr. C B WEB"            → "Mr. C"
export function normalizeTeacherName(raw) {
  if (!raw) return '';
  let s = raw.trim();

  // 1. Remove trailing parenthetical info: "(APPLE LAB)", "(with own device)"
  s = s.replace(/\s*\([^)]*\)\s*$/, '').trim();

  // 2. Remove slash+parens variant: "B204/ (15:30 BIGLAB)"
  s = s.replace(/\/\s*\(.*\)\s*$/, '').trim();

  // 3. Repeatedly strip trailing noise tokens until stable.
  //    Covers: B110, B 202, b109, A204, LAB, LAB3, LAB3(210), BIGLAB,
  //            BigLab, LINK, WEB, web, link, WeB, и102, make, up
  const TRAILING_NOISE = /\s+(B\s?\d*\w*|b\s?\d*\w*|A\d+|LAB\d*(\(\d+\))?|BIGLAB|BigLab|Lab\d*(\(\d+\))?|LINK|WEB|web|link|WeB|и\d+|make|up)$/i;
  let prev;
  do {
    prev = s;
    s = s.replace(TRAILING_NOISE, '').trim();
  } while (s !== prev);

  // 4. Strip trailing "+ anything" (e.g. "+ make up")
  s = s.replace(/\s*\+.*$/, '').trim();

  // 5. Strip trailing hyphenated lab refs like "B111-Lab"
  s = s.replace(/\s+\S*[Ll]ab\S*$/, '').trim();

  // 6. Collapse multiple spaces
  s = s.replace(/\s{2,}/g, ' ').trim();

  return s;
}

// Build a deduplicated sorted teacher list from schedule data.
// Normalises every raw string before deduplication, so
// "Dr. X B110 LAB", "Dr. X B202", "Dr. X" all collapse to one entry "Dr. X".
function buildTeacherList(scheduleMap) {
  const seen   = new Set();
  const result = [];
  Object.values(scheduleMap).forEach(entry => {
    if (!entry.teacher) return;
    const norm = normalizeTeacherName(entry.teacher);
    if (!norm || seen.has(norm)) return;
    seen.add(norm);
    result.push(norm);
  });
  return result.sort();
}

export const ScheduleProvider = ({ children }) => {
  const [groups,   setGroups]   = useState(UNIVERSITY_GROUPS);
  const [schedule, setSchedule] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [scheduleData, groupsData] = await Promise.all([
        scheduleAPI.getAll(),
        groupsAPI.getAll(),
      ]);
      setSchedule(scheduleData || {});
      if (groupsData?.length > 0) setGroups(groupsData);
    } catch (err) {
      console.error('Failed to load data from backend:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Deduplicated, normalised teacher list for the filter dropdown
  const teachers = buildTeacherList(schedule);

  // Filter schedule entries by teacher using normalised matching.
  // Selecting "Dr. Remudin Mekuria" will correctly return entries
  // stored as "Dr. Remudin Mekuria B110 LAB", "Dr. Remudin Mekuria B 202", etc.
  const getScheduleByTeacher = (teacherName) => {
    const normTarget = normalizeTeacherName(teacherName);
    return Object.entries(schedule).filter(
      ([, v]) => normalizeTeacherName(v.teacher) === normTarget
    );
  };

  const addOrUpdateClass = async (group, day, time, classData) => {
    const { course, teacher, room, subjectType, duration = 1 } = classData;
    try {
      await scheduleAPI.save(group, day, time, course, teacher, room, subjectType, duration);
      const key = `${group}-${day}-${time}`;
      setSchedule(prev => ({
        ...prev,
        [key]: { group, day, time, course, teacher: teacher || '', room: room || '', subjectType: subjectType || 'lecture', duration }
      }));
    } catch (err) {
      alert(`Failed to save class: ${err.message}`);
    }
  };

  const deleteClass = async (group, day, time) => {
    try {
      await scheduleAPI.delete(group, day, time);
      const key = `${group}-${day}-${time}`;
      setSchedule(prev => { const next = { ...prev }; delete next[key]; return next; });
    } catch (err) {
      alert(`Failed to delete class: ${err.message}`);
    }
  };

  const moveClass = async (fromGroup, fromDay, fromTime, toGroup, toDay, toTime) => {
    const fromKey  = `${fromGroup}-${fromDay}-${fromTime}`;
    const toKey    = `${toGroup}-${toDay}-${toTime}`;
    const fromData = schedule[fromKey];
    const toData   = schedule[toKey];
    if (!fromData) return;
    try {
      await scheduleAPI.save(toGroup, toDay, toTime, fromData.course, fromData.teacher, fromData.room, fromData.subjectType);
      if (toData) {
        await scheduleAPI.save(fromGroup, fromDay, fromTime, toData.course, toData.teacher, toData.room, toData.subjectType);
      } else {
        await scheduleAPI.delete(fromGroup, fromDay, fromTime);
      }
      setSchedule(prev => {
        const next = { ...prev };
        next[toKey] = { ...fromData, group: toGroup, day: toDay, time: toTime };
        if (toData) { next[fromKey] = { ...toData, group: fromGroup, day: fromDay, time: fromTime }; }
        else { delete next[fromKey]; }
        return next;
      });
    } catch (err) {
      alert(`Failed to move class: ${err.message}`);
      loadAll();
    }
  };

  const addGroup = async (groupName) => {
    try {
      await groupsAPI.add(groupName);
      setGroups(prev => [...prev, groupName]);
    } catch (err) {
      alert(`Failed to add group: ${err.message}`);
    }
  };

  const deleteGroup = async (groupName) => {
    try {
      await groupsAPI.delete(groupName);
      setGroups(prev => prev.filter(g => g !== groupName));
      setSchedule(prev => {
        const next = {};
        Object.entries(prev).forEach(([k, v]) => { if (v.group !== groupName) next[k] = v; });
        return next;
      });
    } catch (err) {
      alert(`Failed to delete group: ${err.message}`);
    }
  };

  const clearSchedule = async () => {
    try {
      await Promise.all(Object.values(schedule).map(e => scheduleAPI.delete(e.group, e.day, e.time)));
      setSchedule({});
    } catch (err) {
      alert(`Failed to clear schedule: ${err.message}`);
      loadAll();
    }
  };

  const getClassByKey    = (group, day, time) => schedule[`${group}-${day}-${time}`] || null;
  const getScheduleByDay = (day) => Object.entries(schedule).filter(([, v]) => v.day === day);
  const exportSchedule   = () => JSON.stringify({ groups, schedule, exportDate: new Date().toISOString() }, null, 2);

  const importSchedule = async (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      let entries   = [];
      let groupList = [];

      if (Array.isArray(data)) {
        entries   = data;
        groupList = [...new Set(data.map(e => e.group).filter(Boolean))];
      } else if (data.schedule) {
        entries   = Object.values(data.schedule);
        groupList = data.groups || [...new Set(entries.map(e => e.group).filter(Boolean))];
      } else {
        return { success: false, error: 'Invalid data format' };
      }

      if (entries.length === 0)
        return { success: false, error: 'No schedule entries found in file' };

      if (scheduleAPI.bulk) {
        const result = await scheduleAPI.bulk(groupList, entries);
        if (!result.success) return { success: false, error: result.error || 'Bulk import failed' };
      } else {
        for (const g of groupList) {
          if (!groups.includes(g)) {
            try { await groupsAPI.add(g); } catch { /* already exists */ }
          }
        }
        const BATCH = 10;
        for (let i = 0; i < entries.length; i += BATCH) {
          const batch = entries.slice(i, i + BATCH);
          await Promise.all(
            batch.map(e => scheduleAPI.save(e.group, e.day, e.time, e.course, e.teacher, e.room, e.subjectType))
          );
          if (i + BATCH < entries.length) await new Promise(r => setTimeout(r, 300));
        }
      }

      await loadAll();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return (
    <ScheduleContext.Provider value={{
      groups, schedule, teachers,
      timeSlots: TIME_SLOTS,
      days: DAYS,
      loading, error,
      addOrUpdateClass, deleteClass, moveClass,
      addGroup, deleteGroup, clearSchedule,
      getClassByKey, getScheduleByDay, getScheduleByTeacher,
      exportSchedule, importSchedule,
      reload: loadAll,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
};