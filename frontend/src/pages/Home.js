import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Wrench } from 'lucide-react';
import VehicleGrid from '../components/VehicleGrid';
import { vehicleAPI, maintenanceAPI } from '../services/api';
import { VEHICLE_TYPES, VEHICLE_TYPE_LABELS, VEHICLE_TYPE_COLORS } from '../utils/constants';

const Home = () => {
  const [vehicles, setVehicles] = useState({
    bike: [],
    motorcycle: [],
    car: []
  });
  const [stats, setStats] = useState(null);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [vehiclesData, statsData,maintenanceData] = await Promise.all([
        vehicleAPI.getAll(),
        vehicleAPI.getStats(),
      maintenanceAPI.getRecent()
      ]);

      setVehicles(vehiclesData);
      setStats(statsData);
      setRecentMaintenance(maintenanceData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">Error loading data</p>
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 bg-garage-accent hover:bg-orange-600 px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      {/*<div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Garage Management System</h1>
        <p className="text-gray-400 text-lg">
          Access service manuals, video tutorials, and maintenance logs for all your vehicles
        </p>
      </div>/*}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-garage-gray rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-garage-accent">{stats.total_count}</p>
            <p className="text-gray-400">Total Vehicles</p>
          </div>
          <div className="bg-garage-gray rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.total_manuals}</p>
            <p className="text-gray-400">Service Manuals</p>
          </div>
          <div className="bg-garage-gray rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-green-500">{stats.total_videos}</p>
            <p className="text-gray-400">Video Tutorials</p>
          </div>
          <div className="bg-garage-gray rounded-lg p-6 text-center">
            <p className="text-3xl font-bold text-purple-500">{stats.total_maintenance}</p>
            <p className="text-gray-400">Maintenance Logs</p>
          </div>
        </div>
      )}

      {/* Recent Maintenance */}
      {recentMaintenance.length > 0 && (
        <div className="bg-garage-gray rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Wrench className="mr-2" />
            Recent Maintenance
          </h2>
          <div className="space-y-3">
            {recentMaintenance.map((log) => (
              <Link
                key={log.id}
                to={`/vehicle/${log.vehicle_id}`}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <div>
                  <p className="font-semibold">
                    {log.make} {log.model} - {log.description}
                  </p>
                  <p className="text-sm text-gray-400">
                    {new Date(log.date).toLocaleDateString()}
                    {log.mileage && ` • ${log.mileage.toLocaleString()} miles`}
                  </p>
                </div>
                {log.tags && log.tags.length > 0 && (
                  <div className="flex gap-2">
                    {log.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-1 rounded-full text-xs"
                        style={{ backgroundColor: tag.color + '40', color: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Sections */}
      {Object.values(VEHICLE_TYPES).map((type) => (
        <section key={type} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-3xl font-bold bg-gradient-to-r ${VEHICLE_TYPE_COLORS[type]} bg-clip-text text-transparent`}>
              {VEHICLE_TYPE_LABELS[type]}
            </h2>
            <Link
              to={`/add-vehicle?type=${type}`}
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors touch-target"
            >
              <Plus size={20} />
              <span>Add {VEHICLE_TYPE_LABELS[type].slice(0, -1)}</span>
            </Link>
          </div>
          
          {vehicles[type].length > 0 ? (
            <VehicleGrid vehicles={vehicles[type]} />
          ) : (
            <div className="bg-garage-gray rounded-lg p-12 text-center">
              <p className="text-gray-400 text-lg mb-4">
                No {VEHICLE_TYPE_LABELS[type].toLowerCase()} added yet
              </p>
              <Link
                to={`/add-vehicle?type=${type}`}
                className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Add Your First {VEHICLE_TYPE_LABELS[type].slice(0, -1)}</span>
              </Link>
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default Home;