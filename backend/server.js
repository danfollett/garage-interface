const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Import routes
const vehicleRoutes = require('./routes/vehicles');
const manualRoutes = require('./routes/manuals');
const videoRoutes = require('./routes/videos');
const maintenanceRoutes = require('./routes/maintenance');

// API Routes
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/manuals', manualRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Basic test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Garage Interface API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});