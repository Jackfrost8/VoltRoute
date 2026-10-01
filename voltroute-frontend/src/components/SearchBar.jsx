import { Search } from 'lucide-react';
import { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg">
      <div className="relative flex items-center w-full h-12 rounded-full focus-within:shadow-md bg-white border border-gray-200 dark:border-gray-700 overflow-hidden transition-shadow">
        <div className="grid place-items-center h-full w-12 text-gray-400">
          <Search className="h-5 w-5" />
        </div>

        <input
          className="peer h-full w-full outline-none text-sm text-gray-700 dark:text-gray-200 bg-transparent pr-2"
          type="text"
          id="search"
          placeholder="Search by city, operator, or station name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        
        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-white h-full px-6 text-sm font-medium transition-colors"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
