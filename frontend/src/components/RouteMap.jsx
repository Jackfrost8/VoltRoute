import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, MapPin, ExternalLink, Info, Star, Compass, Navigation } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

/**
 * Creates custom pin for Route Waypoints (Origin = Green, Destination = Red).
 */
function createWaypointIcon(label, isOrigin) {
  const bg = isOrigin ? '#10b981' : '#f43f5e';
  const html = `
    <div style="
      background-color: ${bg};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
      cursor: pointer;
    ">
      <div style="transform: rotate(45deg); color: #ffffff; font-weight: bold; font-size: 13px;">
        ${label}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'voltroute-waypoint-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}

/**
 * Creates custom pin for candidate and recommended charging stops along the route.
 */
function createStopIcon(isRecommended, powerKw) {
  const isUltra = powerKw && powerKw >= 150;
  const isFast = powerKw && powerKw >= 50;

  const bg = isRecommended
    ? '#f59e0b' // Amber/Gold for Recommended
    : isUltra
    ? '#a855f7' // Purple
    : isFast
    ? '#06b6d4' // Cyan
    : '#64748b'; // Slate

  const size = isRecommended ? 36 : 28;
  const ring = isRecommended
    ? 'border: 3px solid #fbbf24; box-shadow: 0 0 16px rgba(245, 158, 11, 0.8);'
    : 'border: 2px solid #ffffff; box-shadow: 0 3px 6px rgba(0,0,0,0.4);';

  const html = `
    <div style="
      background-color: ${bg};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      ${ring}
      cursor: pointer;
    ">
      <div style="color: #ffffff; display: flex; align-items: center; justify-content: center;">
        ${
          isRecommended
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
            : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
        }
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'voltroute-route-stop-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

function RouteMapController({ geometry, origin, destination }) {
  const map = useMap();

  useEffect(() => {
    if (geometry && geometry.length > 1) {
      const bounds = L.latLngBounds(geometry);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    } else if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.latitude, origin.longitude],
        [destination.latitude, destination.longitude],
      ]);
      map.fitBounds(bounds, { padding: [40, 40], animate: true });
    }
  }, [geometry, origin, destination, map]);

  return null;
}

export function RouteMap({
  routeData,
  selectedStopId,
  onSelectStop,
}) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const defaultCenter = [37.7749, -122.4194];
  const origin = routeData?.origin;
  const destination = routeData?.destination;
  const geometry = routeData?.geometry || [];
  const candidateStops = routeData?.allCandidateStops || [];
  const recommendedStops = routeData?.recommendedStops || [];

  const center =
    geometry.length > 0
      ? geometry[Math.floor(geometry.length / 2)]
      : origin
      ? [origin.latitude, origin.longitude]
      : defaultCenter;

  return (
    <div className="w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative z-0">
      <MapContainer
        center={center}
        zoom={10}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px]"
      >
        <RouteMapController geometry={geometry} origin={origin} destination={destination} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route Driving Polyline */}
        {geometry.length > 1 && (
          <Polyline
            positions={geometry}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        {/* Origin Marker */}
        {origin && origin.latitude != null && (
          <Marker
            position={[origin.latitude, origin.longitude]}
            icon={createWaypointIcon('A', true)}
          >
            <Popup className="station-popup">
              <div className="p-2 space-y-1 text-slate-900 text-xs">
                <span className="font-bold text-emerald-700 text-sm">Origin (Start)</span>
                <p className="text-slate-700">{origin.addressLine1 || 'Starting Location'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination Marker */}
        {destination && destination.latitude != null && (
          <Marker
            position={[destination.latitude, destination.longitude]}
            icon={createWaypointIcon('B', false)}
          >
            <Popup className="station-popup">
              <div className="p-2 space-y-1 text-slate-900 text-xs">
                <span className="font-bold text-rose-700 text-sm">Destination (End)</span>
                <p className="text-slate-700">{destination.addressLine1 || 'Destination Location'}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Candidate & Recommended Charging Stops */}
        {candidateStops.map((stop) => {
          const st = stop.station;
          if (!st || !st.location || st.location.latitude == null) return null;

          const isRec = stop.isRecommendedStop;
          const favorited = isFavorite(st.id);

          return (
            <Marker
              key={st.id}
              position={[st.location.latitude, st.location.longitude]}
              icon={createStopIcon(isRec, st.maxPowerKw)}
              eventHandlers={{
                click: () => {
                  if (onSelectStop) onSelectStop(stop);
                },
              }}
            >
              <Popup className="station-popup">
                <div className="p-2 space-y-2 text-slate-900 max-w-xs font-sans text-xs">
                  {isRec && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>Recommended Charging Stop</span>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-sm text-slate-950 leading-snug">{st.title}</h4>
                    {st.operatorName && (
                      <p className="text-[11px] text-slate-600 font-medium">{st.operatorName}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-600 border-t border-slate-200 pt-1">
                    <div>
                      <span className="font-medium text-slate-800">Route Detour: </span>
                      <span className="text-emerald-700 font-semibold">{stop.detourDistanceKm} km off route</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-800">Route Position: </span>
                      <span>{stop.distanceFromOriginKm} km from start</span>
                    </div>
                    {stop.estimatedBatteryAtArrivalPercent != null && (
                      <div>
                        <span className="font-medium text-slate-800">Est. Arrival Battery: </span>
                        <span className={stop.estimatedBatteryAtArrivalPercent < 15 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {stop.estimatedBatteryAtArrivalPercent}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
                    {st.maxPowerKw > 0 && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                        {st.maxPowerKw} kW
                      </span>
                    )}
                    <span className="text-slate-600">{st.totalConnectors} bays</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(st);
                      }}
                      className="ml-auto text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      {favorited ? 'Saved in Favorites' : '+ Add Favorite'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800/90 rounded-xl px-3 py-2 text-[10px] text-slate-300 z-[1000] shadow-lg flex items-center gap-3">
        <span className="flex items-center gap-1 font-semibold text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Origin (A)</span>
        </span>
        <span className="flex items-center gap-1 font-semibold text-white">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
          <span>Destination (B)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-400" />
          <span>Recommended Stop</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
          <span>Candidate Charger</span>
        </span>
      </div>
    </div>
  );
}

export default RouteMap;
