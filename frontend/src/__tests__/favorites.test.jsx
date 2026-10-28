import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../api/client';
import favoriteService from '../api/favoriteService';
import FavoritesPage from '../pages/FavoritesPage';
import StationCard from '../components/StationCard';
import { FavoritesContext, FavoritesProvider } from '../context/FavoritesContext';
import { AuthContext } from '../context/AuthContext';

// Mock the API client
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Phase 8: Charging Station Favorites Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('favoriteService API Client Tests', () => {
    it('getFavorites queries GET /favorites and extracts payload data', async () => {
      const mockFavorites = [
        {
          id: 1,
          stationId: 101,
          stationTitle: 'Downtown Fast Hub',
          city: 'San Francisco',
        },
      ];
      apiClient.get.mockResolvedValueOnce({ data: mockFavorites });

      const result = await favoriteService.getFavorites();

      expect(apiClient.get).toHaveBeenCalledWith('/favorites');
      expect(result).toEqual(mockFavorites);
    });

    it('addFavorite formats payload and calls POST /favorites', async () => {
      const mockStation = {
        id: 202,
        title: 'Presidio Supercharger',
        operatorName: 'Electrify America',
        location: {
          addressLine1: '100 Mason St',
          city: 'San Francisco',
          stateOrProvince: 'CA',
          countryCode: 'US',
          latitude: 37.8,
          longitude: -122.46,
        },
        maxPowerKw: 150,
        totalConnectors: 8,
        connectorTypes: ['CCS', 'CHAdeMO'],
      };

      const expectedResponse = {
        id: 10,
        stationId: 202,
        stationTitle: 'Presidio Supercharger',
        operatorName: 'Electrify America',
      };

      apiClient.post.mockResolvedValueOnce({ data: expectedResponse });

      const result = await favoriteService.addFavorite(mockStation);

      expect(apiClient.post).toHaveBeenCalledWith('/favorites', {
        stationId: 202,
        stationTitle: 'Presidio Supercharger',
        operatorName: 'Electrify America',
        addressLine: '100 Mason St',
        city: 'San Francisco',
        stateOrProvince: 'CA',
        countryCode: 'US',
        latitude: 37.8,
        longitude: -122.46,
        maxPowerKw: 150,
        totalConnectors: 8,
        connectorTypes: ['CCS', 'CHAdeMO'],
      });
      expect(result).toEqual(expectedResponse);
    });

    it('addFavorite throws error when station or station.id is missing', async () => {
      await expect(favoriteService.addFavorite(null)).rejects.toThrow(
        'Station ID is required to add a favorite.'
      );
      await expect(favoriteService.addFavorite({})).rejects.toThrow(
        'Station ID is required to add a favorite.'
      );
    });

    it('removeFavorite calls DELETE /favorites/:stationId', async () => {
      apiClient.delete.mockResolvedValueOnce({ success: true, message: 'Removed' });

      const result = await favoriteService.removeFavorite(202);

      expect(apiClient.delete).toHaveBeenCalledWith('/favorites/202');
      expect(result).toEqual({ success: true, message: 'Removed' });
    });

    it('removeFavorite throws error when stationId is missing', async () => {
      await expect(favoriteService.removeFavorite(null)).rejects.toThrow(
        'Station ID is required to remove a favorite.'
      );
    });

    it('isStationFavorited accurately checks station existence in list', () => {
      const list = [
        { stationId: 101, stationTitle: 'Station A' },
        { stationId: 202, stationTitle: 'Station B' },
      ];

      expect(favoriteService.isStationFavorited(101, list)).toBe(true);
      expect(favoriteService.isStationFavorited('202', list)).toBe(true);
      expect(favoriteService.isStationFavorited(303, list)).toBe(false);
      expect(favoriteService.isStationFavorited(null, list)).toBe(false);
      expect(favoriteService.isStationFavorited(101, null)).toBe(false);
    });
  });

  describe('FavoritesPage Component Tests', () => {
    it('renders empty state when user has no bookmarked favorites', () => {
      const mockContextValue = {
        favorites: [],
        loading: false,
        error: null,
        removeFavorite: vi.fn(),
        refreshFavorites: vi.fn(),
      };

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockContextValue}>
            <FavoritesPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('No favorite charging stations saved yet')).toBeDefined();
      expect(screen.getByText('Find Charging Stations')).toBeDefined();
      expect(screen.getByTestId('empty-favorites-container')).toBeDefined();
    });

    it('renders loading spinner while retrieving saved favorites', () => {
      const mockContextValue = {
        favorites: [],
        loading: true,
        error: null,
        removeFavorite: vi.fn(),
        refreshFavorites: vi.fn(),
      };

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockContextValue}>
            <FavoritesPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Retrieving your favorite charging stations...')).toBeDefined();
    });

    it('renders list of favorite stations with metadata and statistics', () => {
      const mockFavorites = [
        {
          id: 1,
          stationId: 501,
          stationTitle: 'Market St Fast Charger',
          operatorName: 'EVgo',
          addressLine: '789 Market St',
          city: 'San Francisco',
          stateOrProvince: 'CA',
          countryCode: 'US',
          latitude: 37.785,
          longitude: -122.405,
          maxPowerKw: 100,
          totalConnectors: 4,
          connectorTypes: ['CCS', 'CHAdeMO'],
          createdAt: '2026-10-28T12:00:00Z',
        },
        {
          id: 2,
          stationId: 502,
          stationTitle: 'Embarcadero Hub',
          operatorName: 'ChargePoint',
          addressLine: '1 Ferry Building',
          city: 'San Francisco',
          stateOrProvince: 'CA',
          countryCode: 'US',
          latitude: 37.795,
          longitude: -122.393,
          maxPowerKw: 22,
          totalConnectors: 6,
          connectorTypes: ['Type 2'],
          createdAt: '2026-10-28T13:00:00Z',
        },
      ];

      const mockContextValue = {
        favorites: mockFavorites,
        loading: false,
        error: null,
        removeFavorite: vi.fn(),
        refreshFavorites: vi.fn(),
      };

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockContextValue}>
            <FavoritesPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      // Verify cards render
      expect(screen.getByText('Market St Fast Charger')).toBeDefined();
      expect(screen.getByText('Embarcadero Hub')).toBeDefined();
      expect(screen.getByText('EVgo')).toBeDefined();
      expect(screen.getByText('ChargePoint')).toBeDefined();
      expect(screen.getByText('100 kW')).toBeDefined();
      expect(screen.getByText('22 kW')).toBeDefined();
      expect(screen.getByText('4 Bays')).toBeDefined();
      expect(screen.getByText('6 Bays')).toBeDefined();

      // Verify summary metrics
      expect(screen.getByText('Saved Locations')).toBeDefined();
      expect(screen.getByText('Fast Chargers (50+ kW)')).toBeDefined();
      expect(screen.getByText('Total Charging Bays')).toBeDefined();
    });

    it('clicking remove button calls removeFavorite and displays status notice', async () => {
      const mockRemove = vi.fn().mockResolvedValue(true);
      const mockFavorites = [
        {
          id: 1,
          stationId: 501,
          stationTitle: 'Market St Fast Charger',
          operatorName: 'EVgo',
          city: 'San Francisco',
          totalConnectors: 4,
          connectorTypes: ['CCS'],
        },
      ];

      const mockContextValue = {
        favorites: mockFavorites,
        loading: false,
        error: null,
        removeFavorite: mockRemove,
        refreshFavorites: vi.fn(),
      };

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockContextValue}>
            <FavoritesPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      const removeBtn = screen.getByLabelText('Remove Market St Fast Charger from favorites');
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(501);
      });

      expect(screen.getByText('Removed "Market St Fast Charger" from your favorites.')).toBeDefined();
    });

    it('displays error banner with retry option on retrieval error', () => {
      const mockRefresh = vi.fn();
      const mockContextValue = {
        favorites: [],
        loading: false,
        error: 'Unable to connect to database.',
        removeFavorite: vi.fn(),
        refreshFavorites: mockRefresh,
      };

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockContextValue}>
            <FavoritesPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('Unable to connect to database.')).toBeDefined();

      const retryBtn = screen.getByText('Retry');
      fireEvent.click(retryBtn);
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe('StationCard Favorite Controls & Toggle', () => {
    const mockStation = {
      id: 777,
      title: 'Civic Center Fast Charger',
      operatorName: 'EVgo',
      location: {
        addressLine1: '350 McAllister St',
        city: 'San Francisco',
        stateOrProvince: 'CA',
        countryCode: 'US',
        latitude: 37.78,
        longitude: -122.42,
      },
      maxPowerKw: 150,
      totalConnectors: 4,
      connectorTypes: ['CCS'],
    };

    it('renders favorite button with outline when not favorited', () => {
      render(
        <MemoryRouter>
          <StationCard station={mockStation} isFavorite={false} />
        </MemoryRouter>
      );

      const favBtn = screen.getByTestId('favorite-btn-777');
      expect(favBtn).toBeDefined();
      expect(favBtn.getAttribute('aria-label')).toBe('Add to favorites');
    });

    it('renders favorite button with active label when favorited', () => {
      render(
        <MemoryRouter>
          <StationCard station={mockStation} isFavorite={true} />
        </MemoryRouter>
      );

      const favBtn = screen.getByTestId('favorite-btn-777');
      expect(favBtn.getAttribute('aria-label')).toBe('Remove from favorites');
    });

    it('invokes onToggleFavorite when heart button is clicked', async () => {
      const onToggle = vi.fn().mockResolvedValue(true);
      render(
        <MemoryRouter>
          <StationCard station={mockStation} isFavorite={false} onToggleFavorite={onToggle} />
        </MemoryRouter>
      );

      const favBtn = screen.getByTestId('favorite-btn-777');
      await act(async () => {
        fireEvent.click(favBtn);
      });

      expect(onToggle).toHaveBeenCalledWith(mockStation);
    });
  });

  describe('Frontend-Backend State Synchronization via FavoritesProvider', () => {
    const mockAuthContext = {
      user: { id: 1, email: 'driver@voltroute.com', firstName: 'Driver' },
      token: 'mock-jwt-token',
      isAuthenticated: true,
      logout: vi.fn(),
    };

    const mockStation = {
      id: 888,
      title: 'SoMa Fast Charger',
      operatorName: 'EVgo',
      location: {
        addressLine1: '500 Howard St',
        city: 'San Francisco',
        stateOrProvince: 'CA',
        countryCode: 'US',
        latitude: 37.788,
        longitude: -122.398,
      },
      maxPowerKw: 150,
      totalConnectors: 4,
      connectorTypes: ['CCS'],
    };

    it('loads favorites from backend on mount and reflects them in isFavorite', async () => {
      const initialFavorites = [
        {
          id: 1,
          stationId: 888,
          stationTitle: 'SoMa Fast Charger',
          operatorName: 'EVgo',
        },
      ];
      apiClient.get.mockResolvedValueOnce({ data: initialFavorites });

      render(
        <MemoryRouter>
          <AuthContext.Provider value={mockAuthContext}>
            <FavoritesProvider>
              <StationCard station={mockStation} />
            </FavoritesProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiClient.get).toHaveBeenCalledWith('/favorites');
      });

      const favBtn = await screen.findByTestId('favorite-btn-888');
      expect(favBtn.getAttribute('aria-label')).toBe('Remove from favorites');
    });

    it('reflects unauthenticated state by clearing favorites and preventing unauthorized actions', async () => {
      const unauthContext = {
        user: null,
        token: null,
        isAuthenticated: false,
        logout: vi.fn(),
      };

      render(
        <MemoryRouter>
          <AuthContext.Provider value={unauthContext}>
            <FavoritesProvider>
              <StationCard station={mockStation} />
            </FavoritesProvider>
          </AuthContext.Provider>
        </MemoryRouter>
      );

      // apiClient.get should NOT be called when unauthenticated
      expect(apiClient.get).not.toHaveBeenCalled();

      const favBtn = screen.getByTestId('favorite-btn-888');
      expect(favBtn.getAttribute('aria-label')).toBe('Add to favorites');
    });
  });
});
