import { ExternalLink } from 'lucide-react';
import Button from '../../common/Button.jsx';

const ContentCard = ({ content }) => {
  const typeIcon = {
    video: '🎬',
    article: '📰',
    audio: '🎧',
    story: '🎭',
  }[content.type] || '📚';

  const riskLevelConfig = {
    high: { icon: '🟠', label: 'Urgent Support', color: 'bg-orange-50 border-orange-200' },
    medium: { icon: '🟡', label: 'Helpful Resource', color: 'bg-yellow-50 border-yellow-200' },
    low: { icon: '🟢', label: 'Wellness Content', color: 'bg-green-50 border-green-200' },
  };

  const riskLevel = riskLevelConfig[content.riskLevel] || riskLevelConfig.low;

  const handleViewContent = () => {
    if (content.externalUrl) {
      window.open(content.externalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Thumbnail */}
      {content.thumbnail && (
        <div className="h-40 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          <img
            src={content.thumbnail}
            alt={content.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{typeIcon}</span>
          <span className="text-xs font-semibold text-primary-700 bg-primary-100 px-2 py-1 rounded">
            {content.type?.charAt(0).toUpperCase() + content.type?.slice(1) || 'Content'}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-primary-600 transition-colors">
          {content.title}
        </h3>

        {/* Description */}
        {content.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {content.description}
          </p>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 mb-3 flex gap-4">
          {content.duration && <span>⏱️ {content.duration}</span>}
          {content.source && <span>📌 {content.source}</span>}
        </div>

        {/* Risk Level */}
        <div className={`border rounded-lg p-2 mb-3 text-xs font-semibold text-center ${riskLevel.color}`}>
          {riskLevel.icon} {riskLevel.label}
        </div>

        {/* View Button */}
        {content.externalUrl && (
          <Button
            onClick={handleViewContent}
            size="sm"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 mt-auto"
          >
            <ExternalLink className="w-4 h-4" />
            View Content
          </Button>
        )}
      </div>
    </div>
  );
};

export default ContentCard;
