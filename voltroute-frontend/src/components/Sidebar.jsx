import { NavLink } from 'react-router-dom';
import { Home, Map, Heart, Navigation, Activity, Clock, User } from 'lucide-react';
import { ROUTES } from '../utils/constants';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const navigation = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: Home },
    { name: 'Map', href: ROUTES.HOME, icon: Map },
    { name: 'Favorites', href: ROUTES.FAVORITES, icon: Heart },
    { name: 'Route Optimizer', href: ROUTES.ROUTE_OPTIMIZER, icon: Navigation },
    { name: 'Demand Prediction', href: ROUTES.DEMAND_PREDICTION, icon: Activity },
    { name: 'Travel Prediction', href: ROUTES.TRAVEL_PREDICTION, icon: Clock },
    { name: 'Profile', href: ROUTES.PROFILE, icon: User },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 bg-gray-600 bg-opacity-75 z-20 md:hidden transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto md:w-64 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`
                }
              >
                <item.icon
                  className={`flex-shrink-0 mr-3 h-5 w-5`}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
