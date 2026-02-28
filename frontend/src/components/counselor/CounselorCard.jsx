import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

const CounselorCard = ({ counselor }) => {
  const { userId, bio, specializations, rating, reviewCount } = counselor;

  return (
    <Link to={`/counselors/${userId?._id}`} className="block group">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          {userId?.avatar?.url ? (
            <img
              src={userId.avatar.url}
              alt={userId.name}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600 flex-shrink-0">
              {userId?.name?.[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
              {userId?.name}
            </h3>
            {rating > 0 && (
              <div className="flex items-center space-x-1 text-sm mt-0.5">
                <FiStar className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-gray-700">{rating.toFixed(1)}</span>
                <span className="text-gray-400">({reviewCount} reviews)</span>
              </div>
            )}
            {bio && (
              <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{bio}</p>
            )}
            {specializations?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {specializations.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full capitalize"
                  >
                    {s}
                  </span>
                ))}
                {specializations.length > 3 && (
                  <span className="text-xs text-gray-400">+{specializations.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CounselorCard;
