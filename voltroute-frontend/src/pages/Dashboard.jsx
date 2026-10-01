import { useState, useEffect } from 'react';
import { BatteryCharging, Clock, Activity, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import DashboardStats from '../components/DashboardStats';
import StationCard from '../components/StationCard';
import RecommendationCard from '../components/RecommendationCard';
import { favoriteService } from '../services/favoriteService';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const favs = await favoriteService.getFavorites();
        setFavorites(Array.isArray(favs) ? favs.slice(0, 3) : []);
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = [
    { name: 'Saved Stations', value: favorites.length, icon: BatteryCharging, color: 'emerald' },
    { name: 'Avg. Travel Time', value: '25 mins', icon: Clock, color: 'blue' },
    { name: 'Charge Frequency', value: '3x/week', icon: Activity, color: 'purple' },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Driver'}!
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Here's what's happening with your EV charging today.
        </p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <MapPin className="mr-2 w-5 h-5 text-emerald-500" />
              Recently Saved Stations
            </h2>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((fav) => (
                  <StationCard 
                    key={fav.id} 
                    station={fav.station} 
                    isFavorite={true}
                    onToggleFavorite={() => {}} // Handle un-favorite in full page
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 text-center border border-gray-100 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 mb-4">No saved stations yet.</p>
                <button className="text-emerald-600 font-medium hover:text-emerald-700">
                  Explore Map
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Activity className="mr-2 w-5 h-5 text-emerald-500" />
              AI Insights
            </h2>
            <RecommendationCard 
              station={{
                id: 1,
                name: 'Supercharger Downtown',
                address: '123 Main St, City Center',
                powerKw: 150
              }} 
              reason="Predicted low demand in 15 mins. Perfect time to charge."
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
