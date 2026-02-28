import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiArrowLeft } from 'react-icons/fi';
import { counselorAPI } from '../../api/counselor.api';
import { eventAPI } from '../../api/event.api';
import { reviewAPI } from '../../api/review.api';
import Loading from '../../components/common/Loading';
import EventCard from '../../components/events/EventCard';
import ReviewCard from '../../components/reviews/ReviewCard';

const CounselorProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [pRes, eRes, rRes] = await Promise.all([
          counselorAPI.getById(id),
          eventAPI.list({ counselorId: id, limit: 6 }),
          reviewAPI.getForCounselor(id),
        ]);
        if (pRes.success) setProfile(pRes.data.profile);
        if (eRes.success) setEvents(eRes.data.events);
        if (rRes.success) setReviews(rRes.data.reviews);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;
  if (!profile) return <div className="container-custom py-16 text-center text-gray-400">Counselor not found</div>;

  const { userId, bio, specializations, certifications, languages, rating, reviewCount } = profile;

  return (
    <div className="container-custom py-8 max-w-4xl">
      <Link to="/counselors" className="flex items-center text-sm text-gray-500 hover:text-primary-600 mb-4">
        <FiArrowLeft className="mr-1" /> Back to counselors
      </Link>

      {/* Profile header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start space-x-5">
          {userId?.avatar?.url ? (
            <img src={userId.avatar.url} alt={userId.name} className="w-20 h-20 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 flex-shrink-0">
              {userId?.name?.[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{userId?.name}</h1>
            {rating > 0 && (
              <div className="flex items-center space-x-2 mt-1">
                <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({reviewCount} reviews)</span>
              </div>
            )}
            {bio && <p className="text-gray-600 mt-3">{bio}</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {specializations?.map((s) => (
                <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-full capitalize">{s}</span>
              ))}
            </div>
            {languages?.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">Languages: {languages.join(', ')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Certifications */}
      {certifications?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Certifications</h2>
          <div className="space-y-2">
            {certifications.map((c, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{c.name}</span>
                  <span className="text-gray-400 ml-2">— {c.issuingBody}</span>
                </div>
                {c.fileUrl && (
                  <a href={c.fileUrl} target="_blank" rel="noreferrer" className="text-primary-600 text-xs hover:underline">View</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {events.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Upcoming Sessions & Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => <EventCard key={e._id} event={e} />)}
          </div>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Client Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CounselorProfile;
