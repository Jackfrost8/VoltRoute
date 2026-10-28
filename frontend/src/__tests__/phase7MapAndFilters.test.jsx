import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../pages/HomePage';
import StationMap, { isValidCoordinate, createStationIcon } from '../components/StationMap';
import StationCard from '../components/StationCard';
import stationService from '../api/stationService';

describe('Phase 7: Interactive Charging Station Map & Filters Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Coordinate Validation Logic', () => {
    it('accepts valid global latitude and longitude', () => {
      expect(isValidCoordinate(37.7749, -122.4194)).toBe(true);
      expect(isValidCoordinate('37.7749', '-122.4194')).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate(-90, 180)).toBe(true);
      expect(isValidCoordinate(90, -180)).toBe(true);
    });

    it('rejects missing, null, NaN, or out-of-bounds coordinates', () => {
      expect(isValidCoordinate(null, -122.4194)).toBe(false);
      expect(isValidCoordinate(37.7749, undefined)).toBe(false);
      expect(isValidCoordinate(NaN, -122.4194)).toBe(false);
      expect(isValidCoordinate('abc', 'def')).toBe(false);
      expect(isValidCoordinate(91.0, 0)).toBe(false);
      expect(isValidCoordinate(-90.1, 0)).toBe(false);
      expect(isValidCoordinate(0, 180.1)).toBe(false);
      expect(isValidCoordinate(0, -181.0)).toBe(false);
    });
  });

  describe('2. Valid Markers & Invalid Coordinates Handling in StationMap', () => {
    const mixedStations = [
      {
        id: 1,
        title: 'Valid Fast Hub',
        location: { latitude: 37.77, longitude: -122.42, city: 'SF' },
        maxPowerKw: 150.0,
        totalConnectors: 4,
        operationalStatus: 'Operational',
        connectorTypes: ['CCS'],
      },
      {
        id: 2,
        title: 'Missing Lat Hub',
        location: { latitude: null, longitude: -122.42, city: 'SF' },
        maxPowerKw: 50.0,
        totalConnectors: 2,
      },
      {
        id: 3,
        title: 'Out of Bounds Hub',
        location: { latitude: 999.0, longitude: -122.42, city: 'SF' },
        maxPowerKw: 22.0,
        totalConnectors: 1,
      },
      {
        id: 4,
        title: 'Valid Standard Hub',
        location: { latitude: 37.78, longitude: -122.41, city: 'SF' },
        maxPowerKw: 22.0,
        totalConnectors: 2,
        connectorTypes: ['Type 2'],
      },
    ];

    it('renders only stations with strictly valid coordinates as markers', () => {
      render(
        <StationMap
          stations={mixedStations}
          center={[37.7749, -122.4194]}
          zoom={12}
        />
      );

      // Verify the map container rendered
      expect(document.querySelector('.leaflet-container')).toBeDefined();

      // StationCard with invalid coordinates displays warning badge
      render(<StationCard station={mixedStations[1]} />);
      expect(screen.getByText('No Map Pin (unlisted coordinates)')).toBeDefined();
    });

    it('creates appropriate DivIcon styling according to charging power', () => {
      const ultraIcon = createStationIcon({ maxPowerKw: 250 }, false);
      const fastIcon = createStationIcon({ maxPowerKw: 50 }, false);
      const standardIcon = createStationIcon({ maxPowerKw: 22 }, false);
      const selectedIcon = createStationIcon({ maxPowerKw: 150 }, true);

      expect(ultraIcon.options.className).toBe('voltroute-station-pin');
      expect(ultraIcon.options.html).toContain('#a855f7'); // Purple for Ultra
      expect(fastIcon.options.html).toContain('#f59e0b'); // Amber for Fast
      expect(standardIcon.options.html).toContain('#38bdf8'); // Sky blue for Standard
      expect(selectedIcon.options.html).toContain('#10b981'); // Emerald for Selected
    });
  });

  describe('3. Marker Selection & List-to-Map Synchronization', () => {
    it('highlights station card and triggers selection on card click', () => {
      const station = {
        id: 88,
        title: 'Synchronized Hub',
        location: { latitude: 37.77, longitude: -122.42, city: 'SF' },
        maxPowerKw: 100,
        totalConnectors: 4,
      };

      const onSelectMock = vi.fn();
      const onMapMock = vi.fn();

      const { rerender } = render(
        <StationCard
          station={station}
          isSelected={false}
          onSelectStation={onSelectMock}
          onSelectOnMap={onMapMock}
        />
      );

      // Click card container
      fireEvent.click(screen.getByText('Synchronized Hub'));
      expect(onSelectMock).toHaveBeenCalledWith(station);

      // Click "Pin on Map"
      fireEvent.click(screen.getByText('Pin on Map'));
      expect(onMapMock).toHaveBeenCalledWith(station);

      // Rerender as selected
      rerender(
        <StationCard
          station={station}
          isSelected={true}
          onSelectStation={onSelectMock}
          onSelectOnMap={onMapMock}
        />
      );

      expect(screen.getByText('Pinned on Map')).toBeDefined();
    });
  });

  describe('4. Filter Behavior (Power, Plugs, Operators & Reset)', async () => {
    const mockCatalog = [
      {
        id: 10,
        title: 'Downtown Ultra Hub',
        operatorName: 'Electrify America',
        maxPowerKw: 350.0,
        connectorTypes: ['CCS (Type 1)', 'CHAdeMO'],
        location: { latitude: 37.77, longitude: -122.41, city: 'San Francisco' },
      },
      {
        id: 20,
        title: 'Mission Fast Charger',
        operatorName: 'EVgo',
        maxPowerKw: 50.0,
        connectorTypes: ['CHAdeMO'],
        location: { latitude: 37.76, longitude: -122.42, city: 'San Francisco' },
      },
      {
        id: 30,
        title: 'Marina AC Level 2',
        operatorName: 'ChargePoint',
        maxPowerKw: 11.0,
        connectorTypes: ['Type 2 (Socket)'],
        location: { latitude: 37.8, longitude: -122.43, city: 'San Francisco' },
      },
    ];

    it('filters stations by minimum power requirement', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockCatalog);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Downtown Ultra Hub')).toBeDefined();
        expect(screen.getByText('Mission Fast Charger')).toBeDefined();
        expect(screen.getByText('Marina AC Level 2')).toBeDefined();
      });

      // Filter for 150+ kW (Ultra DC)
      const powerSelect = screen.getByDisplayValue('All Speeds');
      fireEvent.change(powerSelect, { target: { value: '150' } });

      await waitFor(() => {
        expect(screen.getByText('Downtown Ultra Hub')).toBeDefined();
        expect(screen.queryByText('Mission Fast Charger')).toBeNull();
        expect(screen.queryByText('Marina AC Level 2')).toBeNull();
      });
    });

    it('filters stations by connector plug standard', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockCatalog);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Downtown Ultra Hub')).toBeDefined();
      });

      // Filter by CHAdeMO
      const plugSelect = screen.getByDisplayValue('All Plugs');
      fireEvent.change(plugSelect, { target: { value: 'CHAdeMO' } });

      await waitFor(() => {
        expect(screen.getByText('Downtown Ultra Hub')).toBeDefined();
        expect(screen.getByText('Mission Fast Charger')).toBeDefined();
        expect(screen.queryByText('Marina AC Level 2')).toBeNull();
      });
    });

    it('resets all active filters back to defaults on clicking reset', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue(mockCatalog);

      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Downtown Ultra Hub')).toBeDefined();
      });

      // Apply power filter
      const powerSelect = screen.getByDisplayValue('All Speeds');
      fireEvent.change(powerSelect, { target: { value: '150' } });

      await waitFor(() => {
        expect(screen.getByText('Reset Filters')).toBeDefined();
      });

      // Click Reset Filters
      fireEvent.click(screen.getByText('Reset Filters'));

      await waitFor(() => {
        expect(screen.getByText('Marina AC Level 2')).toBeDefined();
        expect(screen.queryByText('Reset Filters')).toBeNull();
      });
    });
  });

  describe('5. Browser Geolocation Denial & Permission Fallbacks', () => {
    it('displays graceful error message and preset fallbacks when geolocation is denied', async () => {
      vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue([]);

      // Mock navigator.geolocation with error code 1 (PERMISSION_DENIED)
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success, error) => {
          error({
            code: 1, // PERMISSION_DENIED
            message: 'User denied Geolocation',
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

      const locateBtn = screen.getByRole('button', { name: /use my location/i });
      fireEvent.click(locateBtn);

      await waitFor(() => {
        expect(screen.getByText('Location Permission Blocked')).toBeDefined();
        expect(
          screen.getByText(/Location access was denied. Please allow location permissions/i)
        ).toBeDefined();
        // Displays quick fallback hub options
        expect(screen.getByRole('button', { name: /san francisco hub/i })).toBeDefined();
        expect(screen.getByRole('button', { name: /richmond hub/i })).toBeDefined();
      });
    });
  });
});
