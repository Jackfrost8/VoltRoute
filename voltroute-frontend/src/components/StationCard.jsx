import { Link } from 'react-router-dom';
import { MapPin, BatteryCharging, Zap, Heart } from 'lucide-react';
import { formatDistance } from '../utils/helpers';
import { useAuth } from '../hooks/useAuth';

const StationCard = ({ station, isFavorite, onToggleFavorite }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
              {station.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{station.address}</span>
            </p>
          </div>
          {user && (
            <button
              onClick={() => onToggleFavorite(station.id)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'
                }`}
              />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex items-center text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
            <Zap className="w-4 h-4 mr-1" />
            <span className="font-medium">{station.powerKw || 'Standard'} kW</span>
          </div>
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
            <BatteryCharging className="w-4 h-4 mr-1" />
            {station.connectorType}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {station.distance ? formatDistance(station.distance) : 'Unknown distance'}
          </div>
          <Link
            to={`/station/${station.id}`}
            className="text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StationCard;
