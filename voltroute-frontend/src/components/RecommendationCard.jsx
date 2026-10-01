import { Sparkles, MapPin, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecommendationCard = ({ station, reason }) => {
  if (!station) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
      
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-5 h-5 text-yellow-300" />
        <span className="font-semibold text-sm tracking-wide uppercase text-emerald-50">
          AI Recommended
        </span>
      </div>

      <h3 className="text-2xl font-bold mb-1">{station.name}</h3>
      <p className="text-emerald-100 text-sm flex items-center mb-4">
        <MapPin className="w-4 h-4 mr-1 opacity-75" />
        {station.address}
      </p>

      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 mb-5 inline-block">
        <p className="text-sm font-medium">
          <span className="opacity-80">Why: </span>
          {reason || "Optimal balance of distance and charging speed."}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex space-x-3">
          <div className="flex items-center text-sm font-medium">
            <Zap className="w-4 h-4 mr-1 text-yellow-300" />
            {station.powerKw || 'Standard'} kW
          </div>
        </div>
        <Link
          to={`/station/${station.id}`}
          className="bg-white text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RecommendationCard;
