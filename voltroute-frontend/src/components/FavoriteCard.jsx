import { Link } from 'react-router-dom';
import { Trash2, MapPin, ExternalLink } from 'lucide-react';

const FavoriteCard = ({ favorite, onRemove }) => {
  const station = favorite.station;
  
  if (!station) return null;

  const handleOpenMap = (e) => {
    e.preventDefault();
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`, '_blank');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0 pr-4">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          <Link to={`/station/${station.id}`} className="hover:text-emerald-500">
            {station.name}
          </Link>
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center">
          <MapPin className="w-3.5 h-3.5 mr-1" />
          {station.address}
        </p>
      </div>
      <div className="flex items-center space-x-2 flex-shrink-0">
        <button
          onClick={handleOpenMap}
          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          title="Open in Maps"
        >
          <ExternalLink className="w-5 h-5" />
        </button>
        <button
          onClick={() => onRemove(favorite.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Remove from favorites"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FavoriteCard;
