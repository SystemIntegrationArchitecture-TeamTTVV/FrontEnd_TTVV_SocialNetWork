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
    // NOTE: allow empty-string env values ("") to intentionally use same-origin URLs
    // (useful when relying on Vite proxy in dev).
    const candidate = envUrl !== undefined ? envUrl : devFallback;
    return normalizeUrl(candidate);
  }

  // In production, never use localhost endpoints even if env vars are misconfigured.
  if (envUrl && !isLocalhostUrl(envUrl)) {
    return normalizeUrl(envUrl);
  }

  return normalizeUrl(getRuntimeOrigin());
};

export const API_CONFIG = {
  // In dev, default to same-origin and let Vite proxy forward /api/* to the Gateway.
  // You can override via VITE_API_BASE_URL when needed.
  BASE_URL: resolveBaseUrl(import.meta.env.VITE_API_BASE_URL, ''),
  COMMON_SERVICE_URL: resolveBaseUrl(import.meta.env.VITE_COMMON_SERVICE_URL, 'http://localhost:8081'),
  AUTH_SERVICE_URL: resolveBaseUrl(import.meta.env.VITE_AUTH_SERVICE_URL, 'http://localhost:8083'),
  TIMEOUT: 30000, // 30 seconds
};

const toBool = (value: unknown, fallback: boolean = false): boolean => {
  if (value === undefined || value === null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
};

export const FEATURE_FLAGS = {
  BLOCKING: toBool(import.meta.env.VITE_FEATURE_BLOCKING, false),
  DEVICE_SESSIONS: toBool(import.meta.env.VITE_FEATURE_DEVICE_SESSIONS, false),
  SCHEDULED_MESSAGES: toBool(import.meta.env.VITE_FEATURE_SCHEDULED_MESSAGES, false),
  USER_STATUS: toBool(import.meta.env.VITE_FEATURE_USER_STATUS, false),
  FRIEND_SUGGESTIONS: toBool(import.meta.env.VITE_FEATURE_FRIEND_SUGGESTIONS, false),
  DATA_EXPORT: toBool(import.meta.env.VITE_FEATURE_DATA_EXPORT, false),
  TWO_FACTOR: toBool(import.meta.env.VITE_FEATURE_TWO_FACTOR, false),
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    CAPTCHA_CHALLENGE: "/api/auth/captcha/challenge",
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
