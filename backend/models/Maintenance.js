const db = require('../database');

class Maintenance {
  // Get all maintenance logs for a vehicle
  static getByVehicleId(vehicleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        WHERE ml.vehicle_id = ?
        GROUP BY ml.id
        ORDER BY ml.date DESC, ml.created_at DESC
      `;
      
      db.all(query, [vehicleId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse tags JSON
          const logs = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(`[${row.tags}]`) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // Get a single maintenance log by ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        WHERE ml.id = ?
        GROUP BY ml.id
      `;
      
      db.get(query, [id], (err, log) => {
        if (err) {
          reject(err);
        } else if (!log) {
          reject(new Error('Maintenance log not found'));
        } else {
          // Parse tags JSON
          log.tags = log.tags ? JSON.parse(`[${log.tags}]`) : [];
          resolve(log);
        }
      });
    });
  }

  // Create a new maintenance log
  static create(logData) {
    return new Promise((resolve, reject) => {
      const { vehicle_id, date, description, mileage, cost, tag_ids = [] } = logData;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Insert maintenance log
        const query = `
          INSERT INTO maintenance_logs (vehicle_id, date, description, mileage, cost)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(query, [vehicle_id, date, description, mileage, cost], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          const logId = this.lastID;
          
          // Insert tag associations
          if (tag_ids.length > 0) {
            const tagInserts = tag_ids.map(() => '(?, ?)').join(', ');
            const tagQuery = `INSERT INTO maintenance_log_tags (log_id, tag_id) VALUES ${tagInserts}`;
            const tagValues = tag_ids.flatMap(tagId => [logId, tagId]);
            
            db.run(tagQuery, tagValues, (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              db.run('COMMIT');
              resolve({ id: logId, ...logData });
            });
          } else {
            db.run('COMMIT');
            resolve({ id: logId, ...logData });
          }
        });
      });
    });
  }

  // Update a maintenance log
  static update(id, logData) {
    return new Promise((resolve, reject) => {
      const { date, description, mileage, cost, tag_ids = [] } = logData;
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update maintenance log
        const query = `
          UPDATE maintenance_logs 
          SET date = ?, description = ?, mileage = ?, cost = ?
          WHERE id = ?
        `;
        
        db.run(query, [date, description, mileage, cost, id], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          if (this.changes === 0) {
            db.run('ROLLBACK');
            reject(new Error('Maintenance log not found'));
            return;
          }
          
          // Delete existing tag associations
          db.run('DELETE FROM maintenance_log_tags WHERE log_id = ?', [id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Insert new tag associations
            if (tag_ids.length > 0) {
              const tagInserts = tag_ids.map(() => '(?, ?)').join(', ');
              const tagQuery = `INSERT INTO maintenance_log_tags (log_id, tag_id) VALUES ${tagInserts}`;
              const tagValues = tag_ids.flatMap(tagId => [id, tagId]);
              
              db.run(tagQuery, tagValues, (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }
                
                db.run('COMMIT');
                resolve({ id, ...logData });
              });
            } else {
              db.run('COMMIT');
              resolve({ id, ...logData });
            }
          });
        });
      });
    });
  }

  // Delete a maintenance log
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM maintenance_logs WHERE id = ?`;
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Maintenance log not found'));
        } else {
          resolve({ message: 'Maintenance log deleted successfully' });
        }
      });
    });
  }

  // Get all maintenance logs
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        GROUP BY ml.id
        ORDER BY ml.date DESC, ml.created_at DESC
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse tags JSON
          const logs = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(`[${row.tags}]`) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // Get maintenance logs by date range
  static getByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        WHERE ml.date BETWEEN ? AND ?
        GROUP BY ml.id
        ORDER BY ml.date DESC
      `;
      
      db.all(query, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse tags JSON
          const logs = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(`[${row.tags}]`) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // Get recent maintenance logs
  static getRecent(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        GROUP BY ml.id
        ORDER BY ml.date DESC, ml.created_at DESC
        LIMIT ?
      `;
      
      db.all(query, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
        // Parse tags JSON
          const logs = rows.map(row => ({
            ...row,
            tags: row.tags ? JSON.parse(`[${row.tags}]`) : []
          }));
          resolve(logs);
        }
      });
    });
  }

  // Get maintenance cost summary
  static getCostSummary(vehicleId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          COUNT(*) as total_logs,
          SUM(cost) as total_cost,
          AVG(cost) as average_cost,
          MIN(cost) as min_cost,
          MAX(cost) as max_cost,
          MIN(date) as first_maintenance,
          MAX(date) as last_maintenance
        FROM maintenance_logs
      `;
      
      const params = [];
      if (vehicleId) {
        query += ' WHERE vehicle_id = ?';
        params.push(vehicleId);
      }
      
      db.get(query, params, (err, summary) => {
        if (err) {
          reject(err);
        } else {
          resolve(summary);
        }
      });
    });
  }

  // Get all maintenance tags
  static getAllTags() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT mt.*, COUNT(mlt.log_id) as usage_count
        FROM maintenance_tags mt
        LEFT JOIN maintenance_log_tags mlt ON mt.id = mlt.tag_id
        GROUP BY mt.id
        ORDER BY mt.name
      `;
      
      db.all(query, [], (err, tags) => {
        if (err) {
          reject(err);
        } else {
          resolve(tags);
        }
      });
    });
  }

  // Create a new tag
  static createTag(tagData) {
    return new Promise((resolve, reject) => {
      const { name, color, icon } = tagData;
      const query = `
        INSERT INTO maintenance_tags (name, color, icon)
        VALUES (?, ?, ?)
      `;
      
      db.run(query, [name, color, icon], function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('Tag name already exists'));
          } else {
            reject(err);
          }
        } else {
          resolve({
            id: this.lastID,
            name,
            color,
            icon
          });
        }
      });
    });
  }

  // Get logs by tag
  static getByTagId(tagId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          ml.*,
          v.make, v.model, v.year, v.type as vehicle_type,
          GROUP_CONCAT(
            json_object(
              'id', mt.id,
              'name', mt.name,
              'color', mt.color,
              'icon', mt.icon
            )
          ) as tags
        FROM maintenance_logs ml
        JOIN vehicles v ON ml.vehicle_id = v.id
        JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        WHERE ml.id IN (
          SELECT log_id FROM maintenance_log_tags WHERE tag_id = ?
        )
        GROUP BY ml.id
        ORDER BY ml.date DESC
      `;
      
      db.all(query, [tagId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse tags JSON
          const logs = rows.map(row => ({
            ...row,
            tags: row.tags ? row.tags.split(',').map(tag => JSON.parse(tag)) : []
          }));
          resolve(logs);
        }
      });
    });
  }
    // Get last oil change for a vehicle
  static getLastOilChange(vehicleId) {
    return new Promise((resolve, reject) => {
      const query = `
       SELECT ml.*
        FROM maintenance_logs ml
        LEFT JOIN maintenance_log_tags mlt ON ml.id = mlt.log_id
        LEFT JOIN maintenance_tags mt ON mlt.tag_id = mt.id
        WHERE ml.vehicle_id = ?
          AND (
            LOWER(ml.description) LIKE '%oil change%'
            OR LOWER(mt.name) LIKE '%oil%'
          )
        ORDER BY ml.date DESC, ml.id DESC
        LIMIT 1;
      `;
      
      db.get(query, [vehicleId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }
}

module.exports = Maintenance;
