import { useState, useEffect } from 'react';
import { favoriteService } from '../services/favoriteService';
import FavoriteCard from '../components/FavoriteCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { HeartCrack } from 'lucide-react';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch favorites', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await favoriteService.removeFavorite(id);
      setFavorites(favorites.filter(fav => fav.id !== id));
    } catch (error) {
      console.error('Failed to remove favorite', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Saved Stations
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your favorite charging locations for quick access.
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <HeartCrack className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Start saving stations from the map to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites.map((favorite) => (
            <FavoriteCard 
              key={favorite.id} 
              favorite={favorite} 
              onRemove={handleRemove} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
