export const BASE_URL = 'http://localhost:8080/api';

export const APP_NAME = 'VoltRoute';
export const APP_TAGLINE = 'AI-Powered EV Charging Station Finder';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  FAVORITES: '/favorites',
  STATION_DETAILS: '/station/:id',
  ROUTE_OPTIMIZER: '/route-optimizer',
  DEMAND_PREDICTION: '/demand-prediction',
  TRAVEL_PREDICTION: '/travel-prediction',
};

export const CHARGER_TYPES = ['Level 1', 'Level 2', 'DC Fast'];
export const CONNECTOR_TYPES = ['J1772', 'CCS', 'CHAdeMO', 'Tesla'];
