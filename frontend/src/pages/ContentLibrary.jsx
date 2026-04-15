import { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ContentLibrary = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [userMoodCategory, setUserMoodCategory] = useState(null);

  const categories = ['all', 'Mental Health', 'Anxiety', 'Depression', 'Sleep', 'Stress'];
  const types = ['all', 'Article', 'Video', 'Podcast', 'Guide'];

  // Map user mood to content category
  useEffect(() => {
    if (user?.recentMood) {
      const moodMap = {
        'Positive': 'Mental Health',
        'Stable': 'Mental Health',
        'Pressure': 'Stress',
        'Low': 'Depression',
        'Anxious': 'Anxiety',
        'Stressed': 'Stress',
      };
      setUserMoodCategory(moodMap[user.recentMood] || null);
    }
  }, [user?.recentMood]);

  const contentData = [
    {
      id: 1,
      title: 'Understanding Anxiety: A Comprehensive Guide',
      description: 'Learn the triggers, symptoms, and management techniques for anxiety disorders.',
      category: 'Anxiety',
      type: 'Article',
      duration: '15 min read',
      image: 'https://images.pexels.com/photos/3807509/pexels-photo-3807509.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.verywellmind.com/how-to-cope-with-anxiety-3024335',
      featured: true,
    },
    {
      id: 2,
      title: 'Meditation for Beginners - Complete Tutorial',
      description: 'Start your meditation journey with this beginner-friendly 10-minute guided meditation.',
      category: 'Mental Health',
      type: 'Video',
      duration: '10 min',
      image: 'https://images.pexels.com/photos/3769747/pexels-photo-3769747.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.youtube.com/watch?v=inpok4MKVLM',
      featured: true,
    },
    {
      id: 3,
      title: 'Sleep Better Tonight: Science-Based Tips',
      description: 'Discover proven strategies to improve your sleep quality and wake up refreshed.',
      category: 'Sleep',
      type: 'Article',
      duration: '12 min read',
      image: 'https://images.pexels.com/photos/4550745/pexels-photo-4550745.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.sleepfoundation.org/sleep-tips',
      featured: false,
    },
    {
      id: 4,
      title: 'Stress Management in the Workplace',
      description: 'Expert tips and techniques for managing work-related stress effectively.',
      category: 'Stress',
      type: 'Article',
      duration: '14 min read',
      image: 'https://images.pexels.com/photos/3862632/pexels-photo-3862632.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.apa.org/topics/healthy-workplaces/work-stress?utm_source=chatgpt.com',
      featured: false,
    },
    {
      id: 5,
      title: 'Overcoming Depression: A Practical Guide',
      description: 'Comprehensive strategies to understand and manage depression symptoms.',
      category: 'Depression',
      type: 'Guide',
      duration: '20 min read',
      image: 'https://images.pexels.com/photos/3807626/pexels-photo-3807626.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.psychologytoday.com/us/basics/depression',
      featured: false,
    },
    {
      id: 6,
      title: '4-7-8 Breathing Exercise for Anxiety',
      description: 'Learn the powerful 4-7-8 breathing technique to reduce anxiety and racing thoughts quickly.',
      category: 'Anxiety',
      type: 'Video',
      duration: '5 min',
      image: 'https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://youtu.be/LiUnFJ8P4gM?si=NLYPrVtTjBzGDeQW',
      featured: true,
    },
    {
      id: 7,
      title: 'Depression Therapy Techniques',
      description: 'Evidence-based therapy approaches for treating and managing depression.',
      category: 'Depression',
      type: 'Guide',
      duration: '18 min read',
      image: 'https://images.pexels.com/photos/3957993/pexels-photo-3957993.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.psychologytoday.com/us/therapy-types/cognitive-behavioral-therapy',
      featured: true,
    },
    {
      id: 8,
      title: 'Deep Sleep: A Comprehensive Guide',
      description: 'Everything you need to know about achieving deep, restorative sleep.',
      category: 'Sleep',
      type: 'Article',
      duration: '16 min read',
      image: 'https://images.pexels.com/photos/3807512/pexels-photo-3807512.jpeg?w=400&h=250&fit=crop',
      external_link: 'https://www.healthline.com/health/deep-sleep',
      featured: false,
    }
  ];

  const filteredContent = contentData.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesType = selectedType === 'all' || item.type === selectedType;

    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
          <p className="text-gray-600 mt-2">
            Explore expert-curated resources for your mental wellness journey
          </p>
        </div>

        {/* Featured Resources Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">✨ Featured Resources</h2>
          {userMoodCategory && (
            <p className="text-sm text-gray-600 mb-6">
              Based on your current mood: <span className="font-semibold text-primary-600">{user?.recentMood}</span> - Here are resources to help you
            </p>
          )}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {(userMoodCategory
              ? contentData.filter(
                  (item) =>
                    item.category === userMoodCategory ||
                    (item.featured && item.category === 'Mental Health')
                )
              : contentData.filter((item) => item.featured)
            ).map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow overflow-hidden border-2 border-primary-100"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x250?text=' + encodeURIComponent(item.title);
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                    FEATURED
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{item.type}</span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold">{item.duration}</span>
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-white bg-primary-600 hover:bg-primary-700 font-medium text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Open
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="mb-8 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles, videos, guides..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filters</span>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full transition-all ${
                    selectedType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">More Resources</h2>
          <p className="text-sm text-gray-600">
            Showing {filteredContent.length} of {contentData.length} resources
          </p>
        </div>

        {/* Content Grid */}
        {filteredContent.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 overflow-hidden relative">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x250?text=' + encodeURIComponent(item.title);
                    }}
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500">{item.type}</span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500 font-semibold">{item.duration}</span>
                    <a
                      href={item.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        if (!item.external_link || item.external_link === '#') {
                          e.preventDefault();
                          alert('This resource link will be available soon!');
                        }
                      }}
                      className="inline-flex items-center gap-2 text-white bg-primary-600 hover:bg-primary-700 font-semibold text-sm px-3 py-1 rounded transition-colors"
                    >
                      Open
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No resources found matching your filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedType('all');
              }}
              className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentLibrary;
