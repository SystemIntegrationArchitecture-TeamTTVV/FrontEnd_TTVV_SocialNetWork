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
 * HTTP Client with token management and automatic refresh.
 */
class HttpClient {
  /** Prevents multiple concurrent refresh calls. */
  private isRefreshing = false;
  /** Queue of requests waiting for the token refresh to complete. */
  private refreshQueue: Array<{
    resolve: (token: string) => void;
    reject: (err: Error) => void;
  }> = [];

  private getHeaders(includeAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Try to refresh the access token. Returns the new token on success.
   * Uses a mutex + queue so only one refresh runs at a time.
   */
  private async refreshToken(): Promise<string> {
    // If already refreshing, wait for the in-progress refresh
    if (this.isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      // Dynamic import to avoid circular dependency
      const { authApi } = await import('./auth');
      const result = await authApi.refreshAccessToken();

      if (!result || !result.token) {
        throw new Error('Refresh failed');
      }

      // Resolve all queued requests with the new token
      this.refreshQueue.forEach(({ resolve }) => resolve(result.token));
      this.refreshQueue = [];

      return result.token;
    } catch (err) {
      // Reject all queued requests
      this.refreshQueue.forEach(({ reject }) => reject(err as Error));
      this.refreshQueue = [];
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  private isAuthUrl(url: string): boolean {
    return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');
  }

  private async handleResponse<T>(
    response: Response,
    retryFn?: () => Promise<T>
  ): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch {
      data = null;
    }

    if (!response.ok) {
      // Handle 401 Unauthorized — attempt token refresh (skip for auth endpoints)
      if (response.status === 401 && !this.isAuthUrl(response.url) && retryFn) {
        try {
          await this.refreshToken();
          // Retry the original request with the new token
          return retryFn();
        } catch {
          // Refresh failed — force logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/auth/login';
          throw new HttpError(401, 'Session expired');
        }
      }

      // If it's a 401 on a non-retryable request (login failure etc.)
      if (response.status === 401 && this.isAuthUrl(response.url)) {
        // Don't redirect for login failures — just throw
      }

      const errorMessage =
        data?.message || data?.error || `HTTP error! status: ${response.status}`;

      // Globally show a toast error for all API failures
      notify.error(errorMessage);

      throw new HttpError(response.status, errorMessage, data);
    }

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

    const doFetch = async (): Promise<T> => {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: this.getHeaders(includeAuth),
      });
      return this.handleResponse<T>(response, doFetch);
    };

    return doFetch();
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

    const doFetch = async (): Promise<T> => {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response, doFetch);
    };

    return doFetch();
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

    const doFetch = async (): Promise<T> => {
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response, doFetch);
    };

    return doFetch();
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

    const doFetch = async (): Promise<T> => {
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: this.getHeaders(includeAuth),
        body: data ? JSON.stringify(data) : undefined,
      });
      return this.handleResponse<T>(response, doFetch);
    };

    return doFetch();
  }
}

export const httpClient = new HttpClient();

