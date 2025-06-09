import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Bike, Plus, Grid, List, Wrench, ChevronRight, Droplet } from 'lucide-react';
import { vehicleAPI, maintenanceAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import { getVehicleDisplayName, formatDate, formatCurrency } from '../utils/constants';
import { getApiUrl } from '../utils/api-utils';

const Home = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [recentMaintenance, setRecentMaintenance] = useState([]);
  const [oilChangeData, setOilChangeData] = useState([]);
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalServices: 0,
    totalCost: 0,
    lastService: null
  });
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('maintenanceAPI:', maintenanceAPI); // Debug log
      console.log('maintenanceAPI.getRecent:', maintenanceAPI.getRecent); // Debug log

      // Fetch vehicles - returns grouped by type
      const vehiclesData = await vehicleAPI.getAll();
      
      // Flatten the grouped structure into a single array
      const allVehicles = [];
      if (vehiclesData.bike) allVehicles.push(...vehiclesData.bike);
      if (vehiclesData.motorcycle) allVehicles.push(...vehiclesData.motorcycle);
      if (vehiclesData.car) allVehicles.push(...vehiclesData.car);
      
      setVehicles(allVehicles);

      // Fetch recent maintenance
      const maintenanceData = await maintenanceAPI.getRecent(5);
      setRecentMaintenance(maintenanceData || []);

      // Fetch all maintenance for stats
      const allMaintenanceData = await maintenanceAPI.getAll();
      const maintenanceArray = allMaintenanceData || [];
      
      // Calculate stats
      const totalCost = maintenanceArray.reduce((sum, log) => sum + (log.cost || 0), 0);
      const lastService = maintenanceArray.length > 0 ? maintenanceArray[0].date : null;

      setStats({
        totalVehicles: allVehicles.length,
        totalServices: maintenanceArray.length,
        totalCost,
        lastService
      });

      // Calculate oil change data for cars and motorcycles
      const oilChangeInfo = [];
      for (const vehicle of allVehicles) {
        if (vehicle.type === 'car' || vehicle.type === 'motorcycle') {
          try {
            const lastOilChange = await maintenanceAPI.getLastOilChange(vehicle.id);
            
            let nextDueMiles = null;
            let nextDueDate = null;
            let status = 'unknown';
            
            if (lastOilChange && vehicle.oil_change_interval_miles) {
              nextDueMiles = (lastOilChange.mileage || 0) + vehicle.oil_change_interval_miles;
            }
            
            if (lastOilChange && vehicle.oil_change_interval_months) {
              const lastChangeDate = new Date(lastOilChange.date);
              nextDueDate = new Date(lastChangeDate);
              nextDueDate.setMonth(nextDueDate.getMonth() + vehicle.oil_change_interval_months);
            }
            
            // Determine status
            if (nextDueMiles || nextDueDate) {
              const today = new Date();
              const milesDue = nextDueMiles && vehicle.current_mileage && nextDueMiles <= vehicle.current_mileage;
              const dateDue = nextDueDate && nextDueDate <= today;
              
              if (milesDue || dateDue) {
                status = 'overdue';
              } else if (nextDueMiles && vehicle.current_mileage) {
                const milesRemaining = nextDueMiles - vehicle.current_mileage;
                if (milesRemaining <= 500) status = 'soon';
                else status = 'ok';
              } else if (nextDueDate) {
                const daysRemaining = Math.floor((nextDueDate - today) / (1000 * 60 * 60 * 24));
                if (daysRemaining <= 30) status = 'soon';
                else status = 'ok';
              }
            }
            
            oilChangeInfo.push({
              vehicle,
              lastOilChange,
              nextDueMiles,
              nextDueDate,
              status
            });
          } catch (error) {
            console.error(`Error fetching oil change for vehicle ${vehicle.id}:`, error);
          }
        }
      }
      
      // Sort by status (overdue first, then soon, then ok)
      oilChangeInfo.sort((a, b) => {
        const statusOrder = { overdue: 0, soon: 1, ok: 2, unknown: 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
      
      setOilChangeData(oilChangeInfo);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-2xl text-red-500 mb-4">Error loading data</p>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="bg-garage-accent hover:bg-orange-600 px-6 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-neutral-900 p-6 overflow-y-auto border-r border-gray-800">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <img src='logo.png' />
         {/* <h1 className="text-3xl font-bold text-garage-accent mb-2">My Garage</h1>*/}
         {/*  <p className="text-gray-400 text-sm">Vehicle Management System</p>*/}
        </div>

        {/* Stats Overview */}
        <div className="bg-garage-gray rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Overview</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Vehicles</span>
              <span className="text-2xl font-bold">{stats.totalVehicles}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Services</span>
              <span className="text-2xl font-bold">{stats.totalServices}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Cost</span>
              <span className="text-xl font-bold text-green-500">
                {formatCurrency(stats.totalCost)}
              </span>
            </div>
            {stats.lastService && (
              <div className="pt-3 mt-3 border-t border-gray-700">
                <p className="text-sm text-gray-400">Last Service</p>
                <p className="font-semibold">{formatDate(stats.lastService)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Maintenance */}
        <div className="bg-garage-gray rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">Recent Maintenance</h2>
          {recentMaintenance.length > 0 ? (
            <div className="space-y-3">
              {recentMaintenance.map((log) => {
                const vehicle = vehicles.find(v => v.id === log.vehicle_id);
                return (
                  <Link
                    key={log.id}
                    to={`/vehicle/${log.vehicle_id}`}
                    className="block p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-sm font-medium mb-1">
                      {vehicle ? getVehicleDisplayName(vehicle) : 'Unknown Vehicle'}
                    </div>
                    <div className="text-xs text-gray-400 mb-1">
                      {formatDate(log.date)}
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">
                      {log.description}
                    </p>
                    {log.cost && (
                      <p className="text-sm text-green-500 mt-1 font-semibold">
                        {formatCurrency(log.cost)}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4 text-sm">
              No maintenance records yet
            </p>
          )}
        </div>

        {/* Oil Change Reminders */}
        {oilChangeData.length > 0 && (
          <div className="bg-garage-gray rounded-lg p-5 mb-6">
            <div className="flex items-center mb-4">
              <Droplet size={20} className="mr-2 text-yellow-500" />
              <h2 className="text-lg font-semibold">Oil Change Schedule</h2>
            </div>
            <div className="space-y-3">
              {oilChangeData.map(({ vehicle, lastOilChange, nextDueMiles, nextDueDate, status }) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicle/${vehicle.id}`}
                  className={`block p-3 rounded-lg transition-colors ${
                    status === 'overdue' ? 'bg-red-900 hover:bg-red-800' :
                    status === 'soon' ? 'bg-yellow-900 hover:bg-yellow-800' :
                    'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {getVehicleDisplayName(vehicle)}
                  </div>
                  
                  {status === 'unknown' ? (
                    <p className="text-xs text-gray-400">No oil change data</p>
                  ) : (
                    <>
                      {nextDueMiles && vehicle.current_mileage && (
                        <div className="text-xs text-gray-300">
                          Due at: {nextDueMiles.toLocaleString()} miles
                          <span className={`ml-1 ${
                            status === 'overdue' ? 'text-red-400' :
                            status === 'soon' ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            ({status === 'overdue' ? 'Overdue by ' : ''}
                            {Math.abs(nextDueMiles - vehicle.current_mileage).toLocaleString()} miles
                            {status === 'overdue' ? '' : ' remaining'})
                          </span>
                        </div>
                      )}
                      
                      {nextDueDate && (
                        <div className="text-xs text-gray-300">
                          Due by: {formatDate(nextDueDate)}
                          <span className={`ml-1 ${
                            status === 'overdue' ? 'text-red-400' :
                            status === 'soon' ? 'text-yellow-400' :
                            'text-gray-400'
                          }`}>
                            {(() => {
                              const today = new Date();
                              const days = Math.floor((nextDueDate - today) / (1000 * 60 * 60 * 24));
                              if (days < 0) return `(${Math.abs(days)} days overdue)`;
                              if (days === 0) return '(Due today)';
                              return `(${days} days)`;
                            })()}
                          </span>
                        </div>
                      )}
                      
                      {lastOilChange && (
                        <div className="text-xs text-gray-500 mt-1">
                          Last: {formatDate(lastOilChange.date)}
                          {lastOilChange.mileage && ` at ${lastOilChange.mileage.toLocaleString()} miles`}
                        </div>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">My Vehicles</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-garage-accent' : 'bg-gray-700'}`}
                title="Grid view"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-garage-accent' : 'bg-gray-700'}`}
                title="List view"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {vehicles.length === 0 ? (
            <div className="bg-garage-gray rounded-lg p-16 text-center">
              <Car size={64} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 text-lg mb-6">No vehicles in your garage yet</p>
              <Link
                to="/add-vehicle"
                className="inline-flex items-center space-x-2 bg-garage-accent hover:bg-orange-600 px-6 py-3 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Add Your First Vehicle</span>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  to={`/vehicle/${vehicle.id}`}
                  className="block bg-garage-gray hover:bg-gray-700 rounded-lg p-4 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {vehicle.image_path ? (
                      <img
                        src={`${getApiUrl()}${vehicle.image_path}`}
                        alt={getVehicleDisplayName(vehicle)}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-16 h-16 bg-gray-700 rounded ${vehicle.image_path ? 'hidden' : 'flex'} items-center justify-center`}
                      style={{ display: vehicle.image_path ? 'none' : 'flex' }}
                    >
                      {vehicle.type === 'car' ? <Car size={24} /> : <Bike size={24} />}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{getVehicleDisplayName(vehicle)}</h3>
                      <p className="text-gray-400 text-sm capitalize">{vehicle.type}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        {/* Quick Actions */}
        <div className="space-y-3 absolute right-10 bottom-10 ">
          <Link
            to="/add-vehicle"
            className="items-center text-center justify-center space-x-2 bg-garage-accent hover:bg-orange-600 px-4 py-3 rounded-lg transition-colors w-48"
          >
            <Plus size={20} class='inline'/>
            <span>Add Vehicle</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
