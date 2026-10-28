import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, LogOut, Compass, CheckCircle2, Heart, Route } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import apiClient from '../api/client';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [probeStatus, setProbeStatus] = useState(null);
  const [isProbing, setIsProbing] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProbeHealth = async () => {
    setIsProbing(true);
    try {
      const response = await apiClient.get('/health');
      setProbeStatus(response?.data?.status || 'UP');
    } catch {
      setProbeStatus('DOWN');
    } finally {
      setIsProbing(false);
      setTimeout(() => setProbeStatus(null), 4000);
    }
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/20 transition">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              VoltRoute
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Phase 9
              </span>
            </span>
            <p className="text-[10px] text-slate-400 hidden sm:block">AI-Powered EV Charging Station Finder</p>
          </div>
        </Link>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Station Finder</span>
          </Link>

          <Link
            to="/route-planner"
            data-testid="nav-route-planner-link"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
          >
            <Route className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">Route Planner</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/favorites"
              data-testid="nav-favorites-link"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
            >
              <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
              <span className="hidden sm:inline">Favorites</span>
              {favorites && favorites.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {favorites.length}
                </span>
              )}
            </Link>
          )}

          {/* Health probe button */}
          <button
            onClick={handleProbeHealth}
            disabled={isProbing}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 transition"
            title="Probe backend /api/health endpoint"
          >
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                probeStatus === 'UP'
                  ? 'text-emerald-400'
                  : probeStatus === 'DOWN'
                  ? 'text-rose-400'
                  : 'text-slate-500'
              }`}
            />
            <span className="text-[11px]">
              {isProbing ? 'Probing...' : probeStatus ? `Backend ${probeStatus}` : 'Health'}
            </span>
          </button>

          {/* Authentication Links */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.firstName || 'My Profile'}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                title="Sign out of account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium text-white px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
