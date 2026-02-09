// src/data/constants.js

export const UNIVERSITY_GROUPS = [
  'COMSE-25', 'COMCEH-25', 'COMFCI-25', 'COMCEH-24',
  'COMSE-24', 'COMFCI-24', 'COMSEH-23', 'COMSE-23/1-Group',
  'COMSE-23/2-Group', 'COMFCI-23', 'COM-22/1-Group',
  'COM-22/2-Group', 'MATDAIS-25', 'MATMIE-25',
  'MATDAIS-24', 'MATMIE-24', 'MATDAIS-23', 'MATMIE-23',
  'MATH-22', 'EEAIR-25', 'IEMIT-25', 'EEAIR-24',
  'IEMIT-24', 'EEAIR-23', 'IEMIT-23'
];

export const TIME_SLOTS = [
  '08:00', '08:45', '09:30', '10:15', '11:00', '11:45',
  '12:30', '13:10', '14:00', '14:45', '15:30', '16:15',
  '17:00', '17:45'
];

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default admin credentials (in production, this should be handled by backend)
export const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123' // CHANGE THIS IN PRODUCTION
};
