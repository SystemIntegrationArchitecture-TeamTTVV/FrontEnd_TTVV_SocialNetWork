import { useState } from 'react';
import { Search, Plus, Users, Heart, Share2, MapPin, Globe, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('liked');

  const pages = [
    {
      id: 1,
      name: 'Tech News Vietnam',
      category: 'Công nghệ',
      avatar: 'TN',
      color: '#1877F2',
      cover: '🖥️',
      likes: 125000,
      followers: 98000,
      location: 'Hà Nội, Việt Nam',
      description: 'Tin tức công nghệ mới nhất tại Việt Nam',
      verified: true,
    },
    {
      id: 2,
      name: 'Fashion Hub',
      category: 'Thời trang',
      avatar: 'FH',
      color: '#FF6B6B',
      cover: '👗',
      likes: 89000,
      followers: 76000,
      location: 'TP.HCM, Việt Nam',
      description: 'Xu hướng thời trang mới nhất',
      verified: false,
    },
    {
      id: 3,
      name: 'Food & Travel',
      category: 'Ẩm thực & Du lịch',
      avatar: 'FT',
      color: '#42B72A',
      cover: '🍜',
      likes: 145000,
      followers: 120000,
      location: 'Đà Nẵng, Việt Nam',
      description: 'Khám phá ẩm thực và du lịch Việt Nam',
      verified: true,
    },
    {
      id: 4,
      name: 'Music Lovers',
      category: 'Âm nhạc',
      avatar: 'ML',
      color: '#9B59B6',
      cover: '🎵',
      likes: 67000,
      followers: 55000,
      location: 'Hà Nội, Việt Nam',
      description: 'Chia sẻ âm nhạc yêu thích',
      verified: false,
    },
  ];

  const filteredPages = pages.filter((page) =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pages</h1>
          <p className="text-lg text-gray-600">Khám phá và theo dõi các trang yêu thích</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tạo trang
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 mb-6 flex gap-1.5 border border-gray-200">
        <button
          onClick={() => setActiveTab('liked')}
          className={`flex-1 h-12 rounded-xl font-medium text-base transition-all duration-200 ${
            activeTab === 'liked'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Đã thích
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 h-12 rounded-xl font-medium text-base transition-all duration-200 ${
            activeTab === 'discover'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Khám phá
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm Pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
          />
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPages.map((page) => (
          <div key={page.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all">
            {/* Cover */}
            <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-8xl">
              {page.cover}
            </div>

            {/* Content */}
            <div className="p-6 -mt-16 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-white"
                    style={{ backgroundColor: page.color }}
                  >
                    {page.avatar}
                  </div>
                  {page.verified && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-4 border-white">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
                <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors">
                  Theo dõi
                </button>
              </div>

              <div>
                <h3 className="font-bold text-2xl text-gray-900 mb-2">{page.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg font-medium">{page.category}</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {page.location}
                  </div>
                </div>
                <p className="text-base text-gray-700 mb-4">{page.description}</p>

                <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-gray-900">{page.likes.toLocaleString()}</span>
                    <span className="text-sm text-gray-600">likes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold text-gray-900">{page.followers.toLocaleString()}</span>
                    <span className="text-sm text-gray-600">followers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy Pages</h3>
          <p className="text-base text-gray-600">Thử tìm kiếm với từ khóa khác</p>
        </div>
      )}
    </div>
  );
}
