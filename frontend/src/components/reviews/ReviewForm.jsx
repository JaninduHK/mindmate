import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { reviewAPI } from '../../api/review.api';
import toast from 'react-hot-toast';

const ReviewForm = ({ eventId, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setSubmitting(true);
    try {
      const trimmedComment = comment.trim();
      if (trimmedComment.length > 1000) {
        toast.error('Review cannot exceed 1000 characters');
        return;
      }
      const res = await reviewAPI.create({ eventId, rating, comment: trimmedComment });
      if (!res.success) throw new Error(res.message);
      toast.success('Review submitted');
      onSuccess(res.data.review);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-primary-50 border border-primary-100 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Leave a Review</h3>

      {/* Star selector */}
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
          >
            <FiStar
              className={`w-7 h-7 transition-colors ${
                s <= (hovered || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-500">
            {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
          </span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Share your experience… (optional)"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
      />

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
};

export default ReviewForm;
