import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  MapPin,
  Zap,
  Plug,
  Trash2,
  ExternalLink,
  Compass,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import LoadingSpinner from '../components/LoadingSpinner';

export function FavoritesPage() {
  const { favorites, loading, error, removeFavorite, refreshFavorites } = useFavorites();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);

  const handleRemove = async (stationId, stationTitle) => {
    if (deletingId) return;
    setDeletingId(stationId);
    try {
      await removeFavorite(stationId);
      setActionNotice(`Removed "${stationTitle}" from your favorites.`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      setActionNotice(`Failed to remove "${stationTitle}": ${err.message}`);
      setTimeout(() => setActionNotice(null), 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewOnMap = (fav) => {
    if (fav.latitude != null && fav.longitude != null) {
      navigate('/', {
        state: {
          centerLat: fav.latitude,
          centerLon: fav.longitude,
          stationId: fav.stationId,
        },
      });
    } else {
      navigate('/');
    }
  };

  // Metrics
  const totalSaved = favorites.length;
  const fastChargers = favorites.filter((f) => f.maxPowerKw && f.maxPowerKw >= 50).length;
  const totalPlugs = favorites.reduce((sum, f) => sum + (f.totalConnectors || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Heart className="w-6 h-6 fill-rose-500/30 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Favorite Stations
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {totalSaved} {totalSaved === 1 ? 'Station' : 'Stations'}
                </span>
              </h1>
              <p className="text-sm text-slate-400">
                Quick access to your saved EV charging locations for trips and routine charging.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshFavorites()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
            title="Refresh saved favorites"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Map</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      {totalSaved > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Saved Locations</span>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>{totalSaved}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Fast Chargers (50+ kW)</span>
            <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>{fastChargers}</span>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 font-medium">Total Charging Bays</span>
            <div className="text-2xl font-bold text-sky-400 flex items-center gap-2">
              <Plug className="w-5 h-5 text-sky-400" />
              <span>{totalPlugs}</span>
            </div>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      {actionNotice && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2 shadow-sm"
        >
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/40 text-rose-300 text-sm flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => refreshFavorites()}
            className="text-xs font-semibold text-rose-200 underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && favorites.length === 0 && (
        <div className="py-16">
          <LoadingSpinner text="Retrieving your favorite charging stations..." />
        </div>
      )}

      {/* Empty State */}
      {!loading && favorites.length === 0 && !error && (
        <div
          data-testid="empty-favorites-container"
          className="py-16 px-6 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 max-w-lg mx-auto space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
            <Heart className="w-7 h-7 text-rose-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No favorite charging stations saved yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              When searching for stations on the map or in the list, click the heart icon to bookmark your
              frequently used chargers here.
            </p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Find Charging Stations</span>
          </button>
        </div>
      )}

      {/* Populated Favorites Grid */}
      {favorites.length > 0 && (
        <div
          data-testid="favorites-grid"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {favorites.map((fav) => {
            const isDeleting = deletingId === fav.stationId;
            const isUltra = fav.maxPowerKw && fav.maxPowerKw >= 150;
            const isFast = fav.maxPowerKw && fav.maxPowerKw >= 50;

            const formattedDate = fav.createdAt
              ? new Date(fav.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div
                key={fav.stationId}
                data-testid={`favorite-card-${fav.stationId}`}
                className="rounded-2xl p-5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                        {fav.stationTitle}
                      </h3>
                      {fav.operatorName && (
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {fav.operatorName}
                        </span>
                      )}
                    </div>

                    {fav.maxPowerKw > 0 && (
                      <div
                        className={`px-2.5 py-1 rounded-xl border text-xs font-bold shrink-0 flex items-center gap-1 ${
                          isUltra
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                            : isFast
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{fav.maxPowerKw} kW</span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5 text-xs text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {fav.addressLine ? `${fav.addressLine}, ` : ''}
                      {fav.city || 'Unknown Town'}
                      {fav.stateOrProvince ? `, ${fav.stateOrProvince}` : ''}
                      {fav.countryCode ? ` (${fav.countryCode})` : ''}
                    </span>
                  </div>

                  {/* Connectors & Meta */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Plug className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {fav.totalConnectors} {fav.totalConnectors === 1 ? 'Bay' : 'Bays'}
                      </span>
                    </div>

                    {formattedDate && (
                      <span className="text-[11px] text-slate-500 ml-auto">Saved {formattedDate}</span>
                    )}
                  </div>

                  {/* Plugs */}
                  {fav.connectorTypes?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {fav.connectorTypes.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-800/90 text-slate-300 border border-slate-700/60"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => handleViewOnMap(fav)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    <span>View on Map</span>
                  </button>

                  <button
                    onClick={() => handleRemove(fav.stationId, fav.stationTitle)}
                    disabled={isDeleting}
                    aria-label={`Remove ${fav.stationTitle} from favorites`}
                    title="Remove from favorites"
                    className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/20 transition disabled:opacity-50"
                  >
                    <Trash2 className={`w-3.5 h-3.5 ${isDeleting ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{isDeleting ? 'Removing...' : 'Remove'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
