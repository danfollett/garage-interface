const path = require('path');
require('dotenv').config();

// Determine if we're in Docker based on environment or file structure
const isDocker = process.env.DOCKER_ENV === 'true' || process.env.DATABASE_PATH;

module.exports = {
  // Server configuration
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // Database configuration
  database: {
    path: process.env.DATABASE_PATH || 
          (isDocker ? '/app/database.db' : path.join(__dirname, '..', '..', 'database.db'))
  },
  
  // Upload configuration
  upload: {
    path: process.env.UPLOAD_PATH || 
          (isDocker ? '/app/uploads' : path.join(__dirname, '..', '..', 'uploads')),
    maxFileSize: {
      image: 5 * 1024 * 1024, // 5MB
      manual: 50 * 1024 * 1024, // 50MB
      video: 500 * 1024 * 1024 // 500MB
    }
  },
  
  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'http://localhost:5000'],
    credentials: true
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret',
    bcryptRounds: 10
  },
  
  // Backup configuration
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    path: process.env.BACKUP_PATH || 
          (isDocker ? '/app/backups' : path.join(__dirname, '..', '..', 'backups')),
    schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // 2 AM daily
    retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30
  }
};