const express = require('express');
const router = express.Router();
const Manual = require('../models/Manual');
const Vehicle = require('../models/Vehicle');
const { uploadManual } = require('../config/multer');
const path = require('path');
const fs = require('fs');

// Get all manuals
router.get('/', async (req, res) => {
  try {
    const manuals = await Manual.getAll();
    res.json(manuals);
  } catch (error) {
    console.error('Error fetching manuals:', error);
    res.status(500).json({ error: 'Failed to fetch manuals' });
  }
});

// Get recent manuals
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const manuals = await Manual.getRecent(limit);
    res.json(manuals);
  } catch (error) {
    console.error('Error fetching recent manuals:', error);
    res.status(500).json({ error: 'Failed to fetch recent manuals' });
  }
});

// Get manual count by vehicle type
router.get('/count-by-type', async (req, res) => {
  try {
    const counts = await Manual.getCountByType();
    res.json(counts);
  } catch (error) {
    console.error('Error fetching manual counts:', error);
    res.status(500).json({ error: 'Failed to fetch manual counts' });
  }
});

// Search manuals
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const manuals = await Manual.search(q);
    res.json(manuals);
  } catch (error) {
    console.error('Error searching manuals:', error);
    res.status(500).json({ error: 'Failed to search manuals' });
  }
});

// Get manuals for a specific vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    const manuals = await Manual.getByVehicleId(vehicleId);
    res.json(manuals);
  } catch (error) {
    console.error('Error fetching vehicle manuals:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch manuals' });
    }
  }
});

// Get single manual
router.get('/:id', async (req, res) => {
  try {
    const manual = await Manual.getById(req.params.id);
    res.json(manual);
  } catch (error) {
    console.error('Error fetching manual:', error);
    if (error.message === 'Manual not found') {
      res.status(404).json({ error: 'Manual not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch manual' });
    }
  }
});

// Upload manual for a vehicle
router.post('/vehicle/:vehicleId', uploadManual.single('manual'), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { title } = req.body;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Manual file required' });
    }
    
    // Use original filename as title if not provided
    const manualTitle = title || path.basename(req.file.originalname, path.extname(req.file.originalname));
    
    const manualData = {
      vehicle_id: vehicleId,
      title: manualTitle,
      file_path: `/uploads/manuals/${req.file.filename}`,
      file_type: 'pdf'
    };
    
    const newManual = await Manual.create(manualData);
    res.status(201).json(newManual);
  } catch (error) {
    console.error('Error uploading manual:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'manuals', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to upload manual' });
    }
  }
});

// Update manual title
router.put('/:id', async (req, res) => {
  try {
    const { title } = req.body;
    const manualId = req.params.id;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const updatedManual = await Manual.update(manualId, { title });
    res.json(updatedManual);
  } catch (error) {
    console.error('Error updating manual:', error);
    if (error.message === 'Manual not found') {
      res.status(404).json({ error: 'Manual not found' });
    } else {
      res.status(500).json({ error: 'Failed to update manual' });
    }
  }
});

// Delete a manual
router.delete('/:id', async (req, res) => {
  try {
    const manualId = req.params.id;
    
    // Get manual to delete file
    const manual = await Manual.getById(manualId);
    
    // Delete from database
    await Manual.delete(manualId);
    
    // Delete file from filesystem
    if (manual.file_path) {
      const filePath = path.join(__dirname, '..', '..', manual.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.json({ message: 'Manual deleted successfully' });
  } catch (error) {
    console.error('Error deleting manual:', error);
    if (error.message === 'Manual not found') {
      res.status(404).json({ error: 'Manual not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete manual' });
    }
  }
});

// Download a manual file
router.get('/:id/download', async (req, res) => {
  try {
    const manual = await Manual.getById(req.params.id);
    const filePath = path.join(__dirname, '..', '..', manual.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Manual file not found' });
    }
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${manual.title}.pdf"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading manual:', error);
    if (error.message === 'Manual not found') {
      res.status(404).json({ error: 'Manual not found' });
    } else {
      res.status(500).json({ error: 'Failed to download manual' });
    }
  }
});

module.exports = router;