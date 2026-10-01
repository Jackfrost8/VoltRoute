import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stationService } from '../services/stationService';
import { favoriteService } from '../services/favoriteService';
import LoadingSpinner from '../components/LoadingSpinner';
import { MapPin, BatteryCharging, Zap, Navigation, Heart, ArrowLeft, Clock, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const StationDetails = () => {
  const { id } = useParams();
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStation = async () => {
      try {
        setLoading(true);
        const data = await stationService.getStationById(id);
        setStation(data);
        // Would normally check if it's in user's favorites here
      } catch (error) {
        console.error('Failed to fetch station', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStation();
  }, [id]);

  const toggleFavorite = async () => {
    if (!user) return;
    try {
      if (isFavorite) {
        // Assume we have the favorite ID if it was a favorite
        // await favoriteService.removeFavorite(favoriteId);
        setIsFavorite(false);
      } else {
        await favoriteService.addFavorite(station.id);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Failed to toggle favorite', error);
    }
  };

  const handleNavigate = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank');
  };

  if (loading) return <LoadingSpinner />;
  if (!station) return <div className="p-8 text-center">Station not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-emerald-600 hover:text-emerald-700 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Map
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                {station.name}
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {station.address}
              </p>
            </div>
            {user && (
              <button
                onClick={toggleFavorite}
                className="p-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/30">
              <div className="flex items-center text-emerald-700 dark:text-emerald-400 mb-2">
                <Zap className="w-5 h-5 mr-2" />
                <span className="font-semibold">Power Output</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {station.powerKw || 'Standard'} <span className="text-xl font-normal text-gray-500">kW</span>
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center text-blue-700 dark:text-blue-400 mb-2">
                <BatteryCharging className="w-5 h-5 mr-2" />
                <span className="font-semibold">Connector</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {station.connectorType}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex items-start">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl mr-4">
                <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Demand</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">Low (Available)</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl mr-4">
                <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Est. Travel Time</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">12 mins away</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleNavigate}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Navigate with Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default StationDetails;
