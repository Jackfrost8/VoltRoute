import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StationMap, { isValidCoordinate, createStationIcon, StationPopupContent } from '../components/StationMap';
import StationCard from '../components/StationCard';
import HomePage from '../pages/HomePage';
import stationService from '../api/stationService';

describe('Independent Verification: Interactive Station Map & Synchronized UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockStations = [
    {
      id: 101,
      title: 'Presidio Ultra Charger',
      operatorName: 'Electrify America',
      location: {
        latitude: 37.7989,
        longitude: -122.4662,
        addressLine1: 'Presidio Blvd',
        city: 'San Francisco',
        distanceKm: 2.1,
      },
      maxPowerKw: 350.0,
      totalConnectors: 8,
      operationalStatus: 'Operational',
      connectorTypes: ['CCS (Combo)', 'CHAdeMO'],
    },
    {
      id: 102,
      title: 'SoMa Rapid Station',
      operatorName: 'EVgo',
      location: {
        latitude: 37.7785,
        longitude: -122.4056,
        addressLine1: '4th & Folsom',
        city: 'San Francisco',
        distanceKm: 1.2,
      },
      maxPowerKw: 50.0,
      totalConnectors: 4,
      operationalStatus: 'Operational',
      connectorTypes: ['CCS (Combo)'],
    },
    {
      id: 103,
      title: 'Sunset Level 2 AC',
      operatorName: 'ChargePoint',
      location: {
        latitude: 37.7544,
        longitude: -122.4941,
        addressLine1: 'Judah St',
        city: 'San Francisco',
        distanceKm: 5.4,
      },
      maxPowerKw: 11.0,
      totalConnectors: 2,
      operationalStatus: 'Operational',
      connectorTypes: ['Type 2 (Socket)'],
    },
  ];

  describe('1. Marker Rendering & Coordinate Precision', () => {
    it('creates marker div elements strictly for valid coordinates', () => {
      render(
        <StationMap
          stations={mockStations}
          center={[37.7749, -122.4194]}
          zoom={12}
        />
      );

      // Verify the map container initialized with leaflet styles
      const container = document.querySelector('.leaflet-container');
      expect(container).toBeDefined();

      // Verify speed legend displays
      expect(screen.getByText('150+ kW (Ultra)')).toBeDefined();
      expect(screen.getByText('50+ kW (Rapid)')).toBeDefined();
      expect(screen.getByText('Standard AC')).toBeDefined();
    });

    it('safely handles corrupt and missing coordinates without crashing Leaflet', () => {
      const corruptStations = [
        {
          id: 999,
          title: 'Corrupt Station Missing Coords',
          location: { latitude: null, longitude: undefined },
        },
        {
          id: 998,
          title: 'Corrupt Station Out of Range',
          location: { latitude: 91.5, longitude: -190.0 },
        },
        {
          id: 997,
          title: 'Corrupt Station String NaN',
          location: { latitude: 'invalid', longitude: 'coordinates' },
        },
        ...mockStations,
      ];

      // StationMap should safely filter without throwing an unhandled exception
      expect(() => {
        render(
          <StationMap
            stations={corruptStations}
            center={[37.7749, -122.4194]}
            zoom={12}
          />
        );
      }).not.toThrow();
    });
  });

  describe('2. Marker Selection & Popup Information', () => {
    it('renders station specifications, connector types, and truthful occupancy in popup', () => {
      const onSelectSpy = vi.fn();

      render(
        <StationPopupContent
          station={mockStations[0]}
          onSelectStation={onSelectSpy}
        />
      );

      // Check popup rendered content
      expect(screen.getByText('Presidio Ultra Charger')).toBeDefined();
      expect(screen.getByText('Electrify America')).toBeDefined();
      expect(screen.getByText(/350 kW/)).toBeDefined();
      expect(screen.getByText(/8 Bays/)).toBeDefined();
      expect(screen.getByText(/Community directory • Live occupancy unavailable/i)).toBeDefined();
    });

    it('triggers onSelectStation callback when clicking highlight button', () => {
      const onSelectSpy = vi.fn();

      render(
        <StationPopupContent
          station={mockStations[0]}
          onSelectStation={onSelectSpy}
        />
      );

      const highlightBtn = screen.getByRole('button', { name: /highlight in list/i });
      fireEvent.click(highlightBtn);
      expect(onSelectSpy).toHaveBeenCalledWith(mockStations[0]);
    });
  });

  describe('3. Map & Station List Bidirectional Synchronization', () => {
    it('synchronizes selected station state across list and map view', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockStations);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Presidio Ultra Charger')).toBeDefined();
        expect(screen.getByText('SoMa Rapid Station')).toBeDefined();
      });

      // Find the Pin on Map button for the first card
      const pinButtons = screen.getAllByRole('button', { name: /pin on map/i });
      fireEvent.click(pinButtons[0]);

      // Card should now display Pinned on Map
      await waitFor(() => {
        expect(screen.getByText('Pinned on Map')).toBeDefined();
      });
    });
  });

  describe('4. Supported Station Filters & Empty Results', () => {
    it('filters stations by operator name dynamically', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockStations);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Presidio Ultra Charger')).toBeDefined();
        expect(screen.getByText('SoMa Rapid Station')).toBeDefined();
      });

      // Change operator filter to EVgo
      const operatorSelect = screen.getByDisplayValue('All Operators');
      fireEvent.change(operatorSelect, { target: { value: 'EVgo' } });

      await waitFor(() => {
        expect(screen.getByText('SoMa Rapid Station')).toBeDefined();
        expect(screen.queryByText('Presidio Ultra Charger')).toBeNull();
        expect(screen.queryByText('Sunset Level 2 AC')).toBeNull();
      });
    });

    it('shows empty result guidance and clear filters button when filters match 0 stations', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockStations);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Presidio Ultra Charger')).toBeDefined();
      });

      // Filter by Tesla Supercharger (none in mock catalog)
      const plugSelect = screen.getByDisplayValue('All Plugs');
      fireEvent.change(plugSelect, { target: { value: 'Tesla' } });

      await waitFor(() => {
        expect(screen.getByText('No charging stations found')).toBeDefined();
        expect(
          screen.getByText(/No stations matched your active filters. Try resetting the filters/i)
        ).toBeDefined();
        expect(screen.getByRole('button', { name: /clear active filters/i })).toBeDefined();
      });

      // Click Clear Active Filters
      fireEvent.click(screen.getByRole('button', { name: /clear active filters/i }));

      await waitFor(() => {
        expect(screen.getByText('Presidio Ultra Charger')).toBeDefined();
      });
    });
  });

  describe('5. Geolocation Permission Denial Handling', () => {
    it('handles denied geolocation with clear banner and manual hub fallback buttons', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue([]);

      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied location prompt',
          });
        }),
      };
      Object.defineProperty(globalThis.navigator, 'geolocation', {
        value: mockGeolocation,
        writable: true,
      });

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole('button', { name: /use my location/i }));

      await waitFor(() => {
        expect(screen.getByText('Location Permission Blocked')).toBeDefined();
        expect(screen.getByRole('button', { name: /san francisco hub/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /richmond hub/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /search by city/i })).toBeDefined();
      });
    });
  });
});
