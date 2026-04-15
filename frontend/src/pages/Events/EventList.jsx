import { useState, useEffect, useCallback } from 'react';
import { eventAPI } from '../../api/event.api';
import EventCard from '../../components/events/EventCard';
import EventFilters from '../../components/events/EventFilters';
import EventSearch from '../../components/events/EventSearch';
import Loading from '../../components/common/Loading';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      if (search) params.search = search;
      const res = await eventAPI.list(params);
      if (res && res.events) {
        setEvents(res.events);
        setTotalPages(res.pages || 1);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
    setLoading(false);
  }, [filters, search, page]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSearch = (q) => {
    setSearch(q);
    setPage(1);
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Events & Sessions</h1>

      <div className="mb-6">
        <EventSearch onSearch={handleSearch} />
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <EventFilters filters={filters} onChange={handleFiltersChange} />
        </aside>

        {/* Events grid */}
        <main className="flex-1">
          {loading ? (
            <div className="flex justify-center py-16"><Loading /></div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No events found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg border text-sm disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
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
        </main>
      </div>
    </div>
  );
};

export default EventList;
