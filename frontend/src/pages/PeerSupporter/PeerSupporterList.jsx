import { useState, useEffect } from 'react';
import { peerSupporterAPI } from '../../api/peerSupporter.api';
import Loading from '../../components/common/Loading';

const PeerSupporterList = () => {
  const [peerSupporters, setPeerSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await peerSupporterAPI.list({ page, limit: 12 });
        if (res.success) {
          setPeerSupporters(res.data.peerSupporters);
          setTotalPages(res.data.pages);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [page]);

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Peer Supporter</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : peerSupporters.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No peer supporters found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {peerSupporters.map((ps) => (
              <div key={ps._id} className="block group">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start space-x-4">
                    {ps.avatar?.url ? (
                      <img
                        src={ps.avatar.url}
                        alt={ps.name}
                        className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-600 flex-shrink-0">
                        {ps.name?.[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {ps.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{ps.email}</p>
                      <p className="text-xs text-blue-600 mt-2 font-semibold">Peer Supporter</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

export default PeerSupporterList;
