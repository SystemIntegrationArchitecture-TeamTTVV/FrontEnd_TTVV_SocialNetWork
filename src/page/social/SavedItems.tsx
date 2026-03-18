import { useState } from 'react';
import { Search, Bookmark, Image, Video, Link as LinkIcon, FileText } from 'lucide-react';

export default function SavedItems() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const savedItems = [
    {
      id: 1,
      type: 'post',
      title: 'Bài viết về công nghệ',
      content: 'Những xu hướng công nghệ mới nhất trong năm 2024...',
      author: { name: 'Nguyễn Văn A', avatar: 'NA', color: '#1877F2' },
      savedAt: '2 ngày trước',
      image: '🖥️',
    },
    {
      id: 2,
      type: 'link',
      title: 'Hướng dẫn React Hooks',
      url: 'https://react.dev',
      author: { name: 'Trần Thị B', avatar: 'TB', color: '#42B72A' },
      savedAt: '5 ngày trước',
    },
    {
      id: 3,
      type: 'video',
      title: 'Video về Design System',
      thumbnail: '🎬',
      author: { name: 'Lê Văn C', avatar: 'LC', color: '#FF6B6B' },
      savedAt: '1 tuần trước',
    },
    {
      id: 4,
      type: 'image',
      title: 'Ảnh phong cảnh đẹp',
      image: '🏞️',
      author: { name: 'Phạm Thị D', avatar: 'PD', color: '#4ECDC4' },
      savedAt: '2 tuần trước',
    },
  ];

  const filteredItems = savedItems.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return Image;
      case 'video':
        return Video;
      case 'link':
        return LinkIcon;
      case 'post':
        return FileText;
      default:
        return Bookmark;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mục đã lưu</h1>
        <p className="text-lg text-gray-600">Xem lại các bài viết, liên kết và nội dung bạn đã lưu</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mục đã lưu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {[
            { id: 'all', label: 'Tất cả', icon: Bookmark },
            { id: 'post', label: 'Bài viết', icon: FileText },
            { id: 'link', label: 'Liên kết', icon: LinkIcon },
            { id: 'image', label: 'Ảnh', icon: Image },
            { id: 'video', label: 'Video', icon: Video },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-base transition-all ${
                  activeFilter === filter.id
                    ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const TypeIcon = getTypeIcon(item.type);
          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail/Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <span className="text-4xl">{item.image}</span>
                  ) : item.thumbnail ? (
                    <span className="text-4xl">{item.thumbnail}</span>
                  ) : (
                    <TypeIcon className="w-10 h-10 text-gray-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-1">{item.title}</h3>
                      {item.content && (
                        <p className="text-base text-gray-600 mb-3 line-clamp-2">{item.content}</p>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline font-medium"
                        >
                          {item.url}
                        </a>
                      )}
                    </div>
                    <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 ml-4">
                      <Bookmark className="w-5 h-5 text-blue-600 fill-current" />
                    </button>
                  </div>

                  {/* Author and Date */}
                  <div className="flex items-center gap-3 mt-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: item.author.color }}
                    >
                      {item.author.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.author.name}</p>
                      <p className="text-sm text-gray-500">{item.savedAt}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Bookmark className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không có mục đã lưu</h3>
          <p className="text-base text-gray-600">Bạn chưa lưu bất kỳ nội dung nào</p>
        </div>
      )}
    </div>
  );
}
