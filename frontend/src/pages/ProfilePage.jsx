import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Calendar, LogOut, Compass, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export function ProfilePage() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadFresh() {
      setLoading(true);
      setError(null);
      try {
        await refreshProfile();
      } catch (err) {
        setError(err.message || 'Failed to refresh user profile data.');
      } finally {
        setLoading(false);
      }
    }
    loadFresh();
  }, [refreshProfile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading && !user) {
    return <LoadingSpinner text="Loading driver profile..." size="lg" />;
  }

  const roleList = Array.isArray(user?.roles)
    ? user.roles
    : user?.roles
    ? [user.roles]
    : user?.role
    ? [user.role]
    : ['ROLE_USER'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Authenticated Driver'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active Session
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span>{user?.email || 'driver@voltroute.com'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            to="/"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition"
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Station Finder</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 text-xs font-medium text-rose-300 hover:text-white px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Account Details */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Account Overview</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Account ID</span>
              <span className="font-mono text-slate-200 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                {user?.id ? `USR-${user.id}` : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Full Name</span>
              <span className="text-slate-200 font-medium">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Not provided'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Registered Email</span>
              <span className="text-slate-200 font-medium">{user?.email || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Registration Timestamp</span>
              <span className="text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Recent Session'}
              </span>
            </div>
          </div>
        </div>

        {/* Security & Roles */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>Security & Permissions</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-1">Assigned Authorities</span>
              <div className="flex items-center gap-2 flex-wrap">
                {roleList.map((role, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 block text-[11px] mb-1">Authentication Method</span>
              <span className="text-slate-300">
                Stateless cryptographic JSON Web Token (HMAC-SHA256)
              </span>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 block text-[11px] mb-1">Token Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Active Bearer session verified
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
