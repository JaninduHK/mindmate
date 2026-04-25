import toast from 'react-hot-toast';
import { FiMessageCircle, FiX } from 'react-icons/fi';

export const showMessageNotification = (data) => {
  const { senderName, message, isGroupMessage, groupName } = data;

  toast.custom((t) => (
    <div
      className={`
        relative max-w-sm w-full bg-gradient-to-r from-blue-50 to-indigo-50 
        rounded-lg shadow-lg border-l-4 border-primary-600 
        overflow-hidden transform transition-all duration-300
        ${t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      `}
    >
      {/* Animated border accent */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-primary-400 to-primary-600 opacity-40"></div>

      <div className="p-4 flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary-100 animate-pulse">
            <FiMessageCircle className="h-6 w-6 text-primary-600" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {senderName || 'New Message'}
              </p>
              {isGroupMessage && (
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  in {groupName}
                </p>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors ml-2"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          {/* Message preview */}
          <p className="text-sm text-gray-700 mt-2 line-clamp-2 leading-relaxed">
            {message}
          </p>

          {/* Action hint */}
          <p className="text-xs text-primary-600 font-semibold mt-2 flex items-center gap-1">
            Click to dismiss • Opens when you chat
          </p>
        </div>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"></div>
    </div>
  ), {
    duration: 5000,
    position: 'top-right',
  });
};
