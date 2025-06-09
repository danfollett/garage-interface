import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileText, Video, Wrench, Plus, Car, Bike } from 'lucide-react';
import { vehicleAPI, manualAPI, videoAPI, maintenanceAPI } from '../services/api';
import { getVehicleDisplayName, formatDate, formatCurrency } from '../utils/constants';
import ManualViewer from '../components/ManualViewer';
import VideoPlayer from '../components/VideoPlayer';
import MaintenanceLog from '../components/MaintenanceLog';
import { getApiUrl } from '../utils/api-utils';

const VehicleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [manuals, setManuals] = useState([]);
  const [videos, setVideos] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [activeTab, setActiveTab] = useState('manuals');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchVehicleData();
  }, [id]);

  const fetchVehicleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [vehicleData, manualsData, videosData, maintenanceData] = await Promise.all([
        vehicleAPI.getById(id),
        manualAPI.getByVehicle(id),
        videoAPI.getByVehicle(id),
        maintenanceAPI.getByVehicle(id)
      ]);

      setVehicle(vehicleData);
      setManuals(manualsData);
      setVideos(videosData);
      setMaintenance(maintenanceData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching vehicle data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    try {
      await vehicleAPI.delete(id);
      navigate('/');
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      alert('Failed to delete vehicle: ' + err.message);
    }
  };

  const handleDeleteManual = async (manualId) => {
    if (window.confirm('Are you sure you want to delete this manual?')) {
      try {
        await manualAPI.delete(manualId);
        setManuals(manuals.filter(m => m.id !== manualId));
      } catch (err) {
        console.error('Error deleting manual:', err);
        alert('Failed to delete manual: ' + err.message);
      }
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await videoAPI.delete(videoId);
        setVideos(videos.filter(v => v.id !== videoId));
      } catch (err) {
        console.error('Error deleting video:', err);
        alert('Failed to delete video: ' + err.message);
      }
    }
  };

  const handleDeleteMaintenance = async (logId) => {
    if (window.confirm('Are you sure you want to delete this maintenance log?')) {
      try {
        await maintenanceAPI.delete(logId);
        setMaintenance(maintenance.filter(m => m.id !== logId));
      } catch (err) {
        console.error('Error deleting maintenance log:', err);
        alert('Failed to delete maintenance log: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl text-gray-400">Loading vehicle details...</div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">Error loading vehicle</p>
          <p className="text-gray-400 mb-4">{error || 'Vehicle not found'}</p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-2 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'manuals', label: 'Manuals', icon: FileText, count: manuals.length },
    { id: 'videos', label: 'Videos', icon: Video, count: videos.length },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, count: maintenance.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-garage-gray rounded-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors touch-target"
            >
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{getVehicleDisplayName(vehicle)}</h1>
              <p className="text-gray-400 capitalize">{vehicle.type}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to={`/edit-vehicle/${id}`}
              className="bg-blue-600 hover:bg-blue-700 p-2 rounded-lg transition-colors touch-target"
            >
              <Edit size={20} />
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-colors touch-target"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        {/* Vehicle Info Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vehicle Image */}
            <div className="lg:col-span-1">
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {vehicle.image_path ? (
                  <img
                    src={`${getApiUrl()}${vehicle.image_path}`}
                    alt={getVehicleDisplayName(vehicle)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {vehicle.type === 'car' ? (
                      <Car size={64} className="text-gray-600" />
                    ) : (
                      <Bike size={64} className="text-gray-600" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
                
                {vehicle.vin && (
                  <div>
                    <p className="text-sm text-gray-400">VIN</p>
                    <p className="font-mono">{vehicle.vin}</p>
                  </div>
                )}
                
                {vehicle.license_plate && (
                  <div>
                    <p className="text-sm text-gray-400">License Plate</p>
                    <p>{vehicle.license_plate}</p>
                  </div>
                )}
                
                {vehicle.color && (
                  <div>
                    <p className="text-sm text-gray-400">Color</p>
                    <p>{vehicle.color}</p>
                  </div>
                )}
                
                {vehicle.current_mileage && (
                  <div>
                    <p className="text-sm text-gray-400">Current Mileage</p>
                    <p>{vehicle.current_mileage.toLocaleString()} miles</p>
                  </div>
                )}
              </div>

              {/* Purchase & Insurance Info */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold mb-2">Purchase & Insurance</h3>
                
                {vehicle.purchase_date && (
                  <div>
                    <p className="text-sm text-gray-400">Purchase Date</p>
                    <p>{formatDate(vehicle.purchase_date)}</p>
                  </div>
                )}
                
                {vehicle.purchase_price && (
                  <div>
                    <p className="text-sm text-gray-400">Purchase Price</p>
                    <p>{formatCurrency(vehicle.purchase_price)}</p>
                  </div>
                )}
                
                {vehicle.insurance_policy && (
                  <div>
                    <p className="text-sm text-gray-400">Insurance Policy</p>
                    <p>{vehicle.insurance_policy}</p>
                  </div>
                )}
                
                {vehicle.insurance_expiry && (
                  <div>
                    <p className="text-sm text-gray-400">Insurance Expires</p>
                    <p className={new Date(vehicle.insurance_expiry) < new Date() ? 'text-red-500' : ''}>
                      {formatDate(vehicle.insurance_expiry)}
                    </p>
                  </div>
                )}
              </div>

              {/* Maintenance Summary */}
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-lg font-semibold mb-2">Maintenance Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-500">{maintenance.length}</p>
                    <p className="text-sm text-gray-400">Total Services</p>
                  </div>
                  
                  {maintenance.length > 0 && (
                    <>
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-2xl font-bold text-green-500">
                          {formatCurrency(maintenance.reduce((sum, log) => sum + (log.cost || 0), 0))}
                        </p>
                        <p className="text-sm text-gray-400">Total Cost</p>
                      </div>
                      
                      <div className="bg-gray-800 rounded-lg p-3">
                        <p className="text-2xl font-bold text-yellow-500">
                          {formatDate(maintenance[0].date)}
                        </p>
                        <p className="text-sm text-gray-400">Last Service</p>
                      </div>
                      
                      {maintenance[0].mileage && (
                        <div className="bg-gray-800 rounded-lg p-3">
                          <p className="text-2xl font-bold text-purple-500">
                            {maintenance[0].mileage.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-400">Last Service Miles</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Notes */}
              {vehicle.notes && (
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-300 whitespace-pre-wrap">{vehicle.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-garage-gray rounded-lg">
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 transition-colors touch-target ${
                  activeTab === tab.id
                    ? 'bg-garage-accent text-white'
                    : 'hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{tab.label}</span>
                <span className="bg-gray-700 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'manuals' && (
            <ManualViewer
              manuals={manuals}
              vehicleId={id}
              onDelete={handleDeleteManual}
              onUpdate={fetchVehicleData}
            />
          )}
          
          {activeTab === 'videos' && (
            <VideoPlayer
              videos={videos}
              vehicleId={id}
              onDelete={handleDeleteVideo}
              onUpdate={fetchVehicleData}
            />
          )}
          
          {activeTab === 'maintenance' && (
            <MaintenanceLog
              logs={maintenance}
              vehicleId={id}
              onDelete={handleDeleteMaintenance}
              onUpdate={fetchVehicleData}
            />
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-garage-gray rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Vehicle?</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this vehicle? This will also delete all associated manuals, videos, and maintenance logs.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVehicle}
                className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleView;