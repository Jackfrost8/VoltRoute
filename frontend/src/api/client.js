import axios from 'axios';

/**
 * Central Axios HTTP client instance for VoltRoute.
 * Reads backend base URL from environment variables or defaults to '/api'.
 * Attaches JWT Bearer tokens to outbound requests and handles 401 session expiration.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer token if present in localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voltroute_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap ApiResponse envelope and handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    // Backend standard ApiResponse: { success, status, message, data }
    return response.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired credentials from storage
      localStorage.removeItem('voltroute_token');
      localStorage.removeItem('voltroute_user');

      // Dispatch custom event for AuthContext synchronization
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('voltroute-auth-expired'));
      }
    }

    // Extract standardized ApiErrorResponse message
    const serverMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';

    const enhancedError = new Error(serverMessage);
    enhancedError.status = error.response?.status;
    enhancedError.data = error.response?.data;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
