# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
cd university-schedule
npm install
```

### Step 2: Start the Application
```bash
npm start
```

### Step 3: Login
```
Username: admin
Password: admin123
```

The app will open at `http://localhost:3000`

## 📋 What You Can Do

### As Admin (after login)
- ✅ Click any cell to add a class
- ✅ Enter course name, teacher, and room
- ✅ Click "Add Group" to add new student groups
- ✅ Use filters to view by day or teacher
- ✅ Export/Import schedule data
- ✅ Delete groups and classes

### As Guest (without login)
- ✅ Click "View Schedule as Guest"
- ✅ View the complete schedule (read-only)
- ✅ Use filters to find specific classes

## 🎯 Common Tasks

### Add a New Class
1. Click empty cell in schedule
2. Fill in course name (required)
3. Add teacher and room (optional)
4. Click "Save"

### Add a New Group
1. Click "Add Group" button
2. Type group name (e.g., COMSE-26)
3. Press Enter

### Filter Schedule
1. Use "Filter by Day" dropdown for specific days
2. Use "Filter by Teacher" to see one teacher's schedule

### Export Your Schedule
1. Click "Export" button
2. JSON file downloads automatically
3. Save for backup or sharing

### Import a Schedule
1. Click "Import" button
2. Select a JSON file
3. Schedule loads automatically

## 🔧 Customization

### Change Your Groups
Edit `src/data/constants.js`:
```javascript
export const UNIVERSITY_GROUPS = [
  'YOUR-GROUP-1',
  'YOUR-GROUP-2',
  // Add your groups here
];
```

### Change Time Slots
Edit `src/data/constants.js`:
```javascript
export const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  // Add your time slots
];
```

### Change Admin Password
Edit `src/data/constants.js`:
```javascript
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'your-new-password'
};
```

## 📱 Mobile Use
- Swipe horizontally to scroll through days
- Works best in landscape mode
- All features available on mobile

## 💾 Data Storage
- Automatically saves to browser
- Persists between sessions
- Export to backup your data

## ❓ Troubleshooting

**Schedule not saving?**
- Check if localStorage is enabled in browser
- Try a different browser

**Can't login?**
- Use credentials: admin / admin123
- Check for typos

**Can't see all time slots?**
- Scroll horizontally
- Try landscape mode on mobile

## 🔄 Next Steps: Backend Integration

Ready to add a backend? See `BACKEND_INTEGRATION.md` for:
- Database setup
- API endpoints
- Authentication
- Deployment

---

**Need help?** Check the full README.md for detailed documentation.
