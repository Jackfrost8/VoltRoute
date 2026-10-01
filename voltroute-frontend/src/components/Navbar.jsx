import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Menu } from 'lucide-react';
import { ROUTES, APP_NAME } from '../utils/constants';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-emerald-500 md:hidden"
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
            <Link to={ROUTES.HOME} className="flex-shrink-0 flex items-center ml-4 md:ml-0">
              <Zap className="h-8 w-8 text-emerald-500" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {APP_NAME}
              </span>
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={ROUTES.PROFILE}
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400"
                >
                  {user.firstName || user.name}
                </Link>
                <button
                  onClick={logout}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-gray-700 hover:text-emerald-600 dark:text-gray-300 dark:hover:text-emerald-400 flex items-center"
                >
                  Log in
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
