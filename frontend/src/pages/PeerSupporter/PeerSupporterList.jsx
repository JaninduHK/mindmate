import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { peerSupporterAPI } from '../../api/peerSupporter.api';
import Loading from '../../components/common/Loading';
import { FiMessageCircle, FiCheck, FiX, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';

const PeerSupporterList = () => {
  const navigate = useNavigate();
  const [peerSupporters, setPeerSupporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPeerSupporters = async (pageNum = 1, showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await peerSupporterAPI.list({ page: pageNum, limit: 12 });
      if (res.success) {
        setPeerSupporters(res.data.peerSupporters);
        setTotalPages(res.data.pages);
      }
    } catch {
      toast.error('Failed to load peer supporters');
    } finally {
      if (showLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPeerSupporters(page, true);
  }, [page]);

  // Auto-refresh every 30 seconds to check availability updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPeerSupporters(page, false);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [page]);

  const handleChatClick = (supporterId, isAvailable) => {
    if (!isAvailable) {
      toast.error('This peer counselor is currently unavailable. Please try again later.');
      return;
    }
    navigate(`/chat/${supporterId}`);
  };

  const handleManualRefresh = async () => {
    await fetchPeerSupporters(page, false);
    toast.success('List refreshed');
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find a Peer Supporter</h1>
          <p className="text-gray-600 mt-2">Chat with an available peer supporter or schedule a session</p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : peerSupporters.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No peer supporters found</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {peerSupporters.map((ps) => (
              <div key={ps._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {ps.avatar?.url ? (
                      <img
                        src={ps.avatar.url}
                        alt={ps.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                        {ps.name?.[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">{ps.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{ps.email}</p>
                    <div className="mt-2 inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Peer Supporter
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="mb-4">
                    {ps.isAvailableNow ? (
                      <div className="flex items-center justify-center gap-2 text-green-600 font-semibold text-sm bg-green-50 py-2 rounded-lg">
                        <FiCheck className="w-4 h-4" />
                        Available Now
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-600 font-semibold text-sm bg-gray-100 py-2 rounded-lg">
                        <FiX className="w-4 h-4" />
                        Offline
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleChatClick(ps._id, ps.isAvailableNow)}
                    disabled={!ps.isAvailableNow}
                    className={`w-full py-3 rounded-lg transition-colors font-semibold flex items-center justify-center gap-2 ${
                      ps.isAvailableNow
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    Chat Now
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-4 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 font-semibold">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-6 py-2 rounded-lg border border-gray-300 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
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
