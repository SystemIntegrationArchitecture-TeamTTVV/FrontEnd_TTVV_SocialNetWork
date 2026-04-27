import { httpClient } from './http';
import { API_ENDPOINTS, API_CONFIG } from './config';

// Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  city?: string;
  country?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  username: string;
  role: string;
  userId: string;
  fullName: string;
  avatar: string;
}

/**
 * Store auth tokens and user info to localStorage.
 */
function persistAuth(response: AuthResponse): void {
  if (response.token) {
    localStorage.setItem('token', response.token);
  }
  if (response.refreshToken) {
    localStorage.setItem('refreshToken', response.refreshToken);
  }
  localStorage.setItem('user', JSON.stringify({
    id: response.userId,
    username: response.username,
    fullName: response.fullName,
    avatar: response.avatar,
    role: response.role,
  }));
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function isExpiredToken(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  return payload.exp * 1000 <= Date.now();
}

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Login user
   */
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.loginDirect(credentials);
    persistAuth(response);
    return response;
  },

  /**
   * Login directly to AuthService (bypass gateway if needed)
   */
  loginDirect: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      false, // No auth token needed for login
      true // Always via gateway
    );
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await authApi.registerDirect(userData);
    persistAuth(response);
    return response;
  },

  /**
   * Register directly to AuthService (bypass gateway if needed)
   */
  registerDirect: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      false, // No auth token needed for register
      true // Always via gateway
    );
  },

  /**
   * Refresh access token using stored refresh token.
   * Returns new AuthResponse on success, null on failure.
   */
  refreshAccessToken: async (): Promise<AuthResponse | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    try {
      const fullUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`;
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        return null;
      }
      const data: AuthResponse = await response.json();
      persistAuth(data);
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Logout user — invalidate refresh token on backend + clear local storage.
   */
  logout: (): void => {
    const refreshToken = localStorage.getItem('refreshToken');

    // Fire-and-forget: tell backend to invalidate the refresh token
    if (refreshToken) {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      };
      const payload = JSON.stringify({ refreshToken });
      const gatewayUrl = `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.LOGOUT}`;
      fetch(gatewayUrl, {
        method: 'POST',
        headers,
        body: payload,
      }).catch(() => { /* ignore logout errors */ });
    }

    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  /**
   * Get current user from localStorage
   */
  getCurrentUser: (): {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Get token from localStorage
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Check whether the current access token is missing/expired.
   */
  isAccessTokenExpired: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
      return true;
    }
    return isExpiredToken(token);
  },

  /**
   * Ensure access token is valid; try refresh when expired.
   */
  ensureValidAccessToken: async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!token) {
      return false;
    }

    if (!isExpiredToken(token)) {
      return true;
    }

    if (!refreshToken) {
      return false;
    }

    const refreshed = await authApi.refreshAccessToken();
    return !!refreshed?.token;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Access token expired: keep session recoverable if refresh token exists.
    if (isExpiredToken(token)) {
      return !!localStorage.getItem('refreshToken');
    }

    return true;
  },
};

