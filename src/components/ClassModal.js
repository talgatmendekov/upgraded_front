// src/components/ClassModal.js

import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import { useLanguage } from '../context/LanguageContext';
import './ClassModal.css';

const ClassModal = ({ isOpen, onClose, group, day, time }) => {
  const { getClassByKey, addOrUpdateClass, deleteClass, schedule } = useSchedule();
  const { t } = useLanguage();

  const [course, setCourse] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    if (isOpen && group && day && time) {
      const classData = getClassByKey(group, day, time);
      if (classData) {
        setCourse(classData.course || '');
        setTeacher(classData.teacher || '');
        setRoom(classData.room || '');
      } else {
        setCourse('');
        setTeacher('');
        setRoom('');
      }
      setConflicts([]);
    }
  }, [isOpen, group, day, time, getClassByKey]);

  // Detect conflicts in real-time as user types
  useEffect(() => {
    if (!isOpen || !day || !time) return;
    const detected = [];

    // Check teacher conflict
    if (teacher.trim()) {
      Object.values(schedule).forEach(entry => {
        if (
          entry.day === day &&
          entry.time === time &&
          entry.group !== group &&
          entry.teacher &&
          entry.teacher.toLowerCase() === teacher.trim().toLowerCase()
        ) {
          detected.push({
            type: 'teacher',
            message: t('teacherConflict', { teacher: entry.teacher }),
            detail: t('teacherConflictIn', { group: entry.group })
          });
        }
      });
    }

    // Check room conflict
    if (room.trim()) {
      Object.values(schedule).forEach(entry => {
        if (
          entry.day === day &&
          entry.time === time &&
          entry.group !== group &&
          entry.room &&
          entry.room.toLowerCase() === room.trim().toLowerCase()
        ) {
          detected.push({
            type: 'room',
            message: t('roomConflict', { room: entry.room }),
            detail: t('roomConflictIn', { group: entry.group })
          });
        }
      });
    }

    setConflicts(detected);
  }, [teacher, room, day, time, group, schedule, t, isOpen]);

  const handleSave = () => {
    if (!course.trim()) {
      alert(t('courseNameRequired'));
      return;
    }

    if (conflicts.length > 0) {
      const proceed = window.confirm(
        `${t('warningTitle')}\n\n` +
        conflicts.map(c => `${c.message} ${c.detail}`).join('\n') +
        `\n\n${t('conflictWarning')}`
      );
      if (!proceed) return;
    }

    addOrUpdateClass(group, day, time, {
      course: course.trim(),
      teacher: teacher.trim(),
      room: room.trim()
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(t('confirmDelete'))) {
      deleteClass(group, day, time);
      onClose();
    }
  };

  if (!isOpen) return null;

  const existingClass = getClassByKey(group, day, time);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{existingClass ? t('editClass') : t('addClass')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-info">
          <span className="info-badge">{group}</span>
          <span className="info-badge">{day}</span>
          <span className="info-badge">{time}</span>
        </div>

        {/* Conflict warnings */}
        {conflicts.length > 0 && (
          <div className="conflicts-container">
            <div className="conflicts-title">{t('warningTitle')}</div>
            {conflicts.map((conflict, idx) => (
              <div key={idx} className={`conflict-item conflict-${conflict.type}`}>
                <span className="conflict-msg">{conflict.message}</span>
                <span className="conflict-detail">{conflict.detail}</span>
              </div>
            ))}
          </div>
        )}

        <div className="modal-body">
          <div className="form-group">
            <label>{t('courseName')} *</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., Data Structures"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>{t('teacherName')}</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g., Prof. Smith"
              className={conflicts.some(c => c.type === 'teacher') ? 'input-conflict' : ''}
            />
          </div>

          <div className="form-group">
            <label>{t('roomNumber')}</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Room 305"
              className={conflicts.some(c => c.type === 'room') ? 'input-conflict' : ''}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">{t('cancel')}</button>
          {existingClass && (
            <button onClick={handleDelete} className="btn btn-danger">{t('delete')}</button>
          )}
          <button onClick={handleSave} className={`btn ${conflicts.length > 0 ? 'btn-warning' : 'btn-primary'}`}>
            {conflicts.length > 0 ? `⚠️ ${t('save')}` : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassModal;
