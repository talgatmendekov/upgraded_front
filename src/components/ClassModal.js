// src/components/ClassModal.js

import React, { useState, useEffect } from 'react';
import { useSchedule } from '../context/ScheduleContext';
import './ClassModal.css';

const ClassModal = ({ isOpen, onClose, group, day, time }) => {
  const { getClassByKey, addOrUpdateClass, deleteClass } = useSchedule();
  const [course, setCourse] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');

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
    }
  }, [isOpen, group, day, time, getClassByKey]);

  const handleSave = () => {
    if (!course.trim()) {
      alert('Course name is required');
      return;
    }

    addOrUpdateClass(group, day, time, {
      course: course.trim(),
      teacher: teacher.trim(),
      room: room.trim()
    });

    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this class?')) {
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
          <h2>{existingClass ? 'Edit Class' : 'Add Class'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-info">
          <span className="info-badge">{group}</span>
          <span className="info-badge">{day}</span>
          <span className="info-badge">{time}</span>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Course Name *</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., Data Structures"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Teacher Name</label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="e.g., Prof. Smith"
            />
          </div>

          <div className="form-group">
            <label>Room Number</label>
            <input
              type="text"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              placeholder="e.g., Room 305"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          {existingClass && (
            <button onClick={handleDelete} className="btn btn-danger">
              Delete
            </button>
          )}
          <button onClick={handleSave} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClassModal;
