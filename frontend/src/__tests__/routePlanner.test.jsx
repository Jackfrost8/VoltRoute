import React, { act } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '../api/client';
import routeService from '../api/routeService';
import RoutePlannerPage from '../pages/RoutePlannerPage';
import { FavoritesContext } from '../context/FavoritesContext';

// Mock Leaflet and React-Leaflet
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="route-map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="map-popup">{children}</div>,
  Polyline: () => <div data-testid="map-polyline" />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn().mockReturnValue({}),
    latLngBounds: vi.fn().mockReturnValue({}),
  },
  divIcon: vi.fn().mockReturnValue({}),
  latLngBounds: vi.fn().mockReturnValue({}),
}));

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

describe('Phase 9: Route Planning & Charging Stop Recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('routeService API Client', () => {
    it('planRoute sends properly formatted payload to POST /routes/plan', async () => {
      const mockResponse = {
        distanceKm: 140.0,
        durationMinutes: 90.0,
        geometry: [[37.77, -122.41], [38.58, -121.49]],
        feasibility: 'FEASIBLE_DIRECT',
        isChargingRequired: false,
        recommendedStops: [],
        allCandidateStops: [],
      };

      apiClient.post.mockResolvedValueOnce({ data: mockResponse });

      const params = {
        originLatitude: 37.7749,
        originLongitude: -122.4194,
        originName: 'San Francisco, CA',
        destinationLatitude: 38.5816,
        destinationLongitude: -121.4944,
        destinationName: 'Sacramento, CA',
        vehicleRangeKm: 300,
        currentBatteryPercent: 80,
        minPowerKw: 50,
        connectorType: 'CCS',
      };

      const result = await routeService.planRoute(params);

      expect(apiClient.post).toHaveBeenCalledWith('/routes/plan', {
        originLatitude: 37.7749,
        originLongitude: -122.4194,
        originName: 'San Francisco, CA',
        destinationLatitude: 38.5816,
        destinationLongitude: -121.4944,
        destinationName: 'Sacramento, CA',
        vehicleRangeKm: 300,
        currentBatteryPercent: 80,
        minPowerKw: 50,
        connectorType: 'CCS',
        maxDetourKm: 15.0,
      });
      expect(result).toEqual(mockResponse);
    });

    it('planRoute throws validation error when origin coordinates are missing', async () => {
      await expect(
        routeService.planRoute({ destinationLatitude: 38.0, destinationLongitude: -121.0 })
      ).rejects.toThrow('Origin coordinates are required.');
    });

    it('planRoute throws validation error when destination coordinates are missing', async () => {
      await expect(
        routeService.planRoute({ originLatitude: 37.0, originLongitude: -122.0 })
      ).rejects.toThrow('Destination coordinates are required.');
    });
  });

  describe('RoutePlannerPage UI Component', () => {
    const mockFavoritesContext = {
      favorites: [],
      isFavorite: vi.fn().mockReturnValue(false),
      toggleFavorite: vi.fn(),
    };

    it('renders input parameters, preset buttons, and submit CTA', () => {
      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockFavoritesContext}>
            <RoutePlannerPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      expect(screen.getByText('EV Route Planner & Charging Recommendations')).toBeDefined();
      expect(screen.getByText('San Francisco → Sacramento')).toBeDefined();
      expect(screen.getByText('Calculate EV Route & Stops')).toBeDefined();
      expect(screen.getByText('Full Range (km)')).toBeDefined();
    });

    it('clicking preset updates form fields', () => {
      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockFavoritesContext}>
            <RoutePlannerPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      const presetBtn = screen.getByText('Los Angeles → San Diego');
      fireEvent.click(presetBtn);

      expect(screen.getByDisplayValue('Los Angeles, CA')).toBeDefined();
      expect(screen.getByDisplayValue('San Diego, CA')).toBeDefined();
      expect(screen.getByDisplayValue('34.0522')).toBeDefined();
      expect(screen.getByDisplayValue('32.7157')).toBeDefined();
    });

    it('submits route plan and displays telemetry, feasibility, disclaimer, and recommended stop', async () => {
      const mockResult = {
        distanceKm: 140.0,
        durationMinutes: 90.0,
        geometry: [[37.77, -122.41], [38.25, -122.04], [38.58, -121.49]],
        feasibility: 'FEASIBLE_WITH_STOPS',
        feasibilityNotice: 'Deterministic range estimate. Real-world EV range varies with speed and temperature.',
        isChargingRequired: true,
        estimatedStopsNeeded: 1,
        recommendedStops: [
          {
            station: {
              id: 999,
              title: 'Fairfield Supercharger Hub',
              operatorName: 'Tesla',
              maxPowerKw: 250.0,
              totalConnectors: 12,
              location: { latitude: 38.25, longitude: -122.04 },
            },
            detourDistanceKm: 0.8,
            distanceFromOriginKm: 65.0,
            estimatedBatteryAtArrivalPercent: 28.5,
            compositeScore: 92.4,
            rankingReason: 'Ultra-Fast DC (250 kW) • 0.8 km detour • 12 bays • CCS matched',
            isRecommendedStop: true,
          },
        ],
        allCandidateStops: [],
      };

      apiClient.post.mockResolvedValueOnce({ data: mockResult });

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockFavoritesContext}>
            <RoutePlannerPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      const submitBtn = screen.getByText('Calculate EV Route & Stops');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(screen.getByText('140 km')).toBeDefined();
      });

      expect(screen.getByText('1h 30m')).toBeDefined();
      expect(screen.getByText('Stops Recommended')).toBeDefined();
      expect(screen.getByText('Fairfield Supercharger Hub')).toBeDefined();
      expect(screen.getByText('0.8 km off route')).toBeDefined();
      expect(screen.getByText('92.4 / 100')).toBeDefined();
      expect(screen.getByText(/Deterministic range estimate/)).toBeDefined();
      expect(screen.getByTestId('route-map-container')).toBeDefined();
    });

    it('displays error banner when provider fails', async () => {
      apiClient.post.mockRejectedValueOnce(
        new Error('OpenRouteService connection timed out or is unreachable')
      );

      render(
        <MemoryRouter>
          <FavoritesContext.Provider value={mockFavoritesContext}>
            <RoutePlannerPage />
          </FavoritesContext.Provider>
        </MemoryRouter>
      );

      const submitBtn = screen.getByText('Calculate EV Route & Stops');
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByText('OpenRouteService connection timed out or is unreachable')
        ).toBeDefined();
      });
    });
  });
});
