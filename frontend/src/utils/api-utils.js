// Utility function to get the correct API URL for images and files
export const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Use same host as frontend but with backend port
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000`;
};

// Helper to build full URL for uploaded files
export const getFileUrl = (path) => {
  if (!path) return '';
  return `${getApiUrl()}${path}`;
};