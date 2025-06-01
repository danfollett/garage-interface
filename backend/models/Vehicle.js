const db = require('../database');

class Vehicle {
  // Get all vehicles grouped by type
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, 
               COUNT(DISTINCT m.id) as manual_count,
               COUNT(DISTINCT vid.id) as video_count,
               COUNT(DISTINCT ml.id) as maintenance_count
        FROM vehicles v
        LEFT JOIN manuals m ON v.id = m.vehicle_id
        LEFT JOIN videos vid ON v.id = vid.vehicle_id
        LEFT JOIN maintenance_logs ml ON v.id = ml.vehicle_id
        GROUP BY v.id
        ORDER BY v.type, v.year DESC, v.make, v.model
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Group vehicles by type
          const grouped = {
            bike: [],
            motorcycle: [],
            car: []
          };
          
          rows.forEach(row => {
            if (grouped[row.type]) {
              grouped[row.type].push(row);
            }
          });
          
          resolve(grouped);
        }
      });
    });
  }

  // Get a single vehicle by ID with all related data
  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM vehicles WHERE id = ?
      `;
      
      db.get(query, [id], (err, vehicle) => {
        if (err) {
          reject(err);
        } else if (!vehicle) {
          reject(new Error('Vehicle not found'));
        } else {
          resolve(vehicle);
        }
      });
    });
  }

  // Create a new vehicle
  static create(vehicleData) {
    return new Promise((resolve, reject) => {
      const { type, make, model, year, vin, color, purchase_date, purchase_price, current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes, image_path } = vehicleData;
      const query = `
        INSERT INTO vehicles (type, make, model, year, vin, color, purchase_date, purchase_price, current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes, image_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [type, make, model, year, vin, color, purchase_date, purchase_price, current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes, image_path], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            type,
            make,
            model,
            year,
            vin,
            color,
            purchase_date,
            purchase_price,
            current_mileage,
            license_plate,
            insurance_policy,
            insurance_expiry,
            oil_type, 
            oil_change_interval_miles, 
            oil_change_interval_months,
            notes,
            image_path
          });
        }
      });
    });
  }

  // Update a vehicle
  static update(id, vehicleData) {
    return new Promise((resolve, reject) => {
      const { type, make, model, year, vin, color, purchase_date, purchase_price, current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes, image_path } = vehicleData;
      const query = `
        UPDATE vehicles 
        SET type = ?, make = ?, model = ?, year = ?, vin = ?, color = ?, purchase_date = ?, purchase_price = ?, current_mileage = ?, license_plate = ?, insurance_policy = ?, insurance_expiry = ?, oil_type = ?, oil_change_interval_miles = ?, oil_change_interval_months = ?, notes = ?, image_path = ?
        WHERE id = ?
      `;
      
      db.run(query, [type, make, model, year, vin, color, purchase_date, purchase_price, current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes, image_path, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Vehicle not found'));
        } else {
          resolve({ id, ...vehicleData });
        }
      });
    });
  }

  // Delete a vehicle (cascades to related records)
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM vehicles WHERE id = ?`;
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Vehicle not found'));
        } else {
          resolve({ message: 'Vehicle deleted successfully' });
        }
      });
    });
  }

  // Get vehicles by type
  static getByType(type) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, 
               COUNT(DISTINCT m.id) as manual_count,
               COUNT(DISTINCT vid.id) as video_count,
               COUNT(DISTINCT ml.id) as maintenance_count
        FROM vehicles v
        LEFT JOIN manuals m ON v.id = m.vehicle_id
        LEFT JOIN videos vid ON v.id = vid.vehicle_id
        LEFT JOIN maintenance_logs ml ON v.id = ml.vehicle_id
        WHERE v.type = ?
        GROUP BY v.id
        ORDER BY v.year DESC, v.make, v.model
      `;
      
      db.all(query, [type], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Search vehicles
  static search(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM vehicles
        WHERE make LIKE ? OR model LIKE ? OR year LIKE ?
        ORDER BY type, year DESC, make, model
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

  // Get recent vehicles (for dashboard)
  static getRecent(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM vehicles
        ORDER BY created_at DESC
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

  // Get vehicle statistics
  static getStats() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(CASE WHEN type = 'bike' THEN 1 END) as bike_count,
          COUNT(CASE WHEN type = 'motorcycle' THEN 1 END) as motorcycle_count,
          COUNT(CASE WHEN type = 'car' THEN 1 END) as car_count,
          COUNT(*) as total_count,
          (SELECT COUNT(*) FROM manuals) as total_manuals,
          (SELECT COUNT(*) FROM videos) as total_videos,
          (SELECT COUNT(*) FROM maintenance_logs) as total_maintenance
        FROM vehicles
      `;
      
      db.get(query, [], (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats);
        }
      });
    });
  }
}

module.exports = Vehicle;
