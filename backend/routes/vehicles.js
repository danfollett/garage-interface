const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { uploadVehicleImage } = require('../config/multer');
const path = require('path');
const fs = require('fs');

// Get all vehicles grouped by type
router.get('/', async (req, res) => {
  try {
    const vehicles = await Vehicle.getAll();
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get vehicle statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Vehicle.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Search vehicles
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const vehicles = await Vehicle.search(q);
    res.json(vehicles);
  } catch (error) {
    console.error('Error searching vehicles:', error);
    res.status(500).json({ error: 'Failed to search vehicles' });
  }
});

// Get vehicles by type
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['bike', 'motorcycle', 'car'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }
    
    const vehicles = await Vehicle.getByType(type);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles by type:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.getById(req.params.id);
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
  }
});

// Create a new vehicle
router.post('/', uploadVehicleImage.single('image'), async (req, res) => {
  try {
    console.log('Received vehicle data:', req.body); // Debug log
    
    const { type, make, model, year, vin, color, purchase_date, purchase_price,
            current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months, notes } = req.body;
    
    // Validate required fields
    if (!type || !make || !model) {
      return res.status(400).json({ 
        error: 'Type, make, and model are required' 
      });
    }
    
    // Validate vehicle type
    const validTypes = ['bike', 'motorcycle', 'car'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid vehicle type' });
    }
    
    const vehicleData = {
      type,
      make,
      model,
      year: year ? parseInt(year) : null,
      vin: vin || null,
      color: color || null,
      purchase_date: purchase_date || null,
      purchase_price: purchase_price ? parseFloat(purchase_price) : null,
      current_mileage: current_mileage ? parseInt(current_mileage) : null,
      license_plate: license_plate || null,
      insurance_policy: insurance_policy || null,
      insurance_expiry: insurance_expiry || null,
      oil_type: oil_type || null,
      oil_change_interval_miles: oil_change_interval_miles ? parseInt(oil_change_interval_miles) : null,
      oil_change_interval_months: oil_change_interval_months ? parseInt(oil_change_interval_months) : null,
      notes: notes || null,
      image_path: req.file ? `/uploads/vehicles/${req.file.filename}` : null
    };
    
    console.log('Vehicle data to save:', vehicleData); // Debug log
    
    const newVehicle = await Vehicle.create(vehicleData);
    res.status(201).json(newVehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update a vehicle
router.put('/:id', uploadVehicleImage.single('image'), async (req, res) => {
  try {
    const { type, make, model, year, vin, color, purchase_date, purchase_price,
            current_mileage, license_plate, insurance_policy, insurance_expiry, oil_type, oil_change_interval_miles, oil_change_interval_months,notes } = req.body;
    const vehicleId = req.params.id;
    
    // Get existing vehicle first
    const existingVehicle = await Vehicle.getById(vehicleId);
    
    const vehicleData = {
      type: type || existingVehicle.type,
      make: make || existingVehicle.make,
      model: model || existingVehicle.model,
      year: year ? parseInt(year) : existingVehicle.year,
      vin: vin !== undefined ? vin : existingVehicle.vin,
      color: color !== undefined ? color : existingVehicle.color,
      purchase_date: purchase_date !== undefined ? purchase_date : existingVehicle.purchase_date,
      purchase_price: purchase_price !== undefined ? (purchase_price ? parseFloat(purchase_price) : null) : existingVehicle.purchase_price,
      current_mileage: current_mileage !== undefined ? (current_mileage ? parseInt(current_mileage) : null) : existingVehicle.current_mileage,
      license_plate: license_plate !== undefined ? license_plate : existingVehicle.license_plate,
      insurance_policy: insurance_policy !== undefined ? insurance_policy : existingVehicle.insurance_policy,
      insurance_expiry: insurance_expiry !== undefined ? insurance_expiry : existingVehicle.insurance_expiry,
      oil_type: oil_type !== undefined ? oil_type : existingVehicle.oil_type,
      oil_change_interval_miles: oil_change_interval_miles !== undefined ? (oil_change_interval_miles ? parseInt(oil_change_interval_miles) : null) : existingVehicle.oil_change_interval_miles,
      oil_change_interval_months: oil_change_interval_months !== undefined ? (oil_change_interval_months ? parseInt(oil_change_interval_months) : null) : existingVehicle.oil_change_interval_months,
      notes: notes !== undefined ? notes : existingVehicle.notes,
      image_path: req.file 
        ? `/uploads/vehicles/${req.file.filename} `
        : existingVehicle.image_path
    };
    
    // If new image uploaded, delete the old one if it exists
    if (req.file && existingVehicle.image_path) {
      const oldPath = path.join(__dirname, '..', '..', existingVehicle.image_path);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
    
    const updatedVehicle = await Vehicle.update(vehicleId, vehicleData);
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to update vehicle' });
    }
  }
});

// Delete a vehicle
router.delete('/:id', async (req, res) => {
  try {
    const vehicleId = req.params.id;
    
    // Get vehicle to delete associated image
    const vehicle = await Vehicle.getById(vehicleId);
    
    // Delete the vehicle (cascades to related records)
    await Vehicle.delete(vehicleId);
    
    // Delete associated image if it exists
    if (vehicle.image_path) {
      const imagePath = path.join(__dirname, '..', '..', vehicle.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    if (error.message === 'Vehicle not found') {
      res.status(404).json({ error: 'Vehicle not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  }
});

module.exports = router;
