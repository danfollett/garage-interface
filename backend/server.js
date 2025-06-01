const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 5000;

// Get network addresses
const getNetworkAddresses = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  return addresses;
};

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local network access
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/manuals', require('./routes/manuals'));
app.use('/api/videos', require('./routes/videos'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Create necessary directories
const createDirectories = () => {
  const dirs = [
    path.join(__dirname, '..', 'uploads'),
    path.join(__dirname, '..', 'uploads', 'vehicles'),
    path.join(__dirname, '..', 'uploads', 'manuals'),
    path.join(__dirname, '..', 'uploads', 'videos')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
};

createDirectories();

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📁 Uploads directory: ${path.join(__dirname,  '..', 'uploads')}`);
  console.log(`💾 Database location: ${path.join(__dirname,  '..', 'garage.db')}`);
  
  const addresses = getNetworkAddresses();
  console.log('\n🌐 Access your garage interface at:');
  console.log(`   Local:    http://localhost:${PORT}`);
  addresses.forEach(addr => {
    console.log(`   Network:  http://${addr}:${PORT}`);
  });
  console.log('\n📱 To access from other devices, use the Network address\n');
});