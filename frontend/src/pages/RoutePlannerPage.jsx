import React, { useState } from 'react';
import {
  Navigation,
  MapPin,
  Zap,
  BatteryCharging,
  Gauge,
  SlidersHorizontal,
  Compass,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
  Info,
  Route,
  RefreshCw,
} from 'lucide-react';
import routeService from '../api/routeService';
import RouteMap from '../components/RouteMap';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFavorites } from '../context/FavoritesContext';

const ROUTE_PRESETS = [
  {
    name: 'San Francisco → Sacramento (140 km)',
    origin: { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
    dest: { name: 'Sacramento, CA', lat: 38.5816, lon: -121.4944 },
  },
  {
    name: 'San Francisco → San Jose (78 km)',
    origin: { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
    dest: { name: 'San Jose, CA', lat: 37.3382, lon: -121.8863 },
  },
  {
    name: 'Los Angeles → San Diego (195 km)',
    origin: { name: 'Los Angeles, CA', lat: 34.0522, lon: -118.2437 },
    dest: { name: 'San Diego, CA', lat: 32.7157, lon: -117.1611 },
  },
  {
    name: 'London → Brighton (85 km)',
    origin: { name: 'London, UK', lat: 51.5074, lon: -0.1278 },
    dest: { name: 'Brighton, UK', lat: 50.8225, lon: -0.1372 },
  },
];

export function RoutePlannerPage() {
  const { isFavorite, toggleFavorite } = useFavorites();

  // Form State
  const [originName, setOriginName] = useState('San Francisco, CA');
  const [originLat, setOriginLat] = useState('37.7749');
  const [originLon, setOriginLon] = useState('-122.4194');

  const [destName, setDestName] = useState('Sacramento, CA');
  const [destLat, setDestLat] = useState('38.5816');
  const [destLon, setDestLon] = useState('-121.4944');

  const [vehicleRangeKm, setVehicleRangeKm] = useState('300');
  const [currentBatteryPercent, setCurrentBatteryPercent] = useState('45');
  const [minPowerKw, setMinPowerKw] = useState('50');
  const [connectorType, setConnectorType] = useState('CCS');
  const [maxDetourKm, setMaxDetourKm] = useState('15');

  // Execution & Result State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [routeResult, setRouteResult] = useState(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [selectedStop, setSelectedStop] = useState(null);

  const handleApplyPreset = (preset) => {
    setOriginName(preset.origin.name);
    setOriginLat(String(preset.origin.lat));
    setOriginLon(String(preset.origin.lon));

    setDestName(preset.dest.name);
    setDestLat(String(preset.dest.lat));
    setDestLon(String(preset.dest.lon));
    setError(null);
  };

  const handleCalculateRoute = async (e) => {
    if (e) e.preventDefault();
    setError(null);

    const oLat = parseFloat(originLat);
    const oLon = parseFloat(originLon);
    const dLat = parseFloat(destLat);
    const dLon = parseFloat(destLon);

    if (isNaN(oLat) || isNaN(oLon) || isNaN(dLat) || isNaN(dLon)) {
      setError('Please provide valid decimal numbers for origin and destination coordinates.');
      return;
    }

    if (Math.abs(oLat - dLat) < 0.0001 && Math.abs(oLon - dLon) < 0.0001) {
      setError('Origin and destination coordinates cannot be identical.');
      return;
    }

    setLoading(true);
    try {
      const data = await routeService.planRoute({
        originLatitude: oLat,
        originLongitude: oLon,
        originName,
        destinationLatitude: dLat,
        destinationLongitude: dLon,
        destinationName: destName,
        vehicleRangeKm: vehicleRangeKm ? Number(vehicleRangeKm) : undefined,
        currentBatteryPercent: currentBatteryPercent ? Number(currentBatteryPercent) : undefined,
        minPowerKw: minPowerKw ? Number(minPowerKw) : undefined,
        connectorType: connectorType !== 'all' ? connectorType : undefined,
        maxDetourKm: maxDetourKm ? Number(maxDetourKm) : 15.0,
      });

      setRouteResult(data);
    } catch (err) {
      console.error('Route calculation error:', err);
      setError(err.message || 'Unable to calculate driving route or charging stops.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Route className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                EV Route Planner & Charging Recommendations
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Phase 9
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Plan long-distance electric routes, analyze battery range feasibility, and discover optimal charging stops.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Quick Routes:</span>
          {ROUTE_PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleApplyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
            >
              {p.origin.name.split(',')[0]} → {p.dest.name.split(',')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Input Parameters Form */}
      <form
        onSubmit={handleCalculateRoute}
        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Origin Section */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Starting Location (Origin)</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Origin Name / Address"
                value={originName}
                onChange={(e) => setOriginName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Origin Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={originLat}
                    onChange={(e) => setOriginLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Origin Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={originLon}
                    onChange={(e) => setOriginLon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Destination Section */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Destination</span>
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Destination Name / Address"
                value={destName}
                onChange={(e) => setDestName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Dest Latitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLat}
                    onChange={(e) => setDestLat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Dest Longitude</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={destLon}
                    onChange={(e) => setDestLon(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle & Charging Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">
              Full Range (km)
            </label>
            <input
              type="number"
              min="50"
              max="1200"
              value={vehicleRangeKm}
              onChange={(e) => setVehicleRangeKm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium mb-1">
              <span>Battery Level</span>
              <span className="text-emerald-400 font-semibold">{currentBatteryPercent}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={currentBatteryPercent}
              onChange={(e) => setCurrentBatteryPercent(e.target.value)}
              className="w-full accent-emerald-500 mt-2"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Plug Type</label>
            <select
              value={connectorType}
              onChange={(e) => setConnectorType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Plugs</option>
              <option value="CCS">CCS (Combo)</option>
              <option value="Tesla">Tesla Supercharger</option>
              <option value="Type 2">Type 2 (Mennekes)</option>
              <option value="CHAdeMO">CHAdeMO</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Min Charger Power</label>
            <select
              value={minPowerKw}
              onChange={(e) => setMinPowerKw(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Any Power (incl. AC)</option>
              <option value="50">50+ kW (Fast DC)</option>
              <option value="150">150+ kW (Ultra-Fast)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1">Max Detour (km)</label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxDetourKm}
              onChange={(e) => setMaxDetourKm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calculating Route & Recommendations...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Calculate EV Route & Stops</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2 shadow-sm"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && !routeResult && (
        <div className="py-12">
          <LoadingSpinner text="Computing driving path and sampling charging network..." />
        </div>
      )}

      {/* Route Results View */}
      {routeResult && (
        <div className="space-y-6">
          {/* Telemetry Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Driving Distance</span>
              <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                <Navigation className="w-5 h-5 text-emerald-400" />
                <span>{routeResult.distanceKm} km</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Est. Driving Time</span>
              <div className="text-2xl font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-5 h-5 text-sky-400" />
                <span>
                  {Math.floor(routeResult.durationMinutes / 60)}h{' '}
                  {Math.round(routeResult.durationMinutes % 60)}m
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Charging Stops Required</span>
              <div className="text-2xl font-bold text-amber-400 flex items-center gap-1.5">
                <BatteryCharging className="w-5 h-5 text-amber-400" />
                <span>{routeResult.isChargingRequired ? routeResult.estimatedStopsNeeded : '0 (Direct)'}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
              <span className="text-xs text-slate-400 font-medium">Feasibility Status</span>
              <div className="pt-1">
                {routeResult.feasibility === 'FEASIBLE_DIRECT' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Direct Trip Feasible
                  </span>
                )}
                {routeResult.feasibility === 'FEASIBLE_WITH_STOPS' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <BatteryCharging className="w-3.5 h-3.5" />
                    Stops Recommended
                  </span>
                )}
                {routeResult.feasibility === 'RANGE_CONSTRAINED_NO_STOPS_FOUND' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Range Constrained
                  </span>
                )}
                {routeResult.feasibility === 'ESTIMATE_ONLY_NO_VEHICLE_DATA' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <Info className="w-3.5 h-3.5" />
                    Estimate Only
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Truthful Range Disclaimer Banner */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300">Deterministic Range Model: </span>
              <span>{routeResult.feasibilityNotice}</span>
            </div>
          </div>

          {/* Map and Stops Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Leaflet Route Map */}
            <div className="lg:col-span-8 min-h-[460px]">
              <RouteMap
                routeData={routeResult}
                selectedStopId={selectedStop?.station?.id}
                onSelectStop={setSelectedStop}
              />
            </div>

            {/* Recommended & Candidate Stops Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>Recommended Stops</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {routeResult.recommendedStops?.length || 0} stop(s)
                </span>
              </div>

              {/* Recommended Stops List */}
              {routeResult.recommendedStops?.length > 0 ? (
                <div className="space-y-3">
                  {routeResult.recommendedStops.map((stop) => {
                    const st = stop.station;
                    const favorited = isFavorite(st.id);

                    return (
                      <div
                        key={st.id}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/40 hover:border-amber-500/80 transition space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                              Primary Recommendation
                            </span>
                            <h4 className="font-bold text-sm text-white leading-snug">{st.title}</h4>
                            {st.operatorName && (
                              <p className="text-[11px] text-slate-400">{st.operatorName}</p>
                            )}
                          </div>
                          {st.maxPowerKw > 0 && (
                            <div className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold shrink-0">
                              {st.maxPowerKw} kW
                            </div>
                          )}
                        </div>

                        <div className="space-y-1 text-xs text-slate-300 border-t border-slate-800/80 pt-2">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Detour:</span>
                            <span className="text-emerald-400 font-semibold">{stop.detourDistanceKm} km off route</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Along Route:</span>
                            <span>{stop.distanceFromOriginKm} km from start</span>
                          </div>
                          {stop.estimatedBatteryAtArrivalPercent != null && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Est. Arrival Battery:</span>
                              <span className="font-bold text-slate-200">
                                {stop.estimatedBatteryAtArrivalPercent}%
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-slate-400">Score:</span>
                            <span className="text-amber-400 font-bold">{stop.compositeScore} / 100</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                          {stop.rankingReason}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => toggleFavorite(st)}
                            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition"
                          >
                            <span>{favorited ? 'In Favorites' : '+ Bookmark Stop'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-center text-xs text-slate-400">
                  {routeResult.isChargingRequired
                    ? 'No candidate stations were found within the corridor reachable before battery depletion.'
                    : 'Current battery charge is sufficient to reach the destination directly without charging stops.'}
                </div>
              )}

              {/* All Candidate Stations Toggle */}
              {routeResult.allCandidateStops?.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllCandidates(!showAllCandidates)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
                  >
                    <span>All Nearby Corridor Chargers ({routeResult.allCandidateStops.length})</span>
                    {showAllCandidates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showAllCandidates && (
                    <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
                      {routeResult.allCandidateStops.map((stop) => (
                        <div
                          key={stop.station.id}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs space-y-1"
                        >
                          <div className="flex justify-between font-semibold text-slate-200">
                            <span>{stop.station.title}</span>
                            <span className="text-emerald-400">{stop.station.maxPowerKw} kW</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px]">
                            <span>{stop.detourDistanceKm} km detour</span>
                            <span>Score: {stop.compositeScore}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoutePlannerPage;
