// src/components/ScheduleTable.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import './ScheduleTable.css';

const ScheduleTable = ({ selectedDay: propSelectedDay, onDayChange, selectedTeacher, onEditClass, onDeleteGroup }) => {
  const { isAuthenticated } = useAuth();
  const { groups, timeSlots, days, getClassByKey } = useSchedule();
  
  // Состояние для выбранного дня
  const [selectedDay, setSelectedDay] = useState('');

  // Устанавливаем сегодняшний день при загрузке
  useEffect(() => {
    // Получаем сегодняшний день (0-6, где 0 - воскресенье)
    const today = new Date().getDay();
    
    // Маппинг дней недели
    const dayMap = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      0: 'Sunday'
    };
    
    const todayDay = dayMap[today];
    
    // Устанавливаем сегодняшний день
    setSelectedDay(todayDay);
    
    // Сообщаем родительскому компоненту о сегодняшнем дне
    if (onDayChange) {
      onDayChange(todayDay);
    }
  }, [onDayChange]); // Зависимость от onDayChange

  // Обновляем локальное состояние, если проп изменился
  useEffect(() => {
    if (propSelectedDay) {
      setSelectedDay(propSelectedDay);
    }
  }, [propSelectedDay]);

  const daysToShow = selectedDay ? [selectedDay] : days;

  const shouldShowCell = (classData) => {
    if (!classData) return true;
    
    if (selectedTeacher && classData.teacher !== selectedTeacher) {
      return false;
    }
    
    return true;
  };

  const handleCellClick = (group, day, time) => {
    if (isAuthenticated) {
      onEditClass(group, day, time);
    }
  };

  const handleGroupDelete = (group) => {
    if (window.confirm(`Are you sure you want to delete group "${group}" and all its classes?`)) {
      onDeleteGroup(group);
    }
  };

  // Показываем загрузку, пока день не установлен
  if (!selectedDay) {
    return (
      <div className="schedule-container">
        <div className="loading">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <div className="table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="group-header">
                Group / Time
                {!isAuthenticated && <div className="lock-icon">🔒</div>}
              </th>
              {daysToShow.map(day => (
                <th key={day} className="day-header" colSpan={timeSlots.length}>
                  {day}
                </th>
              ))}
            </tr>
            <tr>
              <th className="group-header"></th>
              {daysToShow.map(day =>
                timeSlots.map(time => (
                  <th key={`${day}-${time}`} className="time-header">
                    {time}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group}>
                <td className="group-cell">
                  <div className="group-cell-content">
                    <span className="group-name">{group}</span>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleGroupDelete(group)}
                        className="delete-group-btn"
                        title="Delete group"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </td>
                {daysToShow.map(day =>
                  timeSlots.map(time => {
                    const classData = getClassByKey(group, day, time);
                    const show = shouldShowCell(classData);
                    
                    if (!show) {
                      return (
                        <td key={`${group}-${day}-${time}`} className="schedule-cell filtered-out">
                          <div className="filtered-label">Filtered</div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${group}-${day}-${time}`}
                        className={`schedule-cell ${classData ? 'filled' : ''} ${isAuthenticated ? 'editable' : ''}`}
                        onClick={() => handleCellClick(group, day, time)}
                      >
                        {classData ? (
                          <div className="cell-content">
                            <div className="course-name">{classData.course}</div>
                            {classData.teacher && (
                              <div className="teacher-name">👨‍🏫 {classData.teacher}</div>
                            )}
                            {classData.room && (
                              <div className="room-number">🚪 {classData.room}</div>
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