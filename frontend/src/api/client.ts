import { env } from '@/app/config/env';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
}

export class ApiError extends Error {
  public status: number;
  public data?: unknown;
  public requestId?: string;

  constructor(message: string, status: number, data?: unknown, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.requestId = requestId;
  }
}

function generateRequestId(): string {
  const rand = Math.random().toString(36).substring(2, 10);
  return `req_fe_${Date.now().toString(36)}_${rand}`;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = env.VITE_API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, timeoutMs = env.VITE_API_TIMEOUT_MS, headers, ...customConfig } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const requestId = generateRequestId();
    const isFormData = customConfig.body instanceof FormData;
    const defaultHeaders: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-ID': requestId,
    };
    if (!isFormData) {
      defaultHeaders['Content-Type'] = 'application/json';
    }

    // Attach Bearer token if available
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('packcheck_token') || localStorage.getItem('token') : null;
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Ignore localStorage access restrictions
    }

    const config: RequestInit = {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      const respRequestId = response.headers.get('X-Request-ID') || requestId;

      if (!response.ok) {
        let errorData: unknown;
        let errorMessage = `Request failed with status ${response.status}`;

        try {
          errorData = await response.json();
          if (errorData && typeof errorData === 'object') {
            const errObj = errorData as { error?: { message?: string }; message?: string };
            errorMessage = errObj.error?.message || errObj.message || errorMessage;
          }
        } catch {
          errorData = await response.text();
        }

        throw new ApiError(errorMessage, response.status, errorData, respRequestId);
      }

      // If no content, return undefined
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return (await response.json()) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown network error',
        0,
        error
      );
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public async upload<T>(endpoint: string, formData: FormData, options?: RequestOptions): Promise<T> {
    const { headers, ...rest } = options || {};
    // Don't set Content-Type for FormData so browser sets boundary automatically
    const requestHeaders = { ...(headers || {}) };
    delete (requestHeaders as Record<string, string>)['Content-Type'];

    return this.request<T>(endpoint, {
      ...rest,
      method: 'POST',
      body: formData,
      headers: requestHeaders,
    });
  }
}

export const apiClient = new ApiClient();
