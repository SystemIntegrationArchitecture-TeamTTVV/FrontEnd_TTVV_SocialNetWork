// API Configuration
const isDev = import.meta.env.DEV;

const isRuntimeLocal =
  typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname);

const getRuntimeOrigin = () =>
  typeof window !== 'undefined' ? window.location.origin : '';

const isLocalhostUrl = (url: string) => /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);

const normalizeUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const pageProtocol = window.location.protocol;
    // Avoid mixed-content fetch errors when app is served via HTTPS.
    if (pageProtocol === 'https:' && /^http:\/\//i.test(trimmed) && !isLocalhostUrl(trimmed)) {
      return trimmed.replace(/^http:\/\//i, 'https://');
    }
  }

  return trimmed;
};

const resolveBaseUrl = (envUrl: string | undefined, devFallback: string) => {
  // Keep local runs stable (vite dev, local preview, local tunnel fallback)
  if (isDev || isRuntimeLocal) {
    return normalizeUrl(envUrl || devFallback);
  }

  // In production, never use localhost endpoints even if env vars are misconfigured.
  if (envUrl && !isLocalhostUrl(envUrl)) {
    return normalizeUrl(envUrl);
  }

  return normalizeUrl(getRuntimeOrigin());
};

export const API_CONFIG = {
  BASE_URL: resolveBaseUrl(import.meta.env.VITE_API_BASE_URL, 'http://localhost:8088'),
  COMMON_SERVICE_URL: resolveBaseUrl(import.meta.env.VITE_COMMON_SERVICE_URL, 'http://localhost:8081'),
  TIMEOUT: 30000, // 30 seconds
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  // Add other endpoints here as needed
};

// Helper function to get full API URL
export const getApiUrl = (
  endpoint: string,
  useGateway: boolean = true,
): string => {
  if (useGateway) {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  return `${API_CONFIG.COMMON_SERVICE_URL}${endpoint}`;
};
