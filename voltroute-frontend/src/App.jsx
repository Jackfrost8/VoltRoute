import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ROUTES } from './utils/constants';

// Layout Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import StationDetails from './pages/StationDetails';
import RouteOptimizer from './pages/RouteOptimizer';
import DemandPrediction from './pages/DemandPrediction';
import TravelPrediction from './pages/TravelPrediction';
import NotFound from './pages/NotFound';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthProvider>
      <LocationProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white transition-colors duration-200">
            <Navbar toggleSidebar={toggleSidebar} />
            
            <div className="flex flex-1 overflow-hidden">
              <Sidebar isOpen={sidebarOpen} closeSidebar={closeSidebar} />
              
              <main className="flex-1 overflow-y-auto relative outline-none focus:outline-none">
                <Routes>
                  {/* Public Routes */}
                  <Route path={ROUTES.HOME} element={<Home />} />
                  <Route path={ROUTES.LOGIN} element={<Login />} />
                  <Route path={ROUTES.REGISTER} element={<Register />} />
                  <Route path={ROUTES.STATION_DETAILS} element={<StationDetails />} />
                  
                  {/* Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                    <Route path={ROUTES.PROFILE} element={<Profile />} />
                    <Route path={ROUTES.FAVORITES} element={<Favorites />} />
                    <Route path={ROUTES.ROUTE_OPTIMIZER} element={<RouteOptimizer />} />
                    <Route path={ROUTES.DEMAND_PREDICTION} element={<DemandPrediction />} />
                    <Route path={ROUTES.TRAVEL_PREDICTION} element={<TravelPrediction />} />
                  </Route>

                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            
            {/* <Footer /> - Optional, might not look good with sidebars */}
          </div>
        </Router>
      </LocationProvider>
    </AuthProvider>
  );
}

export default App;
