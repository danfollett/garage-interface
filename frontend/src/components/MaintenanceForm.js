import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Gauge, Tag } from 'lucide-react';
import { maintenanceAPI } from '../services/api';
import TagBadge from './TagBadge';

const MaintenanceForm = ({ vehicleId, log, tags, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    mileage: '',
    cost: '',
    tag_ids: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (log) {
      // Editing existing log
      setFormData({
        date: log.date,
        description: log.description,
        mileage: log.mileage || '',
        cost: log.cost || '',
        tag_ids: log.tags ? log.tags.map(t => t.id) : []
      });
    } else {
      // New log - set today's date
      setFormData(prev => ({
        ...prev,
        date: new Date().toISOString().split('T')[0]
      }));
    }
  }, [log]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.date || !formData.description) {
      setError('Date and description are required');
      return;
    }

    try {
      setLoading(true);
      
      const data = {
        ...formData,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null
      };

      if (log) {
        // Update existing
        await maintenanceAPI.update(log.id, data);
      } else {
        // Create new
        await maintenanceAPI.create(vehicleId, data);
      }
      
      onSubmit();
    } catch (err) {
      console.error('Error saving maintenance:', err);
      setError(err.message || 'Failed to save maintenance log');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-garage-gray rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">
            {log ? 'Edit Maintenance' : 'Add Maintenance'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white touch-target"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {error && (
            <div className="bg-red-500 bg-opacity-20 text-red-500 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Calendar size={16} />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was done?"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
              required
            />
          </div>

          {/* Mileage */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Gauge size={16} />
              <span>Mileage (optional)</span>
            </label>
            <input
              type="number"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
              placeholder="Current mileage"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <DollarSign size={16} />
              <span>Cost (optional)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              placeholder="0.00"
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-garage-accent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <Tag size={16} />
              <span>Tags</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`transition-all ${
                    formData.tag_ids.includes(tag.id)
                      ? 'ring-2 ring-white'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <TagBadge tag={tag} size="md" />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (log ? 'Update' : 'Add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceForm;