import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

type ApiErrorResponse =
  | string
  | {
      detail?: unknown;
      message?: unknown;
      error?: unknown;
    };

function firstNonEmptyString(values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return null;
}

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as ApiErrorResponse | undefined;

    if (typeof responseData === 'string' && responseData.trim().length > 0) {
      return responseData;
    }

    if (responseData && typeof responseData === 'object') {
      const detail = firstNonEmptyString([
        responseData.detail,
        responseData.message,
        responseData.error,
      ]);
      if (detail) {
        return detail;
      }
    }

    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}

type TokenRefreshResponse = {
  access_token: string;
  refresh_token: string;
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const AUTH_REFRESH_PATH = '/auth/refresh';
const NON_REFRESHABLE_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  AUTH_REFRESH_PATH,
];

function clearStoredTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function shouldBypassRefresh(url?: string): boolean {
  if (!url) {
    return false;
  }
  return NON_REFRESHABLE_AUTH_PATHS.some((path) => url.includes(path));
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = axios
      .post<TokenRefreshResponse>(
        `${api.defaults.baseURL}${AUTH_REFRESH_PATH}`,
        { refresh_token: refreshToken },
        {
          timeout: api.defaults.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((response) => {
        localStorage.setItem(TOKEN_KEY, response.data.access_token);
        localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);
        return response.data.access_token;
      })
      .catch(() => {
        clearStoredTokens();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    // Handle common errors
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401: {
          if (
            originalRequest &&
            !originalRequest._retry &&
            !shouldBypassRefresh(originalRequest.url)
          ) {
            originalRequest._retry = true;
            const nextAccessToken = await refreshAccessToken();
            if (nextAccessToken) {
              originalRequest.headers = originalRequest.headers ?? {};
              originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;
              return api(originalRequest);
            }
          }

          clearStoredTokens();
          window.location.href = '/login';
          break;
        }
        case 403:
          // Forbidden
          console.error('Access forbidden');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error');
          break;
        default:
          console.error('API error:', error.response.status);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network error - no response received');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
