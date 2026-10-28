import React, { useState } from 'react';
import { MapPin, Zap, Plug, ChevronDown, ChevronUp, ExternalLink, Phone, Info, AlertTriangle, Heart } from 'lucide-react';
import stationService from '../api/stationService';
import { isValidCoordinate } from './StationMap';
import { useFavorites } from '../context/FavoritesContext';

export function StationCard({
  station,
  isSelected = false,
  onSelectOnMap,
  onSelectStation,
  isFavorite: explicitIsFav,
  onToggleFavorite: explicitOnToggle,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const favorited = explicitIsFav !== undefined ? explicitIsFav : checkFavorite(station.id);

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    if (isTogglingFav) return;
    setIsTogglingFav(true);
    try {
      if (explicitOnToggle) {
        await explicitOnToggle(station);
      } else {
        await toggleFavorite(station);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const toggleExpand = async (e) => {
    e.stopPropagation();
    if (!isExpanded && !detail) {
      setLoadingDetail(true);
      try {
        const full = await stationService.getStationById(station.id);
        setDetail(full);
      } catch (err) {
        console.error('Failed to load station details', err);
      } finally {
        setLoadingDetail(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const hasValidCoordinates =
    station.location &&
    isValidCoordinate(station.location.latitude, station.location.longitude);

  const isFast = station.maxPowerKw && station.maxPowerKw >= 50;
  const isUltra = station.maxPowerKw && station.maxPowerKw >= 150;

  const handleCardClick = () => {
    if (onSelectStation) {
      onSelectStation(station);
    }
  };

  return (
    <div
      id={`station-${station.id}`}
      onClick={handleCardClick}
      className={`rounded-2xl p-5 transition-all duration-200 shadow-sm space-y-4 border cursor-pointer ${
        isSelected
          ? 'bg-slate-900 border-emerald-500/90 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/40'
          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/90 hover:bg-slate-900/90'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{station.title}</span>
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Selected station" />
              )}
            </h3>
            {station.operatorName && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                {station.operatorName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {station.location?.addressLine1 ? `${station.location.addressLine1}, ` : ''}
              {station.location?.city || 'Unknown Town'}
              {station.location?.stateOrProvince ? `, ${station.location.stateOrProvince}` : ''}
              {station.location?.countryCode ? ` (${station.location.countryCode})` : ''}
            </span>
            {station.location?.distanceKm != null && (
              <span className="text-emerald-400 font-semibold ml-1">
                &bull; {station.location.distanceKm.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>

        {/* Actions / Badges Container */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Favorite Toggle Button */}
          <button
            type="button"
            data-testid={`favorite-btn-${station.id}`}
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            title={favorited ? 'Remove from favorites' : 'Add to favorites'}
            onClick={handleToggleFavorite}
            disabled={isTogglingFav}
            className={`p-2 rounded-xl transition-all duration-150 border ${
              favorited
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-400 hover:text-rose-400 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${favorited ? 'fill-rose-400 text-rose-400' : ''}`} />
          </button>

          {/* Power Badge */}
          {station.maxPowerKw > 0 && (
            <div
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                isUltra
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  : isFast
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{station.maxPowerKw} kW</span>
            </div>
          )}
        </div>
      </div>

      {/* Attributes Strip */}
      <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-1 border-t border-slate-800/60">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Plug className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {station.totalConnectors} {station.totalConnectors === 1 ? 'Point' : 'Points'}
          </span>
        </div>

        {/* Operational Status */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {station.operationalStatus || 'Operational'}
        </span>

        {/* Truthful Static Directory Badge */}
        <span
          className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/50"
          title="Data supplied by Open Charge Map community registry. Live slot occupancy is not available."
        >
          <Info className="w-3 h-3 text-slate-400" />
          Directory Registry (Static)
        </span>

        {/* Missing / Invalid Coordinates Warning */}
        {!hasValidCoordinates && (
          <span className="text-[11px] text-amber-400 flex items-center gap-1 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-800/40">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            No Map Pin (unlisted coordinates)
          </span>
        )}
      </div>

      {/* Connector Types */}
      {station.connectorTypes?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 mr-1">Plugs:</span>
          {station.connectorTypes.map((type, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800/80 text-slate-300 border border-slate-700/60"
            >
              {type}
            </span>
          ))}
        </div>
      )}

      {/* Expandable Technical Details */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/80 space-y-3 text-xs text-slate-300">
          {loadingDetail && <p className="text-slate-400 italic">Fetching full specifications...</p>}
          {detail && (
            <>
              {detail.accessComments && (
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-slate-300 text-[11px] space-y-1">
                  <span className="font-semibold text-slate-200">Access Guidance:</span>
                  <p>{detail.accessComments}</p>
                </div>
              )}

              {detail.operatorWebsite && (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <a
                    href={detail.operatorWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline text-[11px]"
                  >
                    Operator Website
                  </a>
                </div>
              )}

              {detail.contactTelephone && (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{detail.contactTelephone}</span>
                </div>
              )}

              {/* Individual Connector Benches */}
              {detail.connectors?.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="font-semibold text-slate-200 text-xs">Connector Breakdown:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detail.connectors.map((conn, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] space-y-0.5"
                      >
                        <div className="font-medium text-slate-200">{conn.connectionTypeName}</div>
                        <div className="text-slate-400">
                          {conn.powerKw ? `${conn.powerKw} kW` : 'Power unspecified'}{' '}
                          {conn.currentType ? `&bull; ${conn.currentType}` : ''}
                        </div>
                        <div className="text-slate-400">
                          Quantity: {conn.quantity || 1} &bull; {conn.isFastChargeCapable ? 'Fast DC' : 'AC Standard'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Card Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/40">
        <button
          onClick={toggleExpand}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition py-1"
        >
          {isExpanded ? (
            <>
              <span>Hide Details</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>View Specifications</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        {hasValidCoordinates && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectOnMap) {
                onSelectOnMap(station);
              } else if (onSelectStation) {
                onSelectStation(station);
              }
            }}
            className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
            }`}
          >
            <span>{isSelected ? 'Pinned on Map' : 'Pin on Map'}</span>
            <MapPin className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default StationCard;
