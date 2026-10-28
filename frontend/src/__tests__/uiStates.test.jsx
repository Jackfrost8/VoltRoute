import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoadingSpinner from '../components/LoadingSpinner';
import StationCard from '../components/StationCard';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthContext } from '../context/AuthContext';
import stationService from '../api/stationService';

describe('UI State & Component Verification', () => {
  describe('LoadingSpinner Component', () => {
    it('renders default spinner text', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('renders custom spinner text', () => {
      render(<LoadingSpinner text="Searching charging networks..." />);
      expect(screen.getByText('Searching charging networks...')).toBeDefined();
    });
  });

  describe('StationCard Component', () => {
    const mockStation = {
      id: 555,
      title: 'Mission District Supercharger',
      operatorName: 'Tesla',
      location: {
        addressLine1: '2001 Mission St',
        city: 'San Francisco',
        stateOrProvince: 'CA',
        countryCode: 'US',
        distanceKm: 1.4,
        latitude: 37.76,
        longitude: -122.42,
      },
      maxPowerKw: 250.0,
      totalConnectors: 12,
      operationalStatus: 'Operational',
      connectorTypes: ['Tesla Supercharger', 'CCS'],
    };

    it('renders station header, power badge, and community directory badge', () => {
      render(<StationCard station={mockStation} />);
      expect(screen.getByText('Mission District Supercharger')).toBeDefined();
      expect(screen.getByText('Tesla')).toBeDefined();
      expect(screen.getByText('250 kW')).toBeDefined();
      expect(screen.getByText('12 Points')).toBeDefined();
      expect(screen.getByText('Directory Registry (Static)')).toBeDefined();
    });

    it('expands technical specifications on toggle', async () => {
      const mockDetail = {
        id: 555,
        accessComments: '24/7 access located in garage level 2',
        operatorWebsite: 'https://tesla.com',
        connectors: [
          {
            connectionTypeName: 'Tesla Supercharger',
            powerKw: 250.0,
            quantity: 12,
            isFastChargeCapable: true,
          },
        ],
      };

      vi.spyOn(stationService, 'getStationById').mockResolvedValue(mockDetail);

      render(<StationCard station={mockStation} />);
      const expandBtn = screen.getByText('View Specifications');
      fireEvent.click(expandBtn);

      await waitFor(() => {
        expect(screen.getByText(/24\/7 access located in garage level 2/)).toBeDefined();
        expect(screen.getByText('Operator Website')).toBeDefined();
        expect(screen.getByText('Hide Details')).toBeDefined();
      });
    });

    it('triggers map pin recenter callback when button is clicked', () => {
      const onSelectMap = vi.fn();
      render(<StationCard station={mockStation} onSelectOnMap={onSelectMap} />);
      const pinBtn = screen.getByText('Pin on Map');
      fireEvent.click(pinBtn);
      expect(onSelectMap).toHaveBeenCalledWith(mockStation);
    });
  });

  describe('ProtectedRoute Guard', () => {
    it('redirects unauthenticated users to /login', () => {
      const mockAuthValue = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile']}>
            <Routes>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div>Secret Profile Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Redirected Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Redirected Login Page')).toBeDefined();
      expect(screen.queryByText('Secret Profile Content')).toBeNull();
    });

    it('renders protected child component when authenticated', () => {
      const mockAuthValue = {
        user: { id: 1, email: 'ev@voltroute.com' },
        token: 'active-jwt-token',
        isAuthenticated: true,
        isLoading: false,
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile']}>
            <Routes>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div>Secret Profile Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Redirected Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Secret Profile Content')).toBeDefined();
    });

    it('displays loading indicator while auth status is resolving', () => {
      const mockAuthValue = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true,
      };

      render(
        <AuthContext.Provider value={mockAuthValue}>
          <MemoryRouter initialEntries={['/profile']}>
            <Routes>
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <div>Secret Profile Content</div>
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<div>Redirected Login Page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      );

      expect(screen.getByText('Checking authentication session...')).toBeDefined();
    });
  });
});
