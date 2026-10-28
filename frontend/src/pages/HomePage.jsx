import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  MapPin,
  Navigation,
  Zap,
  AlertCircle,
  RefreshCw,
  Filter,
  SlidersHorizontal,
  Info,
  X,
  Layers,
  List,
  Compass,
  AlertTriangle,
} from 'lucide-react';
import stationService from '../api/stationService';
import StationCard from '../components/StationCard';
import StationMap, { isValidCoordinate } from '../components/StationMap';
import LoadingSpinner from '../components/LoadingSpinner';

const PRESET_LOCATIONS = [
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194, country: 'US' },
  { name: 'Richmond', lat: 37.5407, lon: -77.436, country: 'US' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'GB' },
  { name: 'Berlin', lat: 52.52, lon: 13.405, country: 'DE' },
];

const CONNECTOR_OPTIONS = [
  { label: 'All Plugs', value: 'all' },
  { label: 'CCS (Combo)', value: 'CCS' },
  { label: 'CHAdeMO', value: 'CHAdeMO' },
  { label: 'Type 2 (Mennekes)', value: 'Type 2' },
  { label: 'Tesla Supercharger', value: 'Tesla' },
];

export function HomePage() {
  const location = useLocation();
  const [searchMode, setSearchMode] = useState('coords'); // 'coords' | 'city'

  // Coordinate search inputs
  const [latitude, setLatitude] = useState(
    location.state?.centerLat != null ? String(location.state.centerLat) : '37.7749'
  );
  const [longitude, setLongitude] = useState(
    location.state?.centerLon != null ? String(location.state.centerLon) : '-122.4194'
  );
  const [radiusKm, setRadiusKm] = useState('10');

  // City search inputs
  const [city, setCity] = useState('');
  const [countryCode, setCountryCode] = useState('US');

  // Filter controls
  const [minPowerKw, setMinPowerKw] = useState('');
  const [connectorFilter, setConnectorFilter] = useState('all');
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [maxResults, setMaxResults] = useState('25');

  // Data & execution state
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Map and list synchronization state
  const [mapCenter, setMapCenter] = useState(
    location.state?.centerLat != null && location.state?.centerLon != null
      ? [location.state.centerLat, location.state.centerLon]
      : [37.7749, -122.4194]
  );
  const [mapZoom, setMapZoom] = useState(location.state?.stationId ? 15 : 12);
  const [selectedStationId, setSelectedStationId] = useState(location.state?.stationId || null);

  // Mobile view toggle ('list' | 'map')
  const [mobileView, setMobileView] = useState('list');

  // Geolocation handling state
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [geoDenied, setGeoDenied] = useState(false);

  const fetchStations = useCallback(
    async (isInitial = false) => {
      setLoading(true);
      setError(null);
      setGeoError(null);

      try {
        let result = [];
        if (searchMode === 'city') {
          if (!city.trim()) {
            setError('Please enter a city or town name.');
            setLoading(false);
            return;
          }
          result = await stationService.searchStations({
            city: city.trim(),
            countryCode: countryCode.trim().toUpperCase() || undefined,
            radiusKm: Number(radiusKm) || 15,
            maxResults: Number(maxResults) || 25,
          });
        } else {
          const latNum = parseFloat(latitude);
          const lonNum = parseFloat(longitude);

          if (!isValidCoordinate(latNum, lonNum)) {
            setError('Please provide valid coordinates: Latitude (-90 to 90) and Longitude (-180 to 180).');
            setLoading(false);
            return;
          }

          result = await stationService.getNearbyStations({
            latitude: latNum,
            longitude: lonNum,
            radiusKm: Number(radiusKm) || 10,
            maxResults: Number(maxResults) || 25,
            minPowerKw: minPowerKw ? Number(minPowerKw) : undefined,
          });

          setMapCenter([latNum, lonNum]);
          setMapZoom(12);
        }

        setStations(result);
        setHasSearched(true);
        setSelectedStationId(null);

        // Recenter map on first valid station for city search
        if (searchMode === 'city' && result.length > 0) {
          const firstWithCoords = result.find(
            (s) => s.location && isValidCoordinate(s.location.latitude, s.location.longitude)
          );
          if (firstWithCoords) {
            setMapCenter([firstWithCoords.location.latitude, firstWithCoords.location.longitude]);
            setMapZoom(12);
          }
        }
      } catch (err) {
        console.error('Failed to load stations:', err);
        setError(err.message || 'Unable to fetch charging stations from backend.');
      } finally {
        setLoading(false);
      }
    },
    [searchMode, city, countryCode, latitude, longitude, radiusKm, maxResults, minPowerKw]
  );

  // Initial load
  useEffect(() => {
    fetchStations(true);
  }, []);

  // Distinct operators present in loaded dataset for filter dropdown
  const availableOperators = useMemo(() => {
    const ops = new Set();
    stations.forEach((st) => {
      if (st.operatorName && st.operatorName.trim()) {
        ops.add(st.operatorName.trim());
      }
    });
    return Array.from(ops).sort();
  }, [stations]);

  // Client-side filtering (power, connector standard, operator)
  const displayedStations = useMemo(() => {
    return stations.filter((station) => {
      // Power filter
      if (minPowerKw && (!station.maxPowerKw || station.maxPowerKw < Number(minPowerKw))) {
        return false;
      }
      // Connector type filter
      if (connectorFilter !== 'all') {
        const types = station.connectorTypes || [];
        const match = types.some((t) => t.toLowerCase().includes(connectorFilter.toLowerCase()));
        if (!match) return false;
      }
      // Operator filter
      if (operatorFilter !== 'all') {
        if (station.operatorName !== operatorFilter) {
          return false;
        }
      }
      return true;
    });
  }, [stations, minPowerKw, connectorFilter, operatorFilter]);

  // Count stations with valid coordinates
  const stationsWithMapPins = useMemo(() => {
    return displayedStations.filter(
      (s) => s.location && isValidCoordinate(s.location.latitude, s.location.longitude)
    );
  }, [displayedStations]);

  // Handle Geolocation with permission checking and graceful denial
  const handleUseMyLocation = () => {
    setGeoError(null);
    setGeoDenied(false);

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser. Please use manual search.');
      return;
    }

    setGeoLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lon = pos.coords.longitude.toFixed(4);
        setLatitude(lat);
        setLongitude(lon);
        setSearchMode('coords');
        setGeoLocating(false);

        // Fetch stations around device coordinates
        stationService
          .getNearbyStations({
            latitude: Number(lat),
            longitude: Number(lon),
            radiusKm: Number(radiusKm) || 10,
            maxResults: Number(maxResults) || 25,
            minPowerKw: minPowerKw ? Number(minPowerKw) : undefined,
          })
          .then((res) => {
            setStations(res);
            setMapCenter([Number(lat), Number(lon)]);
            setMapZoom(13);
            setHasSearched(true);
            setSelectedStationId(null);
          })
          .catch((err) => {
            setError(err.message || 'Failed to search your current location.');
          });
      },
      (err) => {
        setGeoLocating(false);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setGeoDenied(true);
          setGeoError(
            'Location access was denied. Please allow location permissions in your browser settings, or select a preset EV hub or search by city below.'
          );
        } else if (err.code === 2) {
          // POSITION_UNAVAILABLE
          setGeoError('Device location is currently unavailable. Please enter coordinates or a city name.');
        } else if (err.code === 3) {
          // TIMEOUT
          setGeoError('Location request timed out. Please retry or enter your location manually.');
        } else {
          setGeoError(`Unable to retrieve location (${err.message}).`);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSelectPreset = (preset) => {
    setSearchMode('coords');
    setLatitude(preset.lat.toString());
    setLongitude(preset.lon.toString());
    setMapCenter([preset.lat, preset.lon]);
    setMapZoom(12);
    setGeoError(null);
    setGeoDenied(false);

    setLoading(true);
    setError(null);
    stationService
      .getNearbyStations({
        latitude: preset.lat,
        longitude: preset.lon,
        radiusKm: Number(radiusKm) || 10,
        maxResults: Number(maxResults) || 25,
        minPowerKw: minPowerKw ? Number(minPowerKw) : undefined,
      })
      .then((res) => {
        setStations(res);
        setHasSearched(true);
        setSelectedStationId(null);
      })
      .catch((err) => {
        setError(err.message || `Failed to fetch stations for ${preset.name}`);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Synchronize selection between station list and map
  const handleSelectStation = (station) => {
    setSelectedStationId(station.id);
    if (station.location && isValidCoordinate(station.location.latitude, station.location.longitude)) {
      setMapCenter([station.location.latitude, station.location.longitude]);
      setMapZoom(15);
    }
    // Smoothly scroll the card into view
    const element = document.getElementById(`station-${station.id}`);
    if (element && typeof element.scrollIntoView === 'function') {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleSelectOnMap = (station) => {
    handleSelectStation(station);
    // Switch to map view on mobile so user sees the focused pin
    if (window.innerWidth < 1024) {
      setMobileView('map');
    }
  };

  const handleResetFilters = () => {
    setMinPowerKw('');
    setConnectorFilter('all');
    setOperatorFilter('all');
  };

  const hasActiveFilters = minPowerKw !== '' || connectorFilter !== 'all' || operatorFilter !== 'all';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive EV Station Finder &bull; Phase 7</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              EV Charging Station Map
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              Locate Level 2 and DC Fast charging stations with real-time map synchronization, plug standards, and operator specifications.
            </p>
          </div>

          {/* Quick Hub Presets & Geolocation Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              disabled={geoLocating}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition text-xs shadow-md shadow-emerald-950"
              title="Locate via device GPS"
            >
              <Navigation className={`w-3.5 h-3.5 ${geoLocating ? 'animate-spin' : ''}`} />
              <span>{geoLocating ? 'Locating...' : 'Use My Location'}</span>
            </button>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 hidden xl:inline">Hubs:</span>
              {PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 transition text-[11px]"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Geolocation Denied / Error Warning with Direct Fallback Action */}
        {geoError && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-semibold text-amber-200">
                {geoDenied ? 'Location Permission Blocked' : 'Geolocation Notice'}
              </p>
              <p className="leading-relaxed">{geoError}</p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-slate-400">Quick Fallbacks:</span>
                <button
                  onClick={() => handleSelectPreset(PRESET_LOCATIONS[0])}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-900 text-white text-[11px] font-medium transition"
                >
                  San Francisco Hub
                </button>
                <button
                  onClick={() => handleSelectPreset(PRESET_LOCATIONS[1])}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-900 text-white text-[11px] font-medium transition"
                >
                  Richmond Hub
                </button>
                <button
                  onClick={() => setSearchMode('city')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
                >
                  Search by City
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Mode Toggles & Inputs */}
        <div className="pt-4 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setSearchMode('coords')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  searchMode === 'coords'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Coordinates Search
              </button>
              <button
                onClick={() => setSearchMode('city')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                  searchMode === 'city'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                City & Town Search
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px]">Community registry data &bull; Live bay occupancy unavailable</span>
            </div>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              fetchStations(false);
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3"
          >
            {searchMode === 'coords' ? (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="37.7749"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="-122.4194"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">City / Town</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Richmond or Seattle"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Country Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                    placeholder="US"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Radius (km)</label>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Max Results</label>
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="10">10 stations</option>
                <option value="25">25 stations</option>
                <option value="50">50 stations</option>
              </select>
            </div>

            <div className="sm:col-span-2 lg:col-span-1 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold py-2 px-4 rounded-xl transition flex items-center justify-center gap-2 h-[38px] shadow-md shadow-emerald-950"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Secondary Filter Bar */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1 text-slate-400 mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-medium">Filters:</span>
              </div>

              {/* Min Power Filter */}
              <select
                value={minPowerKw}
                onChange={(e) => setMinPowerKw(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Speeds</option>
                <option value="22">22+ kW (Fast AC)</option>
                <option value="50">50+ kW (Rapid DC)</option>
                <option value="150">150+ kW (Ultra DC)</option>
              </select>

              {/* Connector Type Filter */}
              <select
                value={connectorFilter}
                onChange={(e) => setConnectorFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500"
              >
                {CONNECTOR_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Operator Filter */}
              {availableOperators.length > 0 && (
                <select
                  value={operatorFilter}
                  onChange={(e) => setOperatorFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:border-emerald-500 max-w-[160px] truncate"
                >
                  <option value="all">All Operators</option>
                  {availableOperators.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              )}

              {/* Reset Filters Action */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded-md hover:bg-rose-500/10 transition"
                >
                  <X className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Mobile View Switcher */}
            <div className="flex lg:hidden items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setMobileView('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  mobileView === 'list'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List ({displayedStations.length})</span>
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  mobileView === 'map'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Map ({stationsWithMapPins.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Station List (7 cols on desktop) */}
        <div className={`space-y-4 ${mobileView === 'map' ? 'hidden lg:block lg:col-span-7' : 'col-span-12 lg:col-span-7'}`}>
          <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Charging Stations</span>
              {hasSearched && (
                <span className="text-xs font-normal text-slate-400">
                  ({displayedStations.length} of {stations.length} matched)
                </span>
              )}
            </h2>

            {/* Map Pin Coverage Badge */}
            {hasSearched && (
              <span className="text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {stationsWithMapPins.length} pinned on map
                {displayedStations.length > stationsWithMapPins.length && (
                  <span className="text-amber-400 ml-1">
                    ({displayedStations.length - stationsWithMapPins.length} missing coordinates)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-rose-200">Search Error</p>
                <p>{error}</p>
                <button
                  onClick={() => fetchStations(false)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white text-[11px] font-medium transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Search</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 bg-slate-900/40 rounded-2xl border border-slate-800">
              <LoadingSpinner text="Searching Open Charge Map gateway..." size="md" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && hasSearched && displayedStations.length === 0 && (
            <div className="text-center py-12 px-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No charging stations found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'No stations matched your active filters. Try resetting the filters or widening your radius.'
                  : 'No verified stations found within the specified radius. Try expanding search distance or selecting a different city.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                >
                  Clear Active Filters
                </button>
              )}
            </div>
          )}

          {/* Station Cards */}
          {!loading && displayedStations.length > 0 && (
            <div className="space-y-4">
              {displayedStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  isSelected={station.id === selectedStationId}
                  onSelectStation={handleSelectStation}
                  onSelectOnMap={handleSelectOnMap}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Map (5 cols on desktop) */}
        <div className={`sticky top-20 ${mobileView === 'list' ? 'hidden lg:block lg:col-span-5' : 'col-span-12 lg:col-span-5'}`}>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 space-y-2 shadow-xl">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Charging Map</span>
              </span>
              <span className="text-[10px] text-slate-500">
                {stationsWithMapPins.length} Pins &bull; OpenStreetMap
              </span>
            </div>
            <div className="h-[480px] sm:h-[540px] w-full rounded-xl overflow-hidden relative">
              <StationMap
                stations={displayedStations}
                center={mapCenter}
                zoom={mapZoom}
                selectedStationId={selectedStationId}
                onSelectStation={handleSelectStation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
