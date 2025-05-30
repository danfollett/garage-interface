import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Vehicle API calls
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  getByType: (type) => api.get(`/vehicles/type/${type}`),
  create: (formData) => api.post('/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/vehicles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/vehicles/${id}`),
  search: (query) => api.get(`/vehicles/search?q=${query}`),
  getStats: () => api.get('/vehicles/stats'),
};

// Manual API calls
export const manualAPI = {
  getAll: () => api.get('/manuals'),
  getById: (id) => api.get(`/manuals/${id}`),
  getByVehicle: (vehicleId) => api.get(`/manuals/vehicle/${vehicleId}`),
  upload: (vehicleId, formData) => api.post(`/manuals/vehicle/${vehicleId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.put(`/manuals/${id}`, data),
  delete: (id) => api.delete(`/manuals/${id}`),
  download: (id) => `${API_BASE_URL}/manuals/${id}/download`,
  search: (query) => api.get(`/manuals/search?q=${query}`),
};

// Video API calls
export const videoAPI = {
  getAll: () => api.get('/videos'),
  getById: (id) => api.get(`/videos/${id}`),
  getByVehicle: (vehicleId) => api.get(`/videos/vehicle/${vehicleId}`),
  addYouTube: (vehicleId, data) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description || '');
    formData.append('youtube_url', data.youtube_url);
    if (data.thumbnail) {
      formData.append('thumbnail', data.thumbnail);
    }
    return api.post(`/videos/vehicle/${vehicleId}/youtube`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadLocal: (vehicleId, formData) => api.post(`/videos/vehicle/${vehicleId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, formData) => api.put(`/videos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/videos/${id}`),
  search: (query) => api.get(`/videos/search?q=${query}`),
};

// Maintenance API calls
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  getById: (id) => api.get(`/maintenance/${id}`),
  getByVehicle: (vehicleId) => api.get(`/maintenance/vehicle/${vehicleId}`),
  create: (vehicleId, data) => api.post(`/maintenance/vehicle/${vehicleId}`, data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  quickAdd: (vehicleId, type, mileage) => api.post(`/maintenance/vehicle/${vehicleId}/quick-add`, { type, mileage }),
  getCostSummary: (vehicleId = null) => api.get('/maintenance/cost-summary', {
    params: vehicleId ? { vehicleId } : {}
  }),
  getByDateRange: (startDate, endDate) => api.get('/maintenance/date-range', {
    params: { startDate, endDate }
  }),
  getTags: () => api.get('/maintenance/tags'),
  getRecent: (limit) => api.get('/maintenance/recent',limit),
  createTag: (data) => api.post('/maintenance/tags', data),
  getLogsByTag: (tagId) => api.get(`/maintenance/tags/${tagId}/logs`),
};

// Error handler
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
      throw new Error(error.response.data.error || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request);
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      console.error('Error:', error.message);
      throw error;
    }
  }
);

export default api;