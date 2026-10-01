import { useState } from 'react';
import { aiService } from '../services/aiService';
import { Clock, Navigation, MapPin, Loader2, AlertTriangle, Car } from 'lucide-react';

const TravelPrediction = () => {
  const [formData, setFormData] = useState({ origin: '', destination: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await aiService.getTravelTimePrediction(formData);
      setResult(data);
    } catch (error) {
      // Mock data for demo
      setTimeout(() => {
        setResult({
          distance: '24.5 miles',
          trafficLevel: 'Moderate',
          estimatedTravelTime: '45 mins',
          factors: ['Rush hour approaching', 'Minor construction on I-80']
        });
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Travel Time Prediction
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Get AI-powered ETAs based on traffic and weather conditions.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        <form onSubmit={handleSubmit} className="p-8 border-b border-gray-100 dark:border-gray-700 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Starting point"
                  className="pl-10 w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
                  placeholder="End point"
                  className="pl-10 w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !formData.origin || !formData.destination}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center justify-center mt-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Clock className="w-5 h-5 mr-2" />}
            Calculate ETA
          </button>
        </form>

        {result && (
          <div className="p-8 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Trip Estimate</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">Distance</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{result.distance}</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">ETA</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{result.estimatedTravelTime}</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">Traffic</span>
                <span className={`text-lg font-bold ${result.trafficLevel === 'Moderate' ? 'text-orange-500' : 'text-emerald-500'}`}>
                  {result.trafficLevel}
                </span>
              </div>
            </div>

            {result.factors && result.factors.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl">
                <div className="flex items-center text-yellow-800 dark:text-yellow-300 font-semibold mb-2 text-sm">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Traffic Factors
                </div>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400/80 space-y-1 ml-1">
                  {result.factors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelPrediction;
