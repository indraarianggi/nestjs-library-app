import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../tokenStorage';

/**
 * Axios HTTP Client Configuration
 * 
 * Configured for JWT token-based authentication.
 * Includes request/response interceptors for:
 * - Adding Authorization header with Bearer token
 * - Logging requests/responses in dev mode
 * - Error handling and token refresh on 401
 */

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add Authorization header with access token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = tokenStorage.getAccessToken();
    
    // Add Authorization header if token exists
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Log requests in development mode
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        headers: config.headers,
      });
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Track if we're currently refreshing the token to avoid multiple refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor - Handle token refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development mode
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Handle errors
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    const statusCode = error.response?.status;

    // Handle 401 Unauthorized - Try to refresh token
    if (statusCode === 401 && originalRequest && !originalRequest._retry) {
      // Don't retry auth endpoints (login, register, refresh)
      const isAuthEndpoint =
        originalRequest.url?.includes('/members/login') ||
        originalRequest.url?.includes('/members/register') ||
        originalRequest.url?.includes('/members/refresh');

      if (isAuthEndpoint) {
        // Clear tokens and redirect to login
        tokenStorage.clearTokens();
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register')
        ) {
          console.warn('[Auth] Authentication failed - Redirecting to login');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, clear tokens and redirect to login
        tokenStorage.clearTokens();
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register')
        ) {
          console.warn('[Auth] No refresh token - Redirecting to login');
          window.location.href = '/login';
        }
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/members/refresh`,
          { refreshToken }
        );

        // Store new tokens
        tokenStorage.setTokens(data.accessToken, data.refreshToken);

        // Update Authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Process queued requests with new token
        processQueue(null, data.accessToken);

        isRefreshing = false;

        // Retry the original request with new token
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(new Error('Token refresh failed'), null);
        isRefreshing = false;
        tokenStorage.clearTokens();

        const currentPath = window.location.pathname;
        if (
          !currentPath.includes('/login') &&
          !currentPath.includes('/register')
        ) {
          console.warn('[Auth] Token refresh failed - Redirecting to login');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other common status codes
    if (statusCode === 403) {
      console.error('[Auth] Forbidden - Insufficient permissions');
    }

    if (statusCode === 404) {
      console.error('[API] Resource not found');
    }

    if (statusCode && statusCode >= 500) {
      console.error('[API] Server error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
