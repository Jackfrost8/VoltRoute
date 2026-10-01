import { useState } from 'react';
import { aiService } from '../services/aiService';
import { Activity, MapPin, Loader2, TrendingUp, Clock } from 'lucide-react';

const DemandPrediction = () => {
  const [stationId, setStationId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await aiService.getDemandPrediction({ stationId });
      setResult(data);
    } catch (error) {
      // Mock data for demo
      setTimeout(() => {
        setResult({
          currentDemand: 'Low',
          predictedDemand: 'High',
          peakHours: '4:00 PM - 7:00 PM',
          recommendation: 'Charge before 3:30 PM to avoid waiting.'
        });
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
          <Activity className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Demand Prediction
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          AI forecasts station availability so you never wait.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
        <form onSubmit={handleSubmit} className="p-8 border-b border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Station ID or Name
          </label>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                required
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                placeholder="e.g. STAT-123 or Downtown Supercharger"
                className="pl-10 w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !stationId}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors disabled:opacity-70 flex items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Predict'}
            </button>
          </div>
        </form>

        {result && (
          <div className="p-8 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Forecast Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <Activity className="w-4 h-4 mr-1" /> Current
                </div>
                <div className={`text-xl font-bold ${result.currentDemand === 'Low' ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {result.currentDemand}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" /> Next 2 Hours
                </div>
                <div className={`text-xl font-bold ${result.predictedDemand === 'High' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {result.predictedDemand}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> Peak Hours
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {result.peakHours}
                </div>
              </div>
            </div>

            <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl text-purple-800 dark:text-purple-300 font-medium text-sm">
              <span className="font-bold mr-1">AI Suggestion:</span> {result.recommendation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandPrediction;
