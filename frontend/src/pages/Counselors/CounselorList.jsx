import { useState, useEffect } from 'react';
import { counselorAPI } from '../../api/counselor.api';
import CounselorCard from '../../components/counselor/CounselorCard';
import Loading from '../../components/common/Loading';

const CounselorList = () => {
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await counselorAPI.list({ page, limit: 12 });
        if (res.success) {
          setCounselors(res.data.counselors);
          setTotalPages(res.data.pages);
        }
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [page]);

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find a Counselor</h1>

      {loading ? (
        <div className="flex justify-center py-16"><Loading /></div>
      ) : counselors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No counselors found</div>
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
