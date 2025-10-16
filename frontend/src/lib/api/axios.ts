import axios, { AxiosError } from 'axios';

/**
 * Axios HTTP Client Configuration
 * 
 * Configured for session-based authentication with cookies.
 * Includes request/response interceptors for logging and error handling.
 */

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true, // Include cookies for session authentication
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Log requests in development mode
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      });
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor
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
  (error: AxiosError) => {
    // Handle errors
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });

    // Redirect to login on 401 Unauthorized
    const statusCode = error.response?.status;
    
    if (statusCode === 401) {
      // Only redirect if not already on login/register pages
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.warn('[Auth] Unauthorized - Redirecting to login');
        window.location.href = '/login';
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
