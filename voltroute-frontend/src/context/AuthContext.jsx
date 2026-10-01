import { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { setToken, getToken, removeToken, decodeToken, isAuthenticated } from '../utils/tokenUtils';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    // TODO: Re-enable authentication before production
    if (import.meta.env.VITE_DEVELOPMENT_MODE === 'true') {
      setUser({
        id: 1,
        firstName: "Demo",
        lastName: "User",
        email: "demo@voltroute.com",
        role: "USER"
      });
      setLoading(false);
      return;
    }

    try {
      if (isAuthenticated()) {
        const userData = await userService.getProfile();
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
      removeToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    if (data.token) {
      setToken(data.token);
      await fetchProfile();
    }
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    if (data.token) {
      setToken(data.token);
      await fetchProfile();
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateProfile = async (userData) => {
    const updated = await userService.updateProfile(userData);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
