import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import favoriteService from '../api/favoriteService';

export const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await favoriteService.getFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load user favorites:', err);
      setError(err.message || 'Unable to load favorite charging stations.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const favoriteStationIds = useMemo(() => {
    return new Set(favorites.map((f) => Number(f.stationId)));
  }, [favorites]);

  const isFavorite = useCallback(
    (stationId) => {
      if (!stationId) return false;
      return favoriteStationIds.has(Number(stationId));
    },
    [favoriteStationIds]
  );

  const addFavorite = useCallback(
    async (station) => {
      if (!isAuthenticated) {
        navigate('/login');
        return null;
      }
      try {
        const created = await favoriteService.addFavorite(station);
        setFavorites((prev) => [created, ...prev.filter((f) => Number(f.stationId) !== Number(station.id))]);
        return created;
      } catch (err) {
        console.error('Failed to add favorite:', err);
        throw err;
      }
    },
    [isAuthenticated, navigate]
  );

  const removeFavorite = useCallback(
    async (stationId) => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        await favoriteService.removeFavorite(stationId);
        setFavorites((prev) => prev.filter((f) => Number(f.stationId) !== Number(stationId)));
      } catch (err) {
        console.error('Failed to remove favorite:', err);
        throw err;
      }
    },
    [isAuthenticated, navigate]
  );

  const toggleFavorite = useCallback(
    async (station) => {
      if (!isAuthenticated) {
        navigate('/login');
        return false;
      }
      const stationId = station.stationId || station.id;
      if (isFavorite(stationId)) {
        await removeFavorite(stationId);
        return false;
      } else {
        await addFavorite(station);
        return true;
      }
    },
    [isAuthenticated, navigate, isFavorite, removeFavorite, addFavorite]
  );

  const value = {
    favorites,
    loading,
    error,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    refreshFavorites: fetchFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    // Return a safe fallback if used outside provider (e.g. isolated unit tests)
    return {
      favorites: [],
      loading: false,
      error: null,
      isFavorite: () => false,
      addFavorite: async () => {},
      removeFavorite: async () => {},
      toggleFavorite: async () => {},
      refreshFavorites: async () => {},
    };
  }
  return context;
}

export default FavoritesContext;
