import axios from 'axios';
import { BASE_URL } from '../utils/constants';
import { getToken, removeToken } from '../utils/tokenUtils';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    // TODO: Re-enable authentication before production
    if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
      return config;
    }

    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // TODO: Re-enable authentication before production
      if (import.meta.env.VITE_DEVELOPMENT_MODE !== 'true') {
        // Auto logout if unauthorized
        removeToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
