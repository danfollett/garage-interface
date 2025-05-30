import React, { useState, useEffect } from 'react';
import { Plus, Wrench, Calendar, DollarSign, Gauge, Edit2, Trash2 } from 'lucide-react';
import MaintenanceForm from './MaintenanceForm';
import TagBadge from './TagBadge';
import { maintenanceAPI } from '../services/api';
import { formatDate, formatCurrency, formatMileage } from '../utils/constants';

const MaintenanceLog = ({ logs, vehicleId, onDelete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [tags, setTags] = useState([]);
  const [costSummary, setCostSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTags();
    fetchCostSummary();
  }, [vehicleId]);

  const fetchTags = async () => {
    try {
      const tagsData = await maintenanceAPI.getTags();
      setTags(tagsData);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const fetchCostSummary = async () => {
    try {
      const summary = await maintenanceAPI.getCostSummary(vehicleId);
      setCostSummary(summary);
    } catch (err) {
      console.error('Error fetching cost summary:', err);
    }
  };

  const handleQuickAdd = async (type) => {
    try {
      setLoading(true);
      await maintenanceAPI.quickAdd(vehicleId, type, null);
      onUpdate();
      fetchCostSummary();
    } catch (err) {
      console.error('Error adding maintenance:', err);
      alert('Failed to add maintenance: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log) => {
    setEditingLog(log);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLog(null);
  };

  const handleFormSubmit = () => {
    handleFormClose();
    onUpdate();
    fetchCostSummary();
  };

  if (logs.length === 0 && !showForm) {
    return (
      <div className="text-center py-12">
        <Wrench size={64} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg mb-6">No maintenance logs yet</p>
        
        {/* Quick Add Buttons */}
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Quick add common maintenance:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleQuickAdd('oil-change')}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Oil Change
            </button>
            <button
              onClick={() => handleQuickAdd('tire-rotation')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Tire Rotation
            </button>
            <button
              onClick={() => handleQuickAdd('inspection')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Inspection
            </button>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>Add Custom Maintenance</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {costSummary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {formatCurrency(costSummary.total_cost)}
            </p>
            <p className="text-sm text-gray-400">Total Cost</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {costSummary.total_logs}
            </p>
            <p className="text-sm text-gray-400">Total Services</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {formatCurrency(costSummary.average_cost)}
            </p>
            <p className="text-sm text-gray-400">Avg Cost</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">
              {costSummary.last_maintenance ? formatDate(costSummary.last_maintenance) : 'N/A'}
            </p>
            <p className="text-sm text-gray-400">Last Service</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Maintenance</span>
        </button>
        
        {/* Quick Add Buttons */}
        <button
          onClick={() => handleQuickAdd('oil-change')}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          + Oil Change
        </button>
        <button
          onClick={() => handleQuickAdd('tire-rotation')}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          + Tire Rotation
        </button>
      </div>

      {/* Maintenance Timeline */}
      <div className="space-y-4">
        {logs.map((log, index) => (
          <div
            key={log.id}
            className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-lg font-semibold">{log.description}</h3>
                  {log.tags && log.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Calendar size={16} />
                    <span>{formatDate(log.date)}</span>
                  </span>
                  
                  {log.mileage && (
                    <span className="flex items-center space-x-1">
                      <Gauge size={16} />
                      <span>{formatMileage(log.mileage)}</span>
                    </span>
                  )}
                  
                  {log.cost && (
                    <span className="flex items-center space-x-1">
                      <DollarSign size={16} />
                      <span>{formatCurrency(log.cost)}</span>
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(log)}
                  className="text-blue-500 hover:text-blue-400 p-2"
                  title="Edit"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => onDelete(log.id)}
                  className="text-red-500 hover:text-red-400 p-2"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            
            {/* Timeline Connector */}
            {index < logs.length - 1 && (
              <div className="mt-4 ml-4 border-l-2 border-gray-700 h-8" />
            )}
          </div>
        ))}
      </div>

      {/* Maintenance Form Modal */}
      {showForm && (
        <MaintenanceForm
          vehicleId={vehicleId}
          log={editingLog}
          tags={tags}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
};

export default MaintenanceLog;