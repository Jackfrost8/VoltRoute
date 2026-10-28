import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, MapPin, ExternalLink, Info, Navigation, Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

/**
 * Validates whether latitude and longitude numbers are valid global coordinates.
 */
export function isValidCoordinate(lat, lon) {
  if (lat === null || lat === undefined || lon === null || lon === undefined) {
    return false;
  }
  const numLat = typeof lat === 'number' ? lat : parseFloat(lat);
  const numLon = typeof lon === 'number' ? lon : parseFloat(lon);

  if (isNaN(numLat) || isNaN(numLon)) {
    return false;
  }
  return numLat >= -90 && numLat <= 90 && numLon >= -180 && numLon <= 180;
}

/**
 * Creates custom SVG DivIcon for Leaflet markers based on charging speed and selection.
 */
export function createStationIcon(station, isSelected) {
  const isUltra = station.maxPowerKw && station.maxPowerKw >= 150;
  const isFast = station.maxPowerKw && station.maxPowerKw >= 50;

  const pinColor = isSelected
    ? '#10b981' // Emerald
    : isUltra
    ? '#a855f7' // Purple (Ultra-Fast 150kW+)
    : isFast
    ? '#f59e0b' // Amber (Rapid 50kW+)
    : '#38bdf8'; // Sky Blue (Standard Level 2)

  const size = isSelected ? 36 : 28;
  const ringStyle = isSelected
    ? 'border: 3px solid #34d399; box-shadow: 0 0 16px rgba(16, 185, 129, 0.7);'
    : 'border: 2px solid #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);';

  const html = `
    <div style="
      background-color: ${pinColor};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      ${ringStyle}
      cursor: pointer;
      transition: transform 0.2s ease;
    ">
      <div style="transform: rotate(45deg); color: #ffffff; display: flex; align-items: center; justify-content: center;">
        <svg width="${isSelected ? 18 : 14}" height="${isSelected ? 18 : 14}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'voltroute-station-pin',
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

/**
 * StationPopupContent renders the popup content inside Leaflet markers.
 */
export function StationPopupContent({
  station,
  onSelectStation,
  isFavorite: explicitIsFav,
  onToggleFavorite: explicitOnToggle,
}) {
  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const favorited = explicitIsFav !== undefined ? explicitIsFav : checkFavorite(station?.id);

  if (!station) return null;
  return (
    <div className="p-2 space-y-2 text-slate-900 max-w-xs font-sans">
      {/* Station Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-slate-950 flex items-center gap-1.5 leading-snug">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{station.title}</span>
          </h4>
          {station.operatorName && (
            <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mt-0.5">
              {station.operatorName}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
          onClick={(e) => {
            e.stopPropagation();
            if (explicitOnToggle) {
              explicitOnToggle(station);
            } else {
              toggleFavorite(station);
            }
          }}
          className={`p-1.5 rounded-lg border transition shrink-0 ${
            favorited
              ? 'bg-rose-50 border-rose-300 text-rose-600'
              : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-rose-600'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${favorited ? 'fill-rose-600' : ''}`} />
        </button>
      </div>

      {/* Address */}
      <div className="text-xs text-slate-600 flex items-start gap-1">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          {station.location?.addressLine1 ? `${station.location.addressLine1}, ` : ''}
          {station.location?.city || ''}
          {station.location?.distanceKm != null ? ` • ${station.location.distanceKm.toFixed(1)} km away` : ''}
        </span>
      </div>

      {/* Specifications Strip */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-200">
        {station.maxPowerKw > 0 && (
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
            {station.maxPowerKw} kW
          </span>
        )}
        <span className="text-xs text-slate-700 font-medium">
          {station.totalConnectors} {station.totalConnectors === 1 ? 'Bay' : 'Bays'}
        </span>
        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
          {station.operationalStatus || 'Operational'}
        </span>
      </div>

      {/* Connectors */}
      {station.connectorTypes?.length > 0 && (
        <div className="text-[11px] text-slate-600 pt-0.5">
          <span className="font-medium text-slate-700">Plugs: </span>
          <span>{station.connectorTypes.join(', ')}</span>
        </div>
      )}

      {/* Truthful Static Occupancy Notice */}
      <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1">
        <Info className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Community directory &bull; Live occupancy unavailable</span>
      </div>

      {/* Action Button */}
      {onSelectStation && (
        <button
          onClick={() => onSelectStation(station)}
          className="w-full mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
        >
          Highlight in List
        </button>
      )}
    </div>
  );
}

function MapController({ center, zoom, selectedStation, validStations }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation?.location && isValidCoordinate(selectedStation.location.latitude, selectedStation.location.longitude)) {
      map.setView(
        [selectedStation.location.latitude, selectedStation.location.longitude],
        15,
        { animate: true }
      );
    } else if (center && isValidCoordinate(center[0], center[1])) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, selectedStation, map]);

  return null;
}

export function StationMap({
  stations = [],
  center = [37.7749, -122.4194],
  zoom = 12,
  selectedStationId = null,
  onSelectStation,
}) {
  const markerRefs = useRef({});

  // Strictly filter out any stations with missing, null, or invalid coordinates
  const validStations = stations.filter(
    (st) => st.location && isValidCoordinate(st.location.latitude, st.location.longitude)
  );

  const selectedStation = validStations.find((st) => st.id === selectedStationId);

  // Automatically open popup for selected station when selected from list
  useEffect(() => {
    if (selectedStationId && markerRefs.current[selectedStationId]) {
      markerRefs.current[selectedStationId].openPopup();
    }
  }, [selectedStationId]);

  const fallbackCenter = [37.7749, -122.4194];
  const safeCenter =
    Array.isArray(center) && center.length === 2 && isValidCoordinate(center[0], center[1])
      ? center
      : fallbackCenter;

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative z-0">
      <MapContainer
        center={safeCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[420px]"
      >
        <MapController
          center={safeCenter}
          zoom={zoom}
          selectedStation={selectedStation}
          validStations={validStations}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validStations.map((st) => {
          const isSelected = st.id === selectedStationId;
          const lat = st.location.latitude;
          const lon = st.location.longitude;

          return (
            <Marker
              key={st.id}
              position={[lat, lon]}
              icon={createStationIcon(st, isSelected)}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[st.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectStation) {
                    onSelectStation(st);
                  }
                },
              }}
            >
              <Popup className="station-popup">
                <StationPopupContent station={st} onSelectStation={onSelectStation} />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur border border-slate-800/90 rounded-xl px-3 py-2 text-[10px] text-slate-300 z-[1000] shadow-lg flex items-center gap-3">
        <span className="font-semibold text-slate-200">Speeds:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
          <span>150+ kW (Ultra)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>50+ kW (Rapid)</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
          <span>Standard AC</span>
        </span>
      </div>
    </div>
  );
}

export default StationMap;
