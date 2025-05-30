const db = require('../database');

class Video {
  // Get all videos for a vehicle
  static getByVehicleId(vehicleId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        WHERE v.vehicle_id = ?
        ORDER BY v.created_at DESC
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

  // Get a single video by ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        WHERE v.id = ?
      `;
      
      db.get(query, [id], (err, video) => {
        if (err) {
          reject(err);
        } else if (!video) {
          reject(new Error('Video not found'));
        } else {
          resolve(video);
        }
      });
    });
  }

  // Create a new video
  static create(videoData) {
    return new Promise((resolve, reject) => {
      const { vehicle_id, title, description, type, path_or_url, thumbnail_path } = videoData;
      const query = `
        INSERT INTO videos (vehicle_id, title, description, type, path_or_url, thumbnail_path)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      db.run(query, [vehicle_id, title, description, type, path_or_url, thumbnail_path], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            vehicle_id,
            title,
            description,
            type,
            path_or_url,
            thumbnail_path
          });
        }
      });
    });
  }

  // Update a video
  static update(id, videoData) {
    return new Promise((resolve, reject) => {
      const { title, description, thumbnail_path } = videoData;
      const query = `
        UPDATE videos 
        SET title = ?, description = ?, thumbnail_path = ?
        WHERE id = ?
      `;
      
      db.run(query, [title, description, thumbnail_path, id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Video not found'));
        } else {
          resolve({ id, ...videoData });
        }
      });
    });
  }

  // Delete a video
  static delete(id) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM videos WHERE id = ?`;
      
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Video not found'));
        } else {
          resolve({ message: 'Video deleted successfully' });
        }
      });
    });
  }

  // Get all videos
  static getAll() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        ORDER BY v.created_at DESC
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

  // Get videos by type (local or youtube)
  static getByType(type) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        WHERE v.type = ?
        ORDER BY v.created_at DESC
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

  // Search videos
  static search(searchTerm) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        WHERE v.title LIKE ? OR v.description LIKE ? OR vh.make LIKE ? OR vh.model LIKE ?
        ORDER BY v.created_at DESC
      `;
      
      const term = `%${searchTerm}%`;
      db.all(query, [term, term, term, term], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Get recent videos
  static getRecent(limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT v.*, vh.make, vh.model, vh.year, vh.type as vehicle_type
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        ORDER BY v.created_at DESC
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

  // Get video count by vehicle type
  static getCountByVehicleType() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT vh.type, COUNT(v.id) as count
        FROM videos v
        JOIN vehicles vh ON v.vehicle_id = vh.id
        GROUP BY vh.type
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

  // Get video count by video type
  static getCountByVideoType() {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT type, COUNT(id) as count
        FROM videos
        GROUP BY type
      `;
      
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const counts = {
            local: 0,
            youtube: 0
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

module.exports = Video;