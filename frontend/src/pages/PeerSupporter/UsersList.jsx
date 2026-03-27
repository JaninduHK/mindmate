import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../api/user.api';
import Loading from '../../components/common/Loading';
import { FiMessageCircle, FiArrowLeft } from 'react-icons/fi';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await userAPI.getUsers({ page, limit: 12 });
        if (res.success) {
          setUsers(res.data.users);
          setTotalPages(res.data.pages);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [page]);

  const handleHelpClick = (userId) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People Needing Support</h1>
          <p className="text-gray-600 mt-2">Connect with users who need your support</p>
        </div>
        <button
          onClick={() => navigate('/peer-supporter/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No users available at this time</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {user.avatar?.url ? (
                      <img
                        src={user.avatar.url}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-green-100"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-600">
                        {user.name?.[0]}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="font-semibold text-lg text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                    <div className="mt-2 inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      Needs Support
                    </div>
                  </div>

                  <button
                    onClick={() => handleHelpClick(user._id)}
                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    Person Help
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

export default UsersList;
