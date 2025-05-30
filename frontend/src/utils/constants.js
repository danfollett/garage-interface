// Vehicle types
export const VEHICLE_TYPES = {
  BIKE: 'bike',
  MOTORCYCLE: 'motorcycle',
  CAR: 'car'
};

// Vehicle type display names
export const VEHICLE_TYPE_LABELS = {
  [VEHICLE_TYPES.BIKE]: 'Bikes',
  [VEHICLE_TYPES.MOTORCYCLE]: 'Motorcycles',
  [VEHICLE_TYPES.CAR]: 'Cars'
};

// Vehicle type icons (using Lucide icons)
export const VEHICLE_TYPE_ICONS = {
  [VEHICLE_TYPES.BIKE]: 'Bike',
  [VEHICLE_TYPES.MOTORCYCLE]: 'Bike', // Will use same icon
  [VEHICLE_TYPES.CAR]: 'Car'
};

// Colors for vehicle types
export const VEHICLE_TYPE_COLORS = {
  [VEHICLE_TYPES.BIKE]: 'from-blue-500 to-blue-700',
  [VEHICLE_TYPES.MOTORCYCLE]: 'from-orange-500 to-orange-700',
  [VEHICLE_TYPES.CAR]: 'from-green-500 to-green-700'
};

// Quick maintenance types
export const QUICK_MAINTENANCE_TYPES = {
  OIL_CHANGE: 'oil-change',
  TIRE_ROTATION: 'tire-rotation',
  BRAKE_SERVICE: 'brake-service',
  INSPECTION: 'inspection'
};

// Maintenance tag colors
export const TAG_COLORS = {
  'Oil Change': '#f59e0b',
  'Tire Rotation': '#3b82f6',
  'Brake Service': '#ef4444',
  'Filter Replacement': '#8b5cf6',
  'Battery': '#10b981',
  'Inspection': '#6366f1',
  'Fluid Check': '#06b6d4',
  'Tune Up': '#ec4899',
  'Chain/Belt': '#84cc16',
  'Electrical': '#f97316'
};

// File size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  MANUAL: 50 * 1024 * 1024, // 50MB
  VIDEO: 500 * 1024 * 1024, // 500MB
  THUMBNAIL: 2 * 1024 * 1024 // 2MB
};

// Accepted file types
export const ACCEPTED_FILE_TYPES = {
  IMAGE: '.jpg,.jpeg,.png,.gif,.webp',
  MANUAL: '.pdf',
  VIDEO: '.mp4,.avi,.mov,.wmv,.flv,.mkv,.webm',
  THUMBNAIL: '.jpg,.jpeg,.png,.gif,.webp'
};

// Date format
export const DATE_FORMAT = 'yyyy-MM-dd';

// Currency format
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format mileage
export const formatMileage = (mileage) => {
  if (!mileage) return 'N/A';
  return `${mileage.toLocaleString()} miles`;
};

// Get vehicle display name
export const getVehicleDisplayName = (vehicle) => {
  if (!vehicle) return '';
  return `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim();
};

// Get file size display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};