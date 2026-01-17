import { API_CONFIG } from './config';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * HTTP Client with token management
 */
class HttpClient {
  private getHeaders(includeAuth: boolean = true): HeadersInit {
    const headers: HeadersInit = {
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

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    try {
      data = isJson ? await response.json() : await response.text();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const errorMessage =
        data?.message || data?.error || `HTTP error! status: ${response.status}`;
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

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.getHeaders(includeAuth),
    });

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
    useGateway: boolean = true
  ): Promise<T> {
    const fullUrl = useGateway
      ? `${API_CONFIG.BASE_URL}${url}`
      : `${API_CONFIG.COMMON_SERVICE_URL}${url}`;

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }
}

export const httpClient = new HttpClient();

