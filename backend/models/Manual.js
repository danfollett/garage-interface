const db = require('../database');

class Manual {
  // Get all manuals for a vehicle
  static getByVehicleId(vehicleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, v.make, v.model, v.year, v.type
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.vehicle_id = ?
        ORDER BY m.created_at DESC
      `;
      
      db.all(query, [vehicleId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get a single manual by ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, v.make, v.model, v.year, v.type
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.id = ?
      `;
      
      db.get(query, [id], (err, manual) => {
        if (err) {
          reject(err);
        } else if (!manual) {
          reject(new Error('Manual not found'));
        } else {
          resolve(manual);
        }
      });
    });
  }

  // Create a new manual
  static create(manualData) {
    return new Promise((resolve, reject) => {
      const { vehicle_id, title, file_path, file_type } = manualData;
      const query = `
        INSERT INTO manuals (vehicle_id, title, file_path, file_type)
        VALUES (?, ?, ?, ?)
      `;
      
      db.run(query, [vehicle_id, title, file_path, file_type], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            vehicle_id,
            title,
            file_path,
            file_type
          });
        }
      });
    });
  }

  // Update a manual
  static update(id, manualData) {
    return new Promise((resolve, reject) => {
      const { title } = manualData;
      const query = `
        UPDATE manuals 
        SET title = ?
        WHERE id = ?
      `;
      
      db.run(query, [title, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Manual not found'));
        } else {
          resolve({ id, ...manualData });
        }
      });
    });
  }

  // Delete a manual
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM manuals WHERE id = ?`;
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Manual not found'));
        } else {
          resolve({ message: 'Manual deleted successfully' });
        }
      });
    });
  }

  // Get all manuals (for admin/overview)
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, v.make, v.model, v.year, v.type
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        ORDER BY m.created_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Search manuals
  static search(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, v.make, v.model, v.year, v.type
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        WHERE m.title LIKE ? OR v.make LIKE ? OR v.model LIKE ?
        ORDER BY m.created_at DESC
      `;
      
      const term = `%${searchTerm}%`;
      db.all(query, [term, term, term], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get recent manuals
  static getRecent(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT m.*, v.make, v.model, v.year, v.type
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        ORDER BY m.created_at DESC
        LIMIT ?
      `;
      
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get manual count by vehicle type
  static getCountByType() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.type, COUNT(m.id) as count
        FROM manuals m
        JOIN vehicles v ON m.vehicle_id = v.id
        GROUP BY v.type
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const counts = {
            bike: 0,
            motorcycle: 0,
            car: 0
          };
          
          rows.forEach(row => {
            counts[row.type] = row.count;
          });
          
          resolve(counts);
        }
      });
    });
  }
}

module.exports = Manual;