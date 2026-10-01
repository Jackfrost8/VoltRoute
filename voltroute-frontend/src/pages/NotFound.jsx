import { Link } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-9xl font-extrabold text-emerald-500 tracking-widest">404</h1>
      <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-4 py-1 text-sm rounded-md shadow-sm -mt-6 z-10 absolute rotate-12 font-bold uppercase">
        Page Not Found
      </div>
      <p className="mt-8 text-xl text-gray-500 dark:text-gray-400 text-center max-w-md">
        Oops! We can't seem to find the page you're looking for. It might have been moved or doesn't exist.
      </p>
      <div className="mt-10">
        <Link
          to={ROUTES.HOME}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-md hover:shadow-xl transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
