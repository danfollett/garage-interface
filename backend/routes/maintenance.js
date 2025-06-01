const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');

// Get all maintenance logs
router.get('/', async (req, res) => {
  try {
    const logs = await Maintenance.getAll();
    res.json(logs);
  } catch (error) {
    console.error('Error fetching maintenance logs:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// Get recent maintenance logs
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const logs = await Maintenance.getRecent(limit);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent maintenance:', error);
    res.status(500).json({ error: 'Failed to fetch recent maintenance' });
  }
});

// Get maintenance cost summary
router.get('/cost-summary', async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const summary = await Maintenance.getCostSummary(vehicleId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching cost summary:', error);
    res.status(500).json({ error: 'Failed to fetch cost summary' });
  }
});

// Get maintenance logs by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date required' });
    }
    
    const logs = await Maintenance.getByDateRange(startDate, endDate);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching maintenance by date range:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// Get all maintenance tags
router.get('/tags', async (req, res) => {
  try {
    const tags = await Maintenance.getAllTags();
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create a new maintenance tag
router.post('/tags', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name required' });
    }
    
    const tagData = {
      name,
      color: color || '#6b7280',
      icon: icon || 'tag'
    };
    
    const newTag = await Maintenance.createTag(tagData);
    res.status(201).json(newTag);
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error.message === 'Tag name already exists') {
      res.status(409).json({ error: 'Tag name already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create tag' });
    }
  }
});

// Get maintenance logs by tag
router.get('/tags/:tagId/logs', async (req, res) => {
  try {
    const { tagId } = req.params;
    const logs = await Maintenance.getByTagId(tagId);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs by tag:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance logs' });
  }
});

// Get maintenance logs for a specific vehicle
router.get('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    const logs = await Maintenance.getByVehicleId(vehicleId);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching vehicle maintenance:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch maintenance logs' });
    }
  }
});

// Get single maintenance log
router.get('/:id', async (req, res) => {
  try {
    const log = await Maintenance.getById(req.params.id);
    res.json(log);
  } catch (error) {
    console.error('Error fetching maintenance log:', error);
    if (error.message === 'Maintenance log not found') {
      res.status(404).json({ error: 'Maintenance log not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch maintenance log' });
    }
  }
});

// Create a new maintenance log
router.post('/vehicle/:vehicleId', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { date, description, mileage, cost, tag_ids } = req.body;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    // Validate required fields
    if (!date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }
    
    const logData = {
      vehicle_id: vehicleId,
      date,
      description,
      mileage: mileage ? parseInt(mileage) : null,
      cost: cost ? parseFloat(cost) : null,
      tag_ids: tag_ids || []
    };
    
    const newLog = await Maintenance.create(logData);
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error creating maintenance log:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to create maintenance log' });
    }
  }
});

// Update a maintenance log
router.put('/:id', async (req, res) => {
  try {
    const { date, description, mileage, cost, tag_ids } = req.body;
    const logId = req.params.id;
    
    // Get existing log
    const existingLog = await Maintenance.getById(logId);
    
    const logData = {
      date: date || existingLog.date,
      description: description || existingLog.description,
      mileage: mileage !== undefined ? (mileage ? parseInt(mileage) : null) : existingLog.mileage,
      cost: cost !== undefined ? (cost ? parseFloat(cost) : null) : existingLog.cost,
      tag_ids: tag_ids !== undefined ? tag_ids : existingLog.tags.map(t => t.id)
    };
    
    const updatedLog = await Maintenance.update(logId, logData);
    res.json(updatedLog);
  } catch (error) {
    console.error('Error updating maintenance log:', error);
    if (error.message === 'Maintenance log not found') {
      res.status(404).json({ error: 'Maintenance log not found' });
    } else {
      res.status(500).json({ error: 'Failed to update maintenance log' });
    }
  }
});

// Delete a maintenance log
router.delete('/:id', async (req, res) => {
  try {
    const logId = req.params.id;
    await Maintenance.delete(logId);
    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance log:', error);
    if (error.message === 'Maintenance log not found') {
      res.status(404).json({ error: 'Maintenance log not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete maintenance log' });
    }
  }
});

// Quick add common maintenance (convenience endpoint)
router.post('/vehicle/:vehicleId/quick-add', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { type, mileage } = req.body;
    
    // Verify vehicle exists
    await Vehicle.getById(vehicleId);
    
    // Define common maintenance templates
    const templates = {
      'oil-change': {
        description: 'Oil Change',
        tag_names: ['Oil Change']
      },
      'tire-rotation': {
        description: 'Tire Rotation',
        tag_names: ['Tire Rotation']
      },
      'brake-service': {
        description: 'Brake Service',
        tag_names: ['Brake Service']
      },
      'inspection': {
        description: 'Vehicle Inspection',
        tag_names: ['Inspection']
      }
    };
    
    const template = templates[type];
    if (!template) {
      return res.status(400).json({ error: 'Invalid maintenance type' });
    }
    
    // Get tag IDs
    const tags = await Maintenance.getAllTags();
    const tag_ids = tags
      .filter(tag => template.tag_names.includes(tag.name))
      .map(tag => tag.id);
    
    const logData = {
      vehicle_id: vehicleId,
      date: new Date().toISOString().split('T')[0], // Today's date
      description: template.description,
      mileage: mileage ? parseInt(mileage) : null,
      cost: null,
      tag_ids
    };
    
    const newLog = await Maintenance.create(logData);
    res.status(201).json(newLog);
  } catch (error) {
    console.error('Error quick adding maintenance:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to create maintenance log' });
    }
  }
});

// Get last oil change for a vehicle
router.get('/vehicle/:vehicleId/last-oil-change', async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const lastOilChange = await Maintenance.getLastOilChange(vehicleId);
    res.json(lastOilChange);
  } catch (error) {
    console.error('Error fetching last oil change:', error);
    res.status(500).json({ error: 'Failed to fetch last oil change' });
  }
});

module.exports = router;
