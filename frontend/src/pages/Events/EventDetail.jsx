import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUsers, FiStar, FiDollarSign, FiClock, FiArrowLeft } from 'react-icons/fi';
import { format } from 'date-fns';
import { eventAPI } from '../../api/event.api';
import { reviewAPI } from '../../api/review.api';
import Loading from '../../components/common/Loading';
import ReviewCard from '../../components/reviews/ReviewCard';
import { useAuth } from '../../hooks/useAuth';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [eRes, rRes] = await Promise.all([
          eventAPI.getById(id),
          reviewAPI.getForEvent(id),
        ]);
        if (eRes.success) setEvent(eRes.data.event);
        if (rRes.success) setReviews(rRes.data.reviews);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-16"><Loading /></div>;
  if (!event) return <div className="container-custom py-16 text-center text-gray-400">Event not found</div>;

  const { title, description, coverImage, category, eventType, deliveryMode, venueType,
    venue, startDate, duration, capacity, seatsAvailable, price, rating, reviewCount,
    counselorId, tags, status } = event;

  return (
    <div className="container-custom py-8 max-w-4xl">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm text-gray-500 hover:text-primary-600 mb-4">
        <FiArrowLeft className="mr-1" /> Back
      </button>

      {/* Cover */}
      <div className="rounded-2xl overflow-hidden h-64 bg-gray-100 mb-6">
        {coverImage?.url ? (
          <img src={coverImage.url} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <span className="text-primary-200 text-7xl font-bold">M</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full capitalize">{category}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{eventType.replace('_', ' ')}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">{deliveryMode.replace('_', ' ')}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {rating > 0 && (
              <div className="flex items-center space-x-2 mt-2">
                <FiStar className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-gray-400 text-sm">({reviewCount} reviews)</span>
              </div>
            )}
          </div>

          {counselorId && (
            <Link to={`/counselors/${counselorId._id}`} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              {counselorId.avatar?.url ? (
                <img src={counselorId.avatar.url} alt={counselorId.name} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">{counselorId.name?.[0]}</div>
              )}
              <div>
                <p className="font-medium text-gray-900">{counselorId.name}</p>
                <p className="text-sm text-gray-500">View profile</p>
              </div>
            </Link>
          )}

          <div>
            <h2 className="font-semibold text-gray-900 mb-2">About this event</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
          </div>

          {tags?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Reviews</h2>
              <div className="space-y-3">
                {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
              </div>
            </div>
          )}
        </div>

        {/* Booking sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sticky top-6 space-y-4">
            <div className="text-2xl font-bold text-primary-600">
              {price === 0 ? 'Free' : `$${price.toFixed(2)}`}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <FiCalendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{format(new Date(startDate), 'EEEE, MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{format(new Date(startDate), 'h:mm a')} · {duration} min</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="capitalize">{venueType.replace(/_/g, ' ')}</span>
              </div>
              {venue?.city && (
                <div className="flex items-center space-x-2">
                  <FiMapPin className="w-4 h-4 text-transparent flex-shrink-0" />
                  <span>{venue.city}{venue.country ? `, ${venue.country}` : ''}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <FiUsers className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{seatsAvailable} of {capacity} seats left</span>
              </div>
            </div>

            {status === 'published' && seatsAvailable > 0 ? (
              isAuthenticated ? (
                <Link
                  to={`/booking/checkout/${id}`}
                  className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Book Now
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="block w-full text-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Login to Book
                </Link>
              )
            ) : (
              <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed">
                {seatsAvailable === 0 ? 'Fully Booked' : 'Unavailable'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
