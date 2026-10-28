import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import apiClient from '../api/client';
import authService from '../api/authService';
import stationService from '../api/stationService';

// Polyfill localStorage for Node test runner
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('AuthService API Module', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.restoreAllMocks();
  });

  it('register stores token and user profile on success', async () => {
    const mockResponse = {
      success: true,
      status: 201,
      message: 'User registered successfully',
      data: {
        token: 'jwt.mock.token.123',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: 1,
          email: 'driver@test.com',
          firstName: 'Alex',
          lastName: 'Driver',
          roles: ['ROLE_USER'],
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await authService.register({
      firstName: 'Alex',
      lastName: 'Driver',
      email: 'driver@test.com',
      password: 'password123',
    });

    expect(result.token).toBe('jwt.mock.token.123');
    expect(result.user.email).toBe('driver@test.com');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('voltroute_token', 'jwt.mock.token.123');
    expect(authService.isAuthenticated()).toBe(true);
  });

  it('login stores token and user profile on success', async () => {
    const mockResponse = {
      success: true,
      status: 200,
      message: 'User logged in successfully',
      data: {
        token: 'jwt.mock.token.456',
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: 2,
          email: 'jane@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
          roles: ['ROLE_USER'],
        },
      },
    };

    vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

    const result = await authService.login({
      email: 'jane@test.com',
      password: 'password123',
    });

    expect(result.token).toBe('jwt.mock.token.456');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('voltroute_token', 'jwt.mock.token.456');
    expect(authService.getCurrentUser().email).toBe('jane@test.com');
  });

  it('getProfile updates cached user in localStorage', async () => {
    const mockProfileResponse = {
      success: true,
      status: 200,
      data: {
        id: 3,
        email: 'profile@test.com',
        firstName: 'Sam',
        lastName: 'EV',
        roles: ['ROLE_USER'],
      },
    };

    vi.spyOn(apiClient, 'get').mockResolvedValue(mockProfileResponse);

    const profile = await authService.getProfile();
    expect(profile.id).toBe(3);
    expect(authService.getCurrentUser().firstName).toBe('Sam');
  });

  it('logout purges token and user data from storage', () => {
    localStorageMock.setItem('voltroute_token', 'sample.token');
    localStorageMock.setItem('voltroute_user', JSON.stringify({ email: 'test@ev.com' }));

    authService.logout();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('voltroute_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('voltroute_user');
    expect(authService.getToken()).toBeNull();
    expect(authService.getCurrentUser()).toBeNull();
    expect(authService.isAuthenticated()).toBe(false);
  });
});

describe('StationService API Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getNearbyStations correctly passes query params and unwraps data', async () => {
    const mockStations = [
      {
        id: 101,
        title: 'SF Downtown Fast Charging Hub',
        operatorName: 'EVgo',
        location: { latitude: 37.7749, longitude: -122.4194, city: 'San Francisco', distanceKm: 0.5 },
        maxPowerKw: 150.0,
        totalConnectors: 4,
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      status: 200,
      data: mockStations,
    });

    const result = await stationService.getNearbyStations({
      latitude: 37.7749,
      longitude: -122.4194,
      radiusKm: 10,
      minPowerKw: 50,
      emptyFilter: null,
    });

    expect(getSpy).toHaveBeenCalledWith('/stations', {
      params: {
        latitude: 37.7749,
        longitude: -122.4194,
        radiusKm: 10,
        minPowerKw: 50,
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('SF Downtown Fast Charging Hub');
  });

  it('searchStations handles city and country queries', async () => {
    const mockStations = [
      {
        id: 202,
        title: 'Richmond Central Supercharger',
        location: { city: 'Richmond', countryCode: 'US' },
      },
    ];

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      status: 200,
      data: mockStations,
    });

    const result = await stationService.searchStations({
      city: 'Richmond',
      countryCode: 'US',
      radiusKm: 15,
    });

    expect(getSpy).toHaveBeenCalledWith('/stations/search', {
      params: {
        city: 'Richmond',
        countryCode: 'US',
        radiusKm: 15,
      },
    });
    expect(result).toHaveLength(1);
    expect(result[0].location.city).toBe('Richmond');
  });

  it('getStationById retrieves detailed station data', async () => {
    const mockDetail = {
      id: 303,
      title: 'Detailed Station Profile',
      operatorWebsite: 'https://evgo.com',
      connectors: [
        { connectionTypeName: 'CCS (Type 1)', powerKw: 150.0, quantity: 2, isFastChargeCapable: true },
      ],
    };

    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      status: 200,
      data: mockDetail,
    });

    const result = await stationService.getStationById(303);
    expect(getSpy).toHaveBeenCalledWith('/stations/303');
    expect(result.id).toBe(303);
    expect(result.connectors).toHaveLength(1);
  });
});
