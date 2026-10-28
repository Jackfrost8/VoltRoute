import apiClient from './client';

/**
 * Authentication API service managing login, registration, and user profile queries.
 */
export const authService = {
  /**
   * Registers a new user account.
   * @param {Object} payload { email, password, firstName, lastName }
   * @returns {Promise<Object>} { token, tokenType, expiresIn, user }
   */
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    if (response?.data?.token) {
      localStorage.setItem('voltroute_token', response.data.token);
      localStorage.setItem('voltroute_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Authenticates user credentials and issues a JWT token.
   * @param {Object} payload { email, password }
   * @returns {Promise<Object>} { token, tokenType, expiresIn, user }
   */
  async login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    if (response?.data?.token) {
      localStorage.setItem('voltroute_token', response.data.token);
      localStorage.setItem('voltroute_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Fetches the current authenticated user's profile.
   * @returns {Promise<Object>} User profile object
   */
  async getProfile() {
    const response = await apiClient.get('/users/profile');
    if (response?.data) {
      localStorage.setItem('voltroute_user', JSON.stringify(response.data));
    }
    return response.data;
  },

  /**
   * Logs out the user by purging local storage tokens.
   */
  logout() {
    localStorage.removeItem('voltroute_token');
    localStorage.removeItem('voltroute_user');
  },

  /**
   * Returns stored JWT token string or null.
   */
  getToken() {
    return localStorage.getItem('voltroute_token');
  },

  /**
   * Returns cached User profile or null.
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('voltroute_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Checks if user has a valid active token session stored.
   */
  isAuthenticated() {
    return Boolean(localStorage.getItem('voltroute_token'));
  },
};

export default authService;
