import { FiStar } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const ReviewCard = ({ review }) => {
  const { userId, rating, comment, createdAt, isVerified } = review;

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {userId?.avatar?.url ? (
            <img src={userId.avatar.url} alt={userId.name} className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
              {userId?.name?.[0]}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">{userId?.username || userId?.name}</p>
            <p className="text-xs text-gray-400">{formatDistanceToNow(new Date(createdAt), { addSuffix: true })}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <FiStar
              key={s}
              className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
            />
          ))}
        </div>
      </div>
      {comment && <p className="mt-3 text-sm text-gray-600">{comment}</p>}
      {isVerified && (
        <p className="mt-2 text-xs text-green-600 font-medium">✓ Verified booking</p>
      )}
    </div>
  );
};

export default ReviewCard;
