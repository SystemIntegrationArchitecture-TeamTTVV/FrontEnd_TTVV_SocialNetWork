import { useState } from 'react';
import { Search, Image, Video, FileText, Filter, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function SharedMedia() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const mediaItems = [
    {
      id: 1,
      type: 'image',
      thumbnail: '🖼️',
      name: 'photo-1.jpg',
      size: '2.5 MB',
      date: '2 ngày trước',
      sender: { name: 'Alex Chen', avatar: 'AC', color: '#1877F2' },
    },
    {
      id: 2,
      type: 'image',
      thumbnail: '📷',
      name: 'photo-2.jpg',
      size: '1.8 MB',
      date: '5 ngày trước',
      sender: { name: 'Maria Garcia', avatar: 'MG', color: '#42B72A' },
    },
    {
      id: 3,
      type: 'video',
      thumbnail: '🎬',
      name: 'video-1.mp4',
      size: '15.2 MB',
      date: '1 tuần trước',
      sender: { name: 'David Kim', avatar: 'DK', color: '#FF6B6B' },
    },
    {
      id: 4,
      type: 'file',
      thumbnail: '📄',
      name: 'document.pdf',
      size: '3.4 MB',
      date: '2 tuần trước',
      sender: { name: 'Lisa Wang', avatar: 'LW', color: '#4ECDC4' },
    },
    {
      id: 5,
      type: 'image',
      thumbnail: '🖼️',
      name: 'photo-3.jpg',
      size: '4.1 MB',
      date: '3 tuần trước',
      sender: { name: 'Tom Brown', avatar: 'TB', color: '#FFD93D' },
    },
  ];

  const filteredItems = mediaItems.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'file':
        return FileText;
      default:
        return FileText;
    }
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/messenger')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('messenger.sharedMedia.title')}</h1>
            <p className="text-sm text-gray-600">
              {t('messenger.sharedMedia.subtitle', { count: mediaItems.length })}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder={t('messenger.sharedMedia.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: 'all', label: t('messenger.sharedMedia.filters.all'), icon: Filter },
            { id: 'image', label: t('messenger.sharedMedia.filters.image'), icon: Image },
            { id: 'video', label: t('messenger.sharedMedia.filters.video'), icon: Video },
            { id: 'file', label: t('messenger.sharedMedia.filters.file'), icon: FileText },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base transition-all ${
                  activeFilter === filter.id
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all group cursor-pointer"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                  <span className="text-6xl">{item.thumbnail}</span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <button className="opacity-0 group-hover:opacity-100 w-12 h-12 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-all">
                      <Download className="w-6 h-6 text-gray-900" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{item.size}</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: item.sender.color }}
                    >
                      {item.sender.avatar}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{item.sender.name}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('messenger.sharedMedia.emptyTitle')}</h3>
            <p className="text-base text-gray-600">{t('messenger.sharedMedia.emptySubtitle')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
