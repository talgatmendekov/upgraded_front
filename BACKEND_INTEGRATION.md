# Backend Integration Guide

Complete guide for adding a backend to the University Schedule Builder.

## Overview

The frontend is designed to work with any backend that implements the specified API endpoints. This guide provides examples using Node.js/Express with PostgreSQL, but you can use any technology stack.

## Architecture

```
Frontend (React)
    ↓
API Service (src/utils/api.js)
    ↓
Backend API
    ↓
Database
```

## Required API Endpoints

### Authentication Endpoints

#### 1. Login
```
POST /api/auth/login
Content-Type: application/json

Request:
{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

#### 2. Logout
```
POST /api/auth/logout
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

#### 3. Verify Token
```
GET /api/auth/verify
Authorization: Bearer {token}

Response:
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Schedule Endpoints

#### 1. Get All Schedules
```
GET /api/schedules
Authorization: Bearer {token}

Response:
{
  "COMSE-25-Monday-08:00": {
    "id": 1,
    "group": "COMSE-25",
    "day": "Monday",
    "time": "08:00",
    "course": "Data Structures",
    "teacher": "Prof. Smith",
    "room": "Room 305"
  },
  ...
}
```

#### 2. Create/Update Class
```
POST /api/schedules
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "group": "COMSE-25",
  "day": "Monday",
  "time": "08:00",
  "course": "Data Structures",
  "teacher": "Prof. Smith",
  "room": "Room 305"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "group": "COMSE-25",
    "day": "Monday",
    "time": "08:00",
    "course": "Data Structures",
    "teacher": "Prof. Smith",
    "room": "Room 305"
  }
}
```

#### 3. Delete Class
```
DELETE /api/schedules/:group/:day/:time
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

#### 4. Get by Day
```
GET /api/schedules/day/:day
Authorization: Bearer {token}

Example: GET /api/schedules/day/Monday

Response:
[
  {
    "group": "COMSE-25",
    "day": "Monday",
    "time": "08:00",
    "course": "Data Structures",
    "teacher": "Prof. Smith",
    "room": "Room 305"
  },
  ...
]
```

#### 5. Get by Teacher
```
GET /api/schedules/teacher/:teacher
Authorization: Bearer {token}

Example: GET /api/schedules/teacher/Prof.%20Smith

Response:
[
  {
    "group": "COMSE-25",
    "day": "Monday",
    "time": "08:00",
    "course": "Data Structures",
    "teacher": "Prof. Smith",
    "room": "Room 305"
  },
  ...
]
```

### Group Endpoints

#### 1. Get All Groups
```
GET /api/groups
Authorization: Bearer {token}

Response:
[
  "COMSE-25",
  "COMCEH-25",
  "MATDAIS-25",
  ...
]
```

#### 2. Add Group
```
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "name": "COMSE-26"
}

Response:
{
  "success": true,
  "data": {
    "id": 26,
    "name": "COMSE-26"
  }
}
```

#### 3. Delete Group
```
DELETE /api/groups/:name
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

## Backend Implementation Example

### 1. Project Setup

```bash
mkdir schedule-backend
cd schedule-backend
npm init -y
npm install express pg bcrypt jsonwebtoken cors dotenv
npm install --save-dev nodemon
```

### 2. Database Schema (PostgreSQL)

```sql
-- Create database
CREATE DATABASE university_schedule;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Groups table
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  group_name VARCHAR(50) NOT NULL,
  day VARCHAR(20) NOT NULL,
  time VARCHAR(10) NOT NULL,
  course VARCHAR(100) NOT NULL,
  teacher VARCHAR(100),
  room VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_name, day, time),
  FOREIGN KEY (group_name) REFERENCES groups(name) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_schedules_day ON schedules(day);
CREATE INDEX idx_schedules_teacher ON schedules(teacher);
CREATE INDEX idx_schedules_group ON schedules(group_name);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$YourHashedPasswordHere', 'admin');

-- Insert initial groups
INSERT INTO groups (name) VALUES 
  ('COMSE-25'), ('COMCEH-25'), ('COMFCI-25'), ('COMCEH-24'),
  ('COMSE-24'), ('COMFCI-24'), ('COMSEH-23'), ('COMSE-23/1-Group'),
  ('COMSE-23/2-Group'), ('COMFCI-23'), ('COM-22/1-Group'),
  ('COM-22/2-Group'), ('MATDAIS-25'), ('MATMIE-25'),
  ('MATDAIS-24'), ('MATMIE-24'), ('MATDAIS-23'), ('MATMIE-23'),
  ('MATH-22'), ('EEAIR-25'), ('IEMIT-25'), ('EEAIR-24'),
  ('IEMIT-24'), ('EEAIR-23'), ('IEMIT-23');
```

### 3. Server Configuration (server.js)

```javascript
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'university_schedule',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true });
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// ============================================
// SCHEDULE ROUTES
// ============================================

// Get all schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM schedules ORDER BY group_name, day, time'
    );

    // Convert to key-value format
    const schedules = {};
    result.rows.forEach(row => {
      const key = `${row.group_name}-${row.day}-${row.time}`;
      schedules[key] = {
        id: row.id,
        group: row.group_name,
        day: row.day,
        time: row.time,
        course: row.course,
        teacher: row.teacher,
        room: row.room
      };
    });

    res.json(schedules);
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create or update schedule
app.post('/api/schedules', authenticateToken, async (req, res) => {
  try {
    const { group, day, time, course, teacher, room } = req.body;

    const result = await pool.query(
      `INSERT INTO schedules (group_name, day, time, course, teacher, room)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (group_name, day, time)
       DO UPDATE SET course = $4, teacher = $5, room = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [group, day, time, course, teacher, room]
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        group: result.rows[0].group_name,
        day: result.rows[0].day,
        time: result.rows[0].time,
        course: result.rows[0].course,
        teacher: result.rows[0].teacher,
        room: result.rows[0].room
      }
    });
  } catch (error) {
    console.error('Save schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete schedule
app.delete('/api/schedules/:group/:day/:time', authenticateToken, async (req, res) => {
  try {
    const { group, day, time } = req.params;

    await pool.query(
      'DELETE FROM schedules WHERE group_name = $1 AND day = $2 AND time = $3',
      [group, day, time]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get schedules by day
app.get('/api/schedules/day/:day', async (req, res) => {
  try {
    const { day } = req.params;

    const result = await pool.query(
      'SELECT * FROM schedules WHERE day = $1 ORDER BY time, group_name',
      [day]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get by day error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get schedules by teacher
app.get('/api/schedules/teacher/:teacher', async (req, res) => {
  try {
    const { teacher } = req.params;

    const result = await pool.query(
      'SELECT * FROM schedules WHERE teacher = $1 ORDER BY day, time',
      [teacher]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get by teacher error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// GROUP ROUTES
// ============================================

// Get all groups
app.get('/api/groups', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name FROM groups ORDER BY name'
    );

    const groups = result.rows.map(row => row.name);
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add group
app.post('/api/groups', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    const result = await pool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name
      }
    });
  } catch (error) {
    console.error('Add group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete group
app.delete('/api/groups/:name', authenticateToken, async (req, res) => {
  try {
    const { name } = req.params;

    await pool.query('DELETE FROM groups WHERE name = $1', [name]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 4. Environment Variables (.env)

```env
PORT=3001
DB_USER=postgres
DB_HOST=localhost
DB_NAME=university_schedule
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### 5. Package.json Scripts

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Frontend Integration Steps

### 1. Create .env file in frontend

```env
REACT_APP_API_URL=http://localhost:3001/api
```

### 2. Update AuthContext.js

```javascript
import api from '../utils/api';

const login = async (username, password) => {
  try {
    const result = await api.auth.login(username, password);
    if (result.success) {
      const userData = result.user;
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('scheduleUser', JSON.stringify(userData));
      localStorage.setItem('authToken', result.token);
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

### 3. Update ScheduleContext.js

Replace localStorage calls with API calls:

```javascript
import api from '../utils/api';

const loadSchedule = async () => {
  try {
    const data = await api.schedule.getAll();
    setSchedule(data);
    extractTeachers(data);
  } catch (error) {
    console.error('Failed to load schedule:', error);
  }
};

const addOrUpdateClass = async (group, day, time, classData) => {
  try {
    await api.schedule.saveClass({ group, day, time, ...classData });
    // Update local state
    const key = `${group}-${day}-${time}`;
    const newSchedule = {
      ...schedule,
      [key]: { ...classData, group, day, time }
    };
    setSchedule(newSchedule);
  } catch (error) {
    console.error('Failed to save class:', error);
    alert('Error saving class');
  }
};
```

## Testing

### 1. Test Authentication
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 2. Test Get Schedules
```bash
curl http://localhost:3001/api/schedules \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Deployment

### Backend Deployment (Heroku Example)

```bash
# Install Heroku CLI
# Login to Heroku
heroku login

# Create app
heroku create your-schedule-api

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key

# Deploy
git push heroku main
```

### Frontend Deployment (Vercel/Netlify)

Update .env:
```env
REACT_APP_API_URL=https://your-schedule-api.herokuapp.com/api
```

Build and deploy:
```bash
npm run build
# Deploy the build folder to Vercel/Netlify
```

## Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation
- [ ] Enable CORS only for your frontend domain
- [ ] Hash passwords with bcrypt
- [ ] Implement session timeout
- [ ] Add audit logging
- [ ] Regular security updates

---

**Ready to integrate!** Follow these steps and your schedule builder will have a fully functional backend.
