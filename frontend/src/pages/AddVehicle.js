 import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Car, Bike, X } from 'lucide-react';
import { vehicleAPI } from '../services/api';
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, ACCEPTED_FILE_TYPES, FILE_SIZE_LIMITS } from '../utils/constants';

const AddVehicle = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = !!id;
  
  const defaultType = searchParams.get('type') || VEHICLE_TYPES.CAR;
  
  const [formData, setFormData] = useState({
    type: defaultType,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    color: '',
    purchase_date: '',
    purchase_price: '',
    current_mileage: '',
    license_plate: '',
    insurance_policy: '',
    insurance_expiry: '',
    oil_type:'',
    oil_change_interval_miles:'',
    oil_change_interval_months:'',
    notes: ''
  });
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const vehicle = await vehicleAPI.getById(id);
      setFormData({
        type: vehicle.type,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year || new Date().getFullYear(),
        vin: vehicle.vin || '',
        color: vehicle.color || '',
        purchase_date: vehicle.purchase_date || '',
        purchase_price: vehicle.purchase_price || '',
        current_mileage: vehicle.current_mileage || '',
        license_plate: vehicle.license_plate || '',
        insurance_policy: vehicle.insurance_policy || '',
        insurance_expiry: vehicle.insurance_expiry || '',
        oil_type: vehicle.insurance_expiry || '',
        oil_change_interval_miles: vehicle.oil_change_interval_miles|| '',
        oil_change_interval_months: vehicle.oil_change_interval_months || '',
        notes: vehicle.notes || ''
      });
      if (vehicle.image_path) {
        setExistingImage(`http://localhost:5000${vehicle.image_path}`);
      }
    } catch (err) {
      console.error('Error fetching vehicle:', err);
      setError('Failed to load vehicle data');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size
    if (file.size > FILE_SIZE_LIMITS.IMAGE) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.make || !formData.model) {
      setError('Make and model are required');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('type', formData.type);
    formDataToSend.append('make', formData.make);
    formDataToSend.append('model', formData.model);
    formDataToSend.append('year', formData.year);
    formDataToSend.append('vin', formData.vin);
    formDataToSend.append('color', formData.color);
    formDataToSend.append('purchase_date', formData.purchase_date);
    formDataToSend.append('purchase_price', formData.purchase_price);
    formDataToSend.append('current_mileage', formData.current_mileage);
    formDataToSend.append('license_plate', formData.license_plate);
    formDataToSend.append('insurance_policy', formData.insurance_policy);
    formDataToSend.append('insurance_expiry', formData.insurance_expiry);
    formDataToSend.append('oil_type', formData.oil_type);
    formDataToSend.append('oil_change_interval_miles', formData.oil_change_interval_miles);
    formDataToSend.append('oil_change_interval_months', formData.oil_change_interval_months);
    formDataToSend.append('notes', formData.notes);
    
    if (imageFile) {
      formDataToSend.append('image', imageFile);
    }

    try {
      setSaving(true);
      
      let vehicleId;
      if (isEditing) {
        await vehicleAPI.update(id, formDataToSend);
        vehicleId = id;
      } else {
        const result = await vehicleAPI.create(formDataToSend);
        vehicleId = result.id;
      }
      
      // Navigate to the vehicle detail page
      navigate(`/vehicle/${vehicleId}`);
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(err.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    // Clear file input
    const fileInput = document.getElementById('image-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl text-gray-400">Loading vehicle details...</div>
      </div>
    );
  }

  const VehicleIcon = formData.type === VEHICLE_TYPES.CAR ? Car : Bike;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-garage-gray rounded-lg p-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link
            to={isEditing ? `/vehicle/${id}` : '/'}
            className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors touch-target"
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500 bg-opacity-20 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Vehicle Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(VEHICLE_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, type })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type
                      ? 'border-garage-accent bg-garage-accent bg-opacity-20'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="text-center">
                    {type === VEHICLE_TYPES.CAR ? (
                      <Car size={32} className="mx-auto mb-2" />
                    ) : (
                      <Bike size={32} className="mx-auto mb-2" />
                    )}
                    <span className="font-medium">{label.slice(0, -1)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Make */}
          <div>
            <label htmlFor="make" className="block text-sm font-medium mb-2">
              Make <span className="text-red-500">*</span>
            </label>
            <input
              id="make"
              type="text"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g., Honda, Ford, Trek"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
              required
            />
          </div>

          {/* Model */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium mb-2">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g., Civic, F-150, Marlin"
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
              required
            />
          </div>

          {/* Year */}
          <div>
            <label htmlFor="year" className="block text-sm font-medium mb-2">
              Year
            </label>
            <input
              id="year"
              type="number"
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
            />
          </div>

          {/* Additional Information Section */}
          <div className="col-span-2 border-t border-gray-700 pt-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* VIN */}
              <div>
                <label htmlFor="vin" className="block text-sm font-medium mb-2">
                  VIN
                </label>
                <input
                  id="vin"
                  type="text"
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  placeholder="Vehicle Identification Number"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Color */}
              <div>
                <label htmlFor="color" className="block text-sm font-medium mb-2">
                  Color
                </label>
                <input
                  id="color"
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="e.g., Silver, Red, Black"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Purchase Date */}
              <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium mb-2">
                  Purchase Date
                </label>
                <input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Purchase Price */}
              <div>
                <label htmlFor="purchase_price" className="block text-sm font-medium mb-2">
                  Purchase Price
                </label>
                <input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Current Mileage */}
              <div>
                <label htmlFor="current_mileage" className="block text-sm font-medium mb-2">
                  Current Mileage
                </label>
                <input
                  id="current_mileage"
                  type="number"
                  value={formData.current_mileage}
                  onChange={(e) => setFormData({ ...formData, current_mileage: e.target.value })}
                  placeholder="0"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* License Plate */}
              <div>
                <label htmlFor="license_plate" className="block text-sm font-medium mb-2">
                  License Plate
                </label>
                <input
                  id="license_plate"
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                  placeholder="ABC-1234"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Insurance Policy */}
              <div>
                <label htmlFor="insurance_policy" className="block text-sm font-medium mb-2">
                  Insurance Policy Number
                </label>
                <input
                  id="insurance_policy"
                  type="text"
                  value={formData.insurance_policy}
                  onChange={(e) => setFormData({ ...formData, insurance_policy: e.target.value })}
                  placeholder="Policy number"
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>

              {/* Insurance Expiry */}
              <div>
                <label htmlFor="insurance_expiry" className="block text-sm font-medium mb-2">
                  Insurance Expiry Date
                </label>
                <input
                  id="insurance_expiry"
                  type="date"
                  value={formData.insurance_expiry}
                  onChange={(e) => setFormData({ ...formData, insurance_expiry: e.target.value })}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>
                {/* Oil Change Information - Only for cars and motorcycles */}
                {(formData.type === 'car' || formData.type === 'motorcycle') && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Oil Change Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Oil Type</label>
                        <input
                          type="text"
                          value={formData.oil_type}
                          onChange={(e) => setFormData({ ...formData, oil_type: e.target.value })}
                          placeholder="e.g., 5W-30"
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-garage-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Change Interval (Miles)</label>
                        <input
                          type="number"
                          value={formData.oil_change_interval_miles}
                          onChange={(e) => setFormData({ ...formData, oil_change_interval_miles: e.target.value })}
                          placeholder="e.g., 5000"
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-garage-accent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Change Interval (Months)</label>
                        <input
                          type="number"
                          value={formData.oil_change_interval_months}
                          onChange={(e) => setFormData({ ...formData, oil_change_interval_months: e.target.value })}
                          placeholder="e.g., 6"
                          className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-garage-accent"
                        />
                      </div>
                    </div>
                  </div>
                )}
              {/* Notes */}
              <div className="md:col-span-2">
                <label htmlFor="notes" className="block text-sm font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes about this vehicle..."
                  rows={4}
                  className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vehicle Image
            </label>
            
            {/* Image Preview */}
            {(imagePreview || existingImage) && (
              <div className="relative mb-4">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview || existingImage}
                    alt="Vehicle preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Upload Button */}
            {!imagePreview && (
              <label className="flex flex-col items-center justify-center w-full h-48 bg-gray-800 rounded-lg border-2 border-gray-700 border-dashed cursor-pointer hover:bg-gray-700 transition-colors">
                <VehicleIcon size={48} className="text-gray-600 mb-2" />
                <span className="text-gray-400 mb-1">Click to upload image</span>
                <span className="text-gray-500 text-sm">JPEG, PNG, GIF, WebP (Max 5MB)</span>
                <input
                  id="image-input"
                  type="file"
                  accept={ACCEPTED_FILE_TYPES.IMAGE}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            {/* Change Image Button */}
            {imagePreview && (
              <label className="inline-flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg cursor-pointer transition-colors mt-2">
                <Upload size={20} />
                <span>Change Image</span>
                <input
                  type="file"
                  accept={ACCEPTED_FILE_TYPES.IMAGE}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <Link
              to={isEditing ? `/vehicle/${id}` : '/'}
              className="flex-1 flex items-center justify-center bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save size={20} />
              <span>{saving ? 'Saving...' : (isEditing ? 'Update Vehicle' : 'Add Vehicle')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
