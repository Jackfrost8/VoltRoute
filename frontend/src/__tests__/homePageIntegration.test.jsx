import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '../pages/HomePage';
import stationService from '../api/stationService';

describe('HomePage Integration & Dynamic Backend Data Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches stations dynamically from backend API on mount', async () => {
    const mockApiStations = [
      {
        id: 991,
        title: 'Backend Verified Hub A',
        operatorName: 'Electrify America',
        location: {
          city: 'San Francisco',
          latitude: 37.7749,
          longitude: -122.4194,
          distanceKm: 0.8,
        },
        maxPowerKw: 350.0,
        totalConnectors: 6,
        operationalStatus: 'Operational',
      },
    ];

    const getNearbySpy = vi
      .spyOn(stationService, 'getNearbyStations')
      .mockResolvedValue(mockApiStations);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(getNearbySpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('Backend Verified Hub A')).toBeDefined();
      expect(screen.getByText('350 kW')).toBeDefined();
      expect(screen.getByText(/1 of 1 matched/i)).toBeDefined();
    });
  });

  it('renders empty result state when backend returns zero stations', async () => {
    vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue([]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No charging stations found')).toBeDefined();
      expect(
        screen.getByText(/No verified stations found within the specified radius/i)
      ).toBeDefined();
    });
  });

  it('renders error banner with retry button on backend failure', async () => {
    vi.spyOn(stationService, 'getNearbyStations').mockRejectedValue(
      new Error('External Open Charge Map provider failure')
    );

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Search Error')).toBeDefined();
      expect(screen.getByText('External Open Charge Map provider failure')).toBeDefined();
      expect(screen.getByRole('button', { name: /retry search/i })).toBeDefined();
    });
  });

  it('executes city and country search against searchStations backend endpoint', async () => {
    vi.spyOn(stationService, 'getNearbyStations').mockResolvedValue([]);
    const searchSpy = vi.spyOn(stationService, 'searchStations').mockResolvedValue([
      {
        id: 992,
        title: 'Richmond Downtown Supercharger',
        location: { city: 'Richmond', countryCode: 'US', latitude: 37.54, longitude: -77.43 },
        maxPowerKw: 150.0,
        totalConnectors: 8,
      },
    ]);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Wait for initial mount query to resolve
    await waitFor(() => {
      expect(screen.queryByText(/Searching/i)).toBeNull();
    });

    // Switch to City search mode
    const cityTab = screen.getByText('City & Town Search');
    fireEvent.click(cityTab);

    const cityInput = screen.getByPlaceholderText('e.g. Richmond or Seattle');
    fireEvent.change(cityInput, { target: { value: 'Richmond' } });

    const form = cityInput.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(searchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          city: 'Richmond',
          countryCode: 'US',
        })
      );
      expect(screen.getByText('Richmond Downtown Supercharger')).toBeDefined();
    });
  });
});
