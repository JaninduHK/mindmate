import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { BookOpen, Search, Zap } from 'lucide-react';
import { useContent } from '../../../hooks/emergency/useContent.js';
import ContentCard from '../../../components/emergency/content/ContentCard.jsx';
import Input from '../../../components/common/Input.jsx';

const ContentLibraryPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get content and recommendations
  const { contentList, recommendedContent, isLoading, isFetching } = useContent({
    type: activeTab === 'all' ? null : activeTab,
  });

  // Filter based on search query
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) {
      return contentList || [];
    }
    return (contentList || []).filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [contentList, searchQuery]);

  const tabs = [
    { id: 'all', label: '📚 All', count: contentList?.length || 0 },
    { id: 'video', label: '🎬 Videos', count: contentList?.filter(c => c.type === 'video').length || 0 },
    { id: 'article', label: '📰 Articles', count: contentList?.filter(c => c.type === 'article').length || 0 },
    { id: 'audio', label: '🎧 Audio', count: contentList?.filter(c => c.type === 'audio').length || 0 },
    { id: 'story', label: '🎭 Stories', count: contentList?.filter(c => c.type === 'story').length || 0 },
  ];

  const displayContent = activeTab === 'all' && !searchQuery.trim() && (recommendedContent?.length || 0) > 0
    ? [
        { type: 'recommended', items: recommendedContent.slice(0, 4) },
        { type: 'all', items: filteredContent },
      ]
    : [{ type: 'search', items: filteredContent }];

  return (
    <>
      <Helmet>
        <title>Content Library - MindMate</title>
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <BookOpen className="w-8 h-8 text-primary-600" />
              Content Library
            </h1>
            <p className="text-gray-600">
              Explore wellness resources and supportive content
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8 relative">
            <Search className="absolute left-3 top-10 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search content by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id
                      ? 'bg-primary-700 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Loading */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : displayContent.map((section) => (
            <div key={section.type}>
              {section.type === 'recommended' && section.items.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="w-6 h-6 text-amber-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                      Recommended For You
                    </h2>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {section.items.map((content) => (
                      <ContentCard key={content._id} content={content} />
                    ))}
                  </div>
                </div>
              )}

              {section.type === 'all' && section.items.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    All Content
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((content) => (
                      <ContentCard key={content._id} content={content} />
                    ))}
                  </div>
                </div>
              )}

              {section.type === 'search' && section.items.length === 0 && (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    No Content Found
                  </h2>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    {searchQuery.trim()
                      ? `We couldn't find anything matching "${searchQuery}". Try a different search term.`
                      : 'No content available in this category yet.'}
                  </p>
                </div>
              )}

              {section.type === 'search' && section.items.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Search Results ({section.items.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {section.items.map((content) => (
                      <ContentCard key={content._id} content={content} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ContentLibraryPage;
