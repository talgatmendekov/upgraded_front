// src/components/ScheduleTable.js

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { useLanguage } from '../context/LanguageContext';
import './ScheduleTable.css';

const getTodayName = () => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date().getDay()];
};

const ScheduleTable = ({ selectedDay, selectedTeacher, selectedGroup, onEditClass, onDeleteGroup }) => {
  const { isAuthenticated } = useAuth();
  const { groups, timeSlots, days, getClassByKey, schedule } = useSchedule();
  const { t } = useLanguage();

  const todayName = getTodayName();
  const daysToShow = selectedDay ? [selectedDay] : days;

  // Apply group filter
  const groupsToShow = selectedGroup
    ? groups.filter(g => g === selectedGroup)
    : groups;

  const shouldShowCell = (classData) => {
    if (!classData) return true;
    if (selectedTeacher && classData.teacher !== selectedTeacher) return false;
    return true;
  };

  // Check if a cell has conflicts (teacher or room used elsewhere same day+time)
  const getCellConflicts = (group, day, time, classData) => {
    if (!classData) return [];
    const conflicts = [];
    Object.values(schedule).forEach(entry => {
      if (entry.group === group) return;
      if (entry.day !== day || entry.time !== time) return;
      if (classData.teacher && entry.teacher &&
          entry.teacher.toLowerCase() === classData.teacher.toLowerCase()) {
        conflicts.push('teacher');
      }
      if (classData.room && entry.room &&
          entry.room.toLowerCase() === classData.room.toLowerCase()) {
        conflicts.push('room');
      }
    });
    return [...new Set(conflicts)];
  };

  return (
    <div className="schedule-container">
      <div className="table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="group-header">
                {t('groupTime')}
                {!isAuthenticated && <div className="lock-icon">🔒</div>}
              </th>
              {daysToShow.map(day => {
                const isToday = day === todayName;
                return (
                  <th
                    key={day}
                    className={`day-header ${isToday ? 'today-col' : ''}`}
                    colSpan={timeSlots.length}
                  >
                    {t(day)}
                    {isToday && <span className="today-badge"> ★</span>}
                  </th>
                );
              })}
            </tr>
            <tr>
              <th className="group-header"></th>
              {daysToShow.map(day =>
                timeSlots.map(time => (
                  <th
                    key={`${day}-${time}`}
                    className={`time-header ${day === todayName ? 'today-time' : ''}`}
                  >
                    {time}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {groupsToShow.map(group => (
              <tr key={group}>
                <td className="group-cell">
                  <div className="group-cell-content">
                    <span className="group-name">{group}</span>
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          if (window.confirm(t('confirmDeleteGroup', { group }))) {
                            onDeleteGroup(group);
                          }
                        }}
                        className="delete-group-btn"
                        title="Delete group"
                      >×</button>
                    )}
                  </div>
                </td>
                {daysToShow.map(day =>
                  timeSlots.map(time => {
                    const classData = getClassByKey(group, day, time);
                    const show = shouldShowCell(classData);
                    const isToday = day === todayName;
                    const conflicts = getCellConflicts(group, day, time, classData);
                    const hasTeacherConflict = conflicts.includes('teacher');
                    const hasRoomConflict = conflicts.includes('room');

                    if (!show) {
                      return (
                        <td
                          key={`${group}-${day}-${time}`}
                          className={`schedule-cell filtered-out ${isToday ? 'today-cell' : ''}`}
                        >
                          <div className="filtered-label">{t('filtered')}</div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${group}-${day}-${time}`}
                        className={`
                          schedule-cell
                          ${classData ? 'filled' : ''}
                          ${isAuthenticated ? 'editable' : ''}
                          ${isToday ? 'today-cell' : ''}
                          ${hasTeacherConflict ? 'conflict-teacher' : ''}
                          ${hasRoomConflict ? 'conflict-room' : ''}
                        `}
                        onClick={() => isAuthenticated && onEditClass(group, day, time)}
                      >
                        {classData ? (
                          <div className="cell-content">
                            {(hasTeacherConflict || hasRoomConflict) && (
                              <div className="cell-conflict-icons">
                                {hasTeacherConflict && <span title="Teacher conflict">⚠️</span>}
                                {hasRoomConflict && <span title="Room conflict">🚪⚠️</span>}
                              </div>
                            )}
                            <div className="course-name">{classData.course}</div>
                            {classData.teacher && (
                              <div className={`teacher-name ${hasTeacherConflict ? 'conflict-text' : ''}`}>
                                👨‍🏫 {classData.teacher}
                              </div>
                            )}
                            {classData.room && (
                              <div className={`room-number ${hasRoomConflict ? 'conflict-text' : ''}`}>
                                🚪 {classData.room}
                              </div>
                            )}
                          </div>
                        ) : (
                          isAuthenticated && <div className="empty-cell">+</div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
