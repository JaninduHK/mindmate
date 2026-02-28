import { Link } from 'react-router-dom';
import { FiCalendar, FiMapPin, FiUsers, FiStar } from 'react-icons/fi';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
  anxiety: 'bg-yellow-100 text-yellow-800',
  depression: 'bg-blue-100 text-blue-800',
  stress: 'bg-orange-100 text-orange-800',
  mindfulness: 'bg-green-100 text-green-800',
  grief: 'bg-purple-100 text-purple-800',
  trauma: 'bg-red-100 text-red-800',
  relationships: 'bg-pink-100 text-pink-800',
  addiction: 'bg-indigo-100 text-indigo-800',
  parenting: 'bg-teal-100 text-teal-800',
  general: 'bg-gray-100 text-gray-800',
};

const EventCard = ({ event }) => {
  const {
    _id, title, coverImage, category, eventType, deliveryMode,
    startDate, price, seatsAvailable, capacity, rating, reviewCount,
    counselorId,
  } = event;

  return (
    <Link to={`/events/${_id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        {/* Cover image */}
        <div className="h-44 bg-gray-100 relative overflow-hidden">
          {coverImage?.url ? (
            <img
              src={coverImage.url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-50">
              <span className="text-primary-300 text-4xl font-bold">M</span>
            </div>
          )}
          <span
            className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}`}
          >
            {category}
          </span>
        </div>

        <div className="p-4 space-y-3">
          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>

          {/* Counselor */}
          {counselorId && (
            <div className="flex items-center space-x-2">
              {counselorId.avatar?.url ? (
                <img src={counselorId.avatar.url} alt={counselorId.name} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs text-primary-600 font-bold">
                  {counselorId.name?.[0]}
                </div>
              )}
              <span className="text-sm text-gray-600">{counselorId.name}</span>
            </div>
          )}

          <div className="space-y-1 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{format(new Date(startDate), 'MMM d, yyyy · h:mm a')}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="capitalize">{deliveryMode.replace('_', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-3 text-sm text-gray-500">
              {rating > 0 && (
                <span className="flex items-center space-x-1 text-yellow-500">
                  <FiStar className="w-3.5 h-3.5 fill-yellow-400" />
                  <span className="text-gray-700 font-medium">{rating.toFixed(1)}</span>
                  <span className="text-gray-400">({reviewCount})</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <FiUsers className="w-3.5 h-3.5" />
                <span>{seatsAvailable}/{capacity}</span>
              </span>
            </div>
            <span className="font-bold text-primary-600">
              {price === 0 ? 'Free' : `Rs. ${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
