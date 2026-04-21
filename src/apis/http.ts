import { API_CONFIG } from './config';
import { notify } from '../services/notify';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export class HttpError extends Error {
  status: number;
  data?: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'HttpError';
  }
}

/**
 * HTTP Client with token management
 */
class HttpClient {
  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 [HTTP] Token found, adding Authorization header');
      } else {
        console.warn('⚠️ [HTTP] No token found in localStorage');
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    console.log('🔍 [HTTP] Content-Type:', contentType, 'isJson:', isJson);

    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
      console.log('📦 [HTTP] Parsed data:', data);
    } catch (error) {
      console.error('❌ [HTTP] Failed to parse response:', error);
      data = null;
    }

    if (!response.ok) {
      // Handle 401 Unauthorized (expired token or invalid credentials)
      // Only redirect if it's NOT a login request (to avoid redirect loop)
      if (response.status === 401 && !response.url?.includes('/auth/login')) {
        console.warn('🔒 [HTTP] Token expired or invalid, logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }

      // Automatically extract error from standardized ErrorResponseDTO backend
      const errorMessage =
        data?.message || data?.error || `HTTP error! status: ${response.status}`;
      
      // GLOBALLY show a toast error for all API failures
      notify.error(errorMessage);

      throw new HttpError(response.status, errorMessage, data);
    }

    console.log('✅ [HTTP] Returning data:', data);
    return data as T;
  }

  async get<T>(
    url: string,
    includeAuth: boolean = true,
    useGateway: boolean = true
  ): Promise<T> {
    const fullUrl = useGateway
      ? `${API_CONFIG.BASE_URL}${url}`
      : `${API_CONFIG.COMMON_SERVICE_URL}${url}`;

    const headers = this.getHeaders(includeAuth);
    console.log('📤 [HTTP] GET', fullUrl, 'Headers:', { ...headers, Authorization: headers['Authorization'] ? 'Bearer ***' : 'none' });

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    console.log('📥 [HTTP] Response:', response.status, response.statusText);

    return this.handleResponse<T>(response);
  }

  async post<T>(
    url: string,
    data?: any,
    includeAuth: boolean = true,
    useGateway: boolean = true
  ): Promise<T> {
    const fullUrl = useGateway
      ? `${API_CONFIG.BASE_URL}${url}`
      : `${API_CONFIG.COMMON_SERVICE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(
    url: string,
    data?: any,
    includeAuth: boolean = true,
    useGateway: boolean = true
  ): Promise<T> {
    const fullUrl = useGateway
      ? `${API_CONFIG.BASE_URL}${url}`
      : `${API_CONFIG.COMMON_SERVICE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    url: string,
    includeAuth: boolean = true,
    useGateway: boolean = true,
    data?: any
  ): Promise<T> {
    const fullUrl = useGateway
      ? `${API_CONFIG.BASE_URL}${url}`
      : `${API_CONFIG.COMMON_SERVICE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }
}

export const httpClient = new HttpClient();

