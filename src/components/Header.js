// src/components/Header.js
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import ThemeToggle from './ThemeToggle';
import logo from '../assets/logo.png';
import './Header.css';

const Header = ({
  selectedDay,
  setSelectedDay,
  selectedTeacher,
  setSelectedTeacher,
  onAddGroup,
  onExport,
  onImport,
  onClearAll
}) => {
  const { isAuthenticated, user, logout } = useAuth();
  const { days, teachers } = useSchedule();

  return (
    <div className="header">
      <div className="header-top">
        <div className="header-title">
          <div>
            <img src={logo} alt="University Logo" className="logo" />
            <h1>Ala-Too International University</h1>
          </div>

          <p className="subtitle">Timetable Management System</p>
        </div>

        <div className="header-user">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <span className="user-badge">
                <span className="user-icon">👤</span>
                {user.username} ({user.role})
              </span>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <span className="guest-badge">Guest Mode (View Only)</span>
          )}
        </div>
      </div>

      <div className="header-controls">
        <div className="filters">
          <div className="filter-group">
            <label>Filter by Day:</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="select-input"
            >
              <option value="">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Filter by Teacher:</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="select-input"
            >
              <option value="">All Teachers</option>
              {teachers.map(teacher => (
                <option key={teacher} value={teacher}>{teacher}</option>
              ))}
            </select>
          </div>
        </div>

        {isAuthenticated && (
          <div className="admin-actions">
            <button onClick={onAddGroup} className="btn btn-primary">
              + Add Group
            </button>
            <button onClick={onExport} className="btn btn-success">
              Export
            </button>
            <button onClick={onImport} className="btn btn-info">
              Import
            </button>
            <button onClick={onClearAll} className="btn btn-danger">
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
