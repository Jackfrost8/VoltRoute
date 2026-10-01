import { useState } from 'react';
import { aiService } from '../services/aiService';
import { Navigation, Battery, MapPin, Loader2, ArrowRight } from 'lucide-react';
import MapComponent from '../components/MapComponent';

const RouteOptimizer = () => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    batteryPercentage: 50
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await aiService.getOptimizedRoute(formData);
      setResult(data);
    } catch (error) {
      console.error('Failed to optimize route', error);
      // Mock result for demo
      setTimeout(() => {
        setResult({
          optimizedRoute: [
            { lat: 37.7749, lng: -122.4194 },
            { lat: 37.3382, lng: -121.8863 }
          ],
          recommendedStops: [
            { name: "Supercharger San Jose", distance: "45 miles", chargeTime: "20 mins" }
          ],
          totalTravelTime: "1h 15m",
          totalChargeTime: "20 mins"
        });
        setLoading(false);
      }, 1500);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/3 flex flex-col h-full overflow-y-auto pr-2 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Route Optimizer
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Plan your trip with AI-optimized charging stops.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Origin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="origin"
                required
                value={formData.origin}
                onChange={handleChange}
                placeholder="Current location"
                className="pl-10 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination</label>
            <div className="relative">
              <Navigation className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="destination"
                required
                value={formData.destination}
                onChange={handleChange}
                placeholder="Where to?"
                className="pl-10 w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex justify-between">
              <span>Current Battery</span>
              <span className="text-emerald-600 font-bold">{formData.batteryPercentage}%</span>
            </label>
            <div className="flex items-center space-x-3">
              <Battery className="h-6 w-6 text-gray-400" />
              <input
                type="range"
                name="batteryPercentage"
                min="1"
                max="100"
                value={formData.batteryPercentage}
                onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center transition-colors disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Navigation className="w-5 h-5 mr-2" />}
            Optimize Route
          </button>
        </form>

        {result && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
            <h3 className="font-bold text-emerald-900 dark:text-emerald-100 mb-4">Trip Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Est. Arrival</span>
                <span className="font-bold text-gray-900 dark:text-white">{result.totalTravelTime}</span>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl">
                <span className="text-gray-600 dark:text-gray-400 text-sm">Charging Time</span>
                <span className="font-bold text-emerald-600">{result.totalChargeTime}</span>
              </div>
              
              <div className="pt-2">
                <h4 className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 mb-2">Recommended Stops</h4>
                {result.recommendedStops.map((stop, idx) => (
                  <div key={idx} className="flex items-start mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{stop.name}</p>
                      <p className="text-xs text-gray-500">{stop.chargeTime} charge needed</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full md:w-2/3 h-full min-h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
        <MapComponent />
      </div>
    </div>
  );
};

export default RouteOptimizer;
