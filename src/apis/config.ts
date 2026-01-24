// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8088',
  COMMON_SERVICE_URL: import.meta.env.VITE_COMMON_SERVICE_URL || 'http://localhost:8081',
  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/common/api/auth/login',
    REGISTER: '/api/common/api/auth/register',
  },
  // Add other endpoints here as needed
};

// Helper function to get full API URL
export const getApiUrl = (endpoint: string, useGateway: boolean = true): string => {
  if (useGateway) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  return `${API_CONFIG.COMMON_SERVICE_URL}${endpoint}`;
};

