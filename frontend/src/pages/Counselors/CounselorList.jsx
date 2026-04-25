import { useState, useEffect, useCallback } from 'react';
import { counselorAPI } from '../../api/counselor.api';
import CounselorCard from '../../components/counselor/CounselorCard';
import Loading from '../../components/common/Loading';

const SPECIALIZATIONS = [
  'Anxiety', 'Depression', 'Stress', 'Relationships', 'Trauma',
  'Grief', 'PTSD', 'Family', 'Career', 'Self-Esteem', 'Addiction', 'Anger',
];

const CounselorList = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12 };
        if (search) params.search = search;
        if (specialization) params.specialization = specialization;
        const res = await counselorAPI.list(params);
        if (res.success) {
          setCounselors(res.data.counselors);
          setTotalPages(res.data.pages);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [page, search, specialization]);

  const handleSpecialization = useCallback((s) => {
    setSpecialization((prev) => (prev === s ? '' : s));
    setPage(1);
  }, []);

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setSpecialization('');
    setPage(1);
  };

  const hasFilters = searchInput || specialization;

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Counselor</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search counselors by name…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Specialization filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SPECIALIZATIONS.map((s) => (
          <button
            key={s}
            onClick={() => handleSpecialization(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              specialization === s
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400 hover:text-primary-600'
            }`}
          >
            {s}
          </button>
        ))}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-1 rounded-full text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : counselors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          No counselors found
          {hasFilters && (
            <button onClick={clearFilters} className="block mx-auto mt-2 text-sm text-primary-600 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counselors.map((c) => <CounselorCard key={c._id} counselor={c} />)}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CounselorList;
