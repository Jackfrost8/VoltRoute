import { useState, useEffect } from 'react';
import { useLocation } from '../hooks/useLocation';
import { stationService } from '../services/stationService';
import { aiService } from '../services/aiService';
import MapComponent from '../components/MapComponent';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import StationCard from '../components/StationCard';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { location, loading: locationLoading } = useLocation();
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        // In a real app, you would fetch based on current location
        const data = await stationService.getAllStations();
        // Since we might not have a real backend responding properly yet, fallback gracefully
        setStations(Array.isArray(data) ? data : []);
        
        if (location && data && data.length > 0) {
          // Mock AI recommendation call
          setRecommendation({
            station: data[0],
            reason: 'Fastest charging available near your current route.'
          });
        }
      } catch (error) {
        console.error('Failed to fetch stations', error);
      } finally {
        setLoading(false);
      }
    };

    if (!locationLoading) {
      fetchStations();
    }
  }, [location, locationLoading]);

  const handleSearch = async (query) => {
    if (!query) return;
    try {
      setLoading(true);
      const data = await stationService.searchStations(query);
      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (filters) => {
    try {
      setLoading(true);
      const data = await stationService.filterStations(filters);
      setStations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Filter failed', error);
    } finally {
      setLoading(false);
    }
  };

  if (locationLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
      {/* Left Panel: Search & List */}
      <div className="w-full md:w-1/3 flex flex-col h-full overflow-hidden">
        <div className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Find Charging
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            AI-powered routing & stations near you.
          </p>
          <SearchBar onSearch={handleSearch} />
        </div>
        
        <div className="flex-shrink-0">
          <FilterPanel onFilterChange={handleFilterChange} />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4 pb-4">
          {recommendation && (
            <RecommendationCard 
              station={recommendation.station} 
              reason={recommendation.reason} 
            />
          )}

          <h2 className="font-semibold text-lg text-gray-900 dark:text-white mt-6 mb-3">
            Nearby Stations
          </h2>
          
          {loading ? (
            <LoadingSpinner />
          ) : stations.length > 0 ? (
            stations.map(station => (
              <StationCard 
                key={station.id} 
                station={station} 
                isFavorite={false}
                onToggleFavorite={() => {}}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              No stations found. Try adjusting filters.
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Map */}
      <div className="w-full md:w-2/3 h-full min-h-[400px] rounded-2xl overflow-hidden relative shadow-lg">
        <MapComponent stations={stations} />
      </div>
    </div>
  );
};

export default Home;
