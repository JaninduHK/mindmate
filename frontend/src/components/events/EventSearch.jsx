import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';

const EventSearch = ({ onSearch }) => {
  const [value, setValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full">
      <div className="relative flex-1">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search events, topics, counselors…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-l-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <button
        type="submit"
        className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-r-xl text-sm font-medium transition-colors"
      >
        Search
      </button>
    </form>
  );
};

export default EventSearch;
