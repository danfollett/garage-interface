import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, Wrench, Car, Bike, Gauge } from 'lucide-react';
import { getVehicleDisplayName } from '../utils/constants';

const VehicleCard = ({ vehicle }) => {
  const VehicleIcon = vehicle.type === 'car' ? Car : Bike;
  
  return (
    <Link
      to={`/vehicle/${vehicle.id}`}
      className="block bg-garage-gray rounded-lg overflow-hidden hover:transform hover:scale-105 transition-all duration-200 card-hover"
    >
      {/* Vehicle Image */}
      <div className="aspect-video bg-gray-800 relative">
        {vehicle.image_path ? (
          <img
            src={`http://localhost:5000${vehicle.image_path}`}
            alt={getVehicleDisplayName(vehicle)}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full ${vehicle.image_path ? 'hidden' : 'flex'} items-center justify-center`}
          style={{ display: vehicle.image_path ? 'none' : 'flex' }}
        >
          <VehicleIcon size={64} className="text-gray-600" />
        </div>
        
        {/* Type Badge */}
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded text-xs uppercase">
          {vehicle.type}
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="p-4">
        <h3 className="text-xl font-bold mb-2">
          {getVehicleDisplayName(vehicle)}
        </h3>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <FileText size={16} />
              <span>{vehicle.manual_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Video size={16} />
              <span>{vehicle.video_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Wrench size={16} />
              <span>{vehicle.maintenance_count || 0}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Gauge size={16} />
              <span>{vehicle.current_mileage || 0}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VehicleCard;