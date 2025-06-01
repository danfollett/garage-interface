const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(__dirname, process.env.DATABASE_PATH || '../database/garage.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Initialize database schema
const initDatabase = () => {
  db.serialize(() => {
    // Vehicles table
    db.run(`
      CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('bike', 'motorcycle', 'car')),
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER,
    vin TEXT,
    color TEXT,
    purchase_date DATE,
    purchase_price REAL,
    current_mileage INTEGER,
    license_plate TEXT,
    insurance_policy TEXT,
    insurance_expiry DATE,
    notes TEXT,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
    `);

    // Service manuals table
    db.run(`
      CREATE TABLE IF NOT EXISTS manuals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);

    // Videos table
    db.run(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT CHECK(type IN ('local', 'youtube')) NOT NULL,
        path_or_url TEXT NOT NULL,
        thumbnail_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);

    // Maintenance logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vehicle_id INTEGER NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        mileage INTEGER,
        cost DECIMAL(10,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      )
    `);

    // Maintenance tags table
    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#6b7280',
        icon TEXT
      )
    `);

    // Junction table for maintenance logs and tags
    db.run(`
      CREATE TABLE IF NOT EXISTS maintenance_log_tags (
        log_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (log_id, tag_id),
        FOREIGN KEY (log_id) REFERENCES maintenance_logs(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES maintenance_tags(id) ON DELETE CASCADE
      )
    `);

    // Insert default maintenance tags
    const defaultTags = [
      { name: 'Oil Change', color: '#f59e0b', icon: 'droplet' },
      { name: 'Tire Rotation', color: '#3b82f6', icon: 'refresh-cw' },
      { name: 'Brake Service', color: '#ef4444', icon: 'disc' },
      { name: 'Filter Replacement', color: '#8b5cf6', icon: 'wind' },
      { name: 'Battery', color: '#10b981', icon: 'battery' },
      { name: 'Inspection', color: '#6366f1', icon: 'search' },
      { name: 'Fluid Check', color: '#06b6d4', icon: 'droplets' },
      { name: 'Tune Up', color: '#ec4899', icon: 'wrench' },
      { name: 'Chain/Belt', color: '#84cc16', icon: 'link' },
      { name: 'Electrical', color: '#f97316', icon: 'zap' }
    ];

    const insertTag = db.prepare(`
      INSERT OR IGNORE INTO maintenance_tags (name, color, icon) 
      VALUES (?, ?, ?)
    `);

    defaultTags.forEach(tag => {
      insertTag.run(tag.name, tag.color, tag.icon);
    });

    insertTag.finalize();

    console.log('Database initialized successfully!');
  });
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initDatabase();
  
  // Close database after initialization
  setTimeout(() => {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed.');
      }
    });
  }, 1000);
}

// Export database connection for use in other modules
module.exports = db;