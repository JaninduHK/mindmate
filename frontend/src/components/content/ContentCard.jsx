import { ExternalLink, Play, FileText, Volume2, BookOpen } from 'lucide-react';

const ContentCard = ({ content }) => {
  const getTypeIcon = () => {
    switch (content.type?.toLowerCase()) {
      case 'video':
        return <Play className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'audio':
        return <Volume2 className="w-4 h-4" />;
      case 'story':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    const type = content.type?.toLowerCase();
    return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Content';
  };

  // Use supportive language for primary users
  const displayRiskLevel = (riskLevel) => {
    const riskMap = {
      high: '🟠 Urgent Support',
      medium: '🟡 Helpful Resource',
      low: '🟢 Wellness Content',
    };
    return riskMap[riskLevel?.toLowerCase()] || 'Resource';
  };

  const handleOpenContent = () => {
    if (content.externalUrl) {
      window.open(content.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer"
      onClick={handleOpenContent}
    >
      {/* Thumbnail */}
      {content.thumbnailUrl ? (
        <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <div className="text-primary-400">{getTypeIcon()}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type badge */}
        <div className="flex items-center space-x-2 mb-2">
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
            {getTypeIcon()}
            <span>{getTypeLabel()}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
          {content.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
          {content.description}
        </p>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          {content.durationText && (
            <span>{content.durationText}</span>
          )}
          {content.sourceDomain && (
            <span className="text-gray-400">{content.sourceDomain}</span>
          )}
        </div>

        {/* Risk level - supportive language */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs font-medium">
            {displayRiskLevel(content.riskLevel)}
          </span>
          
          {/* Open button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenContent();
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 transition-colors text-xs font-semibold"
            aria-label={`Open ${content.title}`}
          >
            <span>View</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentCard;
