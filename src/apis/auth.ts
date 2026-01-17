import { httpClient } from './http';
import { API_ENDPOINTS } from './config';

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
  username: string;
  role: string;
  userId: string;
  fullName: string;
  avatar: string;
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
    // Store token
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.userId,
        username: response.username,
        fullName: response.fullName,
        avatar: response.avatar,
        role: response.role,
      }));
    }
    return response;
  },

  /**
   * Login directly to CommonService (bypass gateway if needed)
   */
  loginDirect: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      false, // No auth token needed for login
      true // Try gateway first
    ).catch(() => {
      // Fallback to direct CommonService if gateway fails
      return httpClient.post<AuthResponse>(
        '/api/auth/login',
        credentials,
        false,
        false // Direct to CommonService
      );
    });
  },

  /**
   * Register new user
   */
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await authApi.registerDirect(userData);
    // Store token
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify({
        id: response.userId,
        username: response.username,
        fullName: response.fullName,
        avatar: response.avatar,
        role: response.role,
      }));
    }
    return response;
  },

  /**
   * Register directly to CommonService (bypass gateway if needed)
   */
  registerDirect: async (userData: RegisterRequest): Promise<AuthResponse> => {
    return httpClient.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      false, // No auth token needed for register
      true // Try gateway first
    ).catch(() => {
      // Fallback to direct CommonService if gateway fails
      return httpClient.post<AuthResponse>(
        '/api/auth/register',
        userData,
        false,
        false // Direct to CommonService
      );
    });
  },

  /**
   * Logout user
   */
  logout: (): void => {
    localStorage.removeItem('token');
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
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

