# University Schedule Builder

A comprehensive React-based timetable management system for universities with admin panel, filtering capabilities, and backend-ready architecture.

## Features

### Core Functionality
- ✅ **Interactive Schedule Grid** - Groups as rows, time slots as columns
- ✅ **Admin Panel** - Secure authentication for schedule management
- ✅ **Guest Mode** - View-only access for students and faculty
- ✅ **Day Filtering** - View schedule by specific days
- ✅ **Teacher Filtering** - Filter classes by teacher name
- ✅ **CRUD Operations** - Add, edit, and delete classes and groups
- ✅ **Data Persistence** - LocalStorage for frontend-only mode
- ✅ **Export/Import** - JSON-based data export and import
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

### Admin Features
- Add/Edit/Delete classes with course name, teacher, and room
- Add/Delete groups dynamically
- Export schedule data as JSON
- Import schedule data from JSON
- Clear entire schedule
- Full CRUD access to all schedule data

### Viewer Features
- View complete schedule
- Filter by day (Monday-Saturday)
- Filter by teacher name
- Read-only access (no modifications)

## Project Structure

```
university-schedule/
├── public/
│   └── index.html              # HTML template
├── src/
│   ├── components/             # React components
│   │   ├── ClassModal.js       # Modal for editing classes
│   │   ├── ClassModal.css
│   │   ├── Header.js           # Header with filters and controls
│   │   ├── Header.css
│   │   ├── Login.js            # Login page
│   │   ├── Login.css
│   │   ├── ScheduleTable.js    # Main timetable grid
│   │   └── ScheduleTable.css
│   ├── context/                # React Context for state management
│   │   ├── AuthContext.js      # Authentication state
│   │   └── ScheduleContext.js  # Schedule data state
│   ├── data/
│   │   └── constants.js        # University groups, time slots, days
│   ├── utils/
│   │   └── api.js              # API service (backend integration ready)
│   ├── App.js                  # Main app component
│   ├── App.css
│   ├── index.js                # React entry point
│   └── index.css
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Frontend-Only Setup (Current)

1. **Clone or extract the project**
   ```bash
   cd university-schedule
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Default Credentials
- **Username:** admin
- **Password:** admin123

**⚠️ IMPORTANT:** Change these credentials in production!

## Usage Guide

### For Administrators

1. **Login**
   - Use admin credentials to access admin panel
   - Admin mode enables all editing features

2. **Add a Class**
   - Click on any empty cell in the schedule
   - Enter course name (required)
   - Enter teacher name (optional)
   - Enter room number (optional)
   - Click "Save"

3. **Edit a Class**
   - Click on a filled cell
   - Modify the information
   - Click "Save"

4. **Delete a Class**
   - Click on the class cell
   - Click "Delete" button
   - Confirm deletion

5. **Add a Group**
   - Click "Add Group" button
   - Enter group name (e.g., COMSE-26)
   - Group will appear as a new row

6. **Delete a Group**
   - Click the "×" button next to group name
   - Confirm deletion
   - All classes for that group will be deleted

7. **Filter by Day**
   - Select a day from "Filter by Day" dropdown
   - Only that day's schedule will be shown

8. **Filter by Teacher**
   - Select a teacher from "Filter by Teacher" dropdown
   - Only classes taught by that teacher will be shown

9. **Export Schedule**
   - Click "Export" button
   - JSON file will be downloaded

10. **Import Schedule**
    - Click "Import" button
    - Select a previously exported JSON file
    - Schedule will be loaded

11. **Clear All**
    - Click "Clear All" button
    - Confirm to delete entire schedule

### For Viewers (Guest Mode)

1. **View Schedule**
   - Click "View Schedule as Guest"
   - Browse the complete schedule (read-only)

2. **Filter by Day/Teacher**
   - Use filter dropdowns to narrow view
   - Cannot edit or modify schedule

## Data Storage

### Current Implementation (Frontend-Only)
- Data stored in browser's localStorage
- Persists between sessions
- Limited to single browser/device

### Data Structure

**Schedule Entry:**
```json
{
  "COMSE-25-Monday-08:00": {
    "course": "Data Structures",
    "teacher": "Prof. Smith",
    "room": "Room 305",
    "group": "COMSE-25",
    "day": "Monday",
    "time": "08:00"
  }
}
```

**Groups Array:**
```json
[
  "COMSE-25",
  "COMCEH-25",
  "MATDAIS-25",
  ...
]
```

## Backend Integration Guide

The application is structured for easy backend integration. Follow these steps:

### 1. Backend Requirements

Your backend should provide these API endpoints:

#### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify JWT token

#### Schedules
- `GET /api/schedules` - Get all schedules
- `GET /api/schedules/:id` - Get schedule by ID
- `POST /api/schedules` - Create/update a class
- `DELETE /api/schedules/:group/:day/:time` - Delete a class
- `GET /api/schedules/day/:day` - Get schedule by day
- `GET /api/schedules/teacher/:teacher` - Get schedule by teacher
- `GET /api/schedules/export` - Export schedule data
- `POST /api/schedules/import` - Import schedule data

#### Groups
- `GET /api/groups` - Get all groups
- `POST /api/groups` - Add a group
- `DELETE /api/groups/:name` - Delete a group

#### Teachers
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Add a teacher

### 2. Frontend Integration Steps

1. **Set Backend URL**
   
   Create a `.env` file:
   ```
   REACT_APP_API_URL=http://your-backend-url/api
   ```

2. **Update API Service**
   
   In `src/utils/api.js`, uncomment the API call implementations:
   ```javascript
   // Example: Enable login API call
   login: async (username, password) => {
     return apiCall('/auth/login', {
       method: 'POST',
       body: JSON.stringify({ username, password })
     });
   }
   ```

3. **Update Context Files**
   
   Modify `AuthContext.js` and `ScheduleContext.js` to use API calls:
   ```javascript
   import api from '../utils/api';
   
   // Replace localStorage calls with API calls
   const login = async (username, password) => {
     const result = await api.auth.login(username, password);
     // Handle response...
   };
   ```

4. **Add Token Management**
   
   Store JWT tokens and include in requests:
   ```javascript
   const token = localStorage.getItem('authToken');
   headers: {
     'Authorization': `Bearer ${token}`
   }
   ```

5. **Error Handling**
   
   Add proper error handling for API failures:
   ```javascript
   try {
     const result = await api.schedule.saveClass(data);
   } catch (error) {
     console.error('Failed to save:', error);
     alert('Error saving class. Please try again.');
   }
   ```

### 3. Backend Implementation Example (Node.js/Express)

```javascript
// Example backend structure
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Authentication
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  // Verify credentials
  // Generate JWT token
  res.json({ success: true, token, user });
});

// Schedules
app.get('/api/schedules', authenticateToken, async (req, res) => {
  // Fetch from database
  const schedules = await db.schedules.findAll();
  res.json(schedules);
});

app.post('/api/schedules', authenticateToken, async (req, res) => {
  const scheduleData = req.body;
  // Save to database
  const saved = await db.schedules.create(scheduleData);
  res.json({ success: true, data: saved });
});

// ... more endpoints
```

### 4. Database Schema

**Users Table:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Schedules Table:**
```sql
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
  UNIQUE(group_name, day, time)
);
```

**Groups Table:**
```sql
CREATE TABLE groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Customization

### Change University Groups
Edit `src/data/constants.js`:
```javascript
export const UNIVERSITY_GROUPS = [
  'YOUR-GROUP-1',
  'YOUR-GROUP-2',
  // ... add your groups
];
```

### Change Time Slots
Edit `src/data/constants.js`:
```javascript
export const TIME_SLOTS = [
  '08:00',
  '09:00',
  // ... add your time slots
];
```

### Change Days
Edit `src/data/constants.js`:
```javascript
export const DAYS = [
  'Monday',
  'Tuesday',
  // ... customize days
];
```

### Modify Styling
- Main colors: `src/App.css` (CSS variables)
- Component-specific: Individual component CSS files

## Security Considerations

### Current Implementation
- ⚠️ Credentials hardcoded (frontend-only)
- ⚠️ No encryption
- ⚠️ No session management

### Production Recommendations
1. **Backend Authentication**
   - Use JWT tokens
   - Implement secure password hashing (bcrypt)
   - Add session timeout
   - Enable HTTPS only

2. **Input Validation**
   - Sanitize all user inputs
   - Validate data on backend
   - Prevent SQL injection

3. **Access Control**
   - Role-based permissions
   - API rate limiting
   - CORS configuration

4. **Data Protection**
   - Encrypt sensitive data
   - Regular backups
   - Audit logs

## Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers

## Troubleshooting

### Schedule not saving
- Check browser localStorage is enabled
- Check console for errors
- Clear browser cache

### Login not working
- Verify credentials: admin / admin123
- Check browser console for errors

### Filters not working
- Ensure data is entered correctly
- Check teacher names match exactly

### Mobile display issues
- Use landscape mode for better view
- Scroll horizontally to see all time slots

## Future Enhancements

- [ ] Backend API integration
- [ ] Database persistence
- [ ] Multi-user roles (admin, teacher, student)
- [ ] Email notifications
- [ ] PDF export
- [ ] Print-friendly view
- [ ] Conflict detection
- [ ] Bulk import from CSV/Excel
- [ ] Calendar integration
- [ ] Mobile app

## License

This project is provided as-is for educational and commercial use.

## Support

For issues and questions:
1. Check this README
2. Review code comments
3. Check browser console for errors

---

**Built with React** | **Ready for Production with Backend Integration**
