import { useNavigate } from 'react-router-dom';
import { Search, Settings, Play, Video, Bookmark, Compass, ChevronRight, Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Save, Flag, EyeOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function WatchVideo() {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Mock video data
  const featuredVideos = [
    {
      id: 1,
      title: 'Video mới của Marvel Studios và những người khác.',
      thumbnail: '🎬',
      author: { name: 'Marvel Studios', avatar: 'MS', verified: true },
      time: '19 phút trước',
    },
    {
      id: 2,
      title: 'Trinh Diễn và những người khác đã chia sẻ video.',
      thumbnail: '📺',
      author: { name: 'Trinh Diễn', avatar: 'TD' },
      time: '1 ngày trước',
    },
  ];

  const videoFeed = [
    {
      id: 3,
      author: { name: 'BiliBili Philippines', avatar: 'BP', verified: true },
      time: 'Hôm qua lúc 14:00',
      description: "Yuji's big bro 🤣...",
      thumbnail: '🎭',
      views: '2.5M',
      likes: '125K',
      comments: '3.2K',
    },
    {
      id: 4,
      author: { name: 'Tech Review', avatar: 'TR', verified: false },
      time: '2 ngày trước',
      description: 'Đánh giá chi tiết iPhone 15 Pro Max',
      thumbnail: '📱',
      views: '1.8M',
      likes: '89K',
      comments: '2.1K',
    },
    {
      id: 5,
      author: { name: 'Cooking Master', avatar: 'CM', verified: true },
      time: '3 ngày trước',
      description: 'Cách làm món phở bò chính gốc Hà Nội',
      thumbnail: '🍜',
      views: '950K',
      likes: '45K',
      comments: '1.5K',
    },
  ];

  const sidebarItems = [
    { icon: Video, label: 'Trang chủ' },
    { icon: Play, label: 'Trực tiếp' },
    { icon: Video, label: 'Reels' },
    { icon: Compass, label: 'Khám phá' },
    { icon: Bookmark, label: 'Video đã lưu' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.entries(menuRefs.current).forEach(([videoId, ref]) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      });
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-gray-900">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold text-gray-900">Video</h1>
            <button className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
              <Settings className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm kiếm video"
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Featured Section */}
        <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-semibold text-gray-900">Video mới dành cho bạn</h2>
                <button className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[15px] font-medium">
                  Xem tất cả
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {featuredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                  >
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-6xl relative group">
                      {video.thumbnail}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-8 h-8 ml-1 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start gap-2 mb-1">
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {video.author.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] font-semibold text-gray-900">{video.author.name}</span>
                            {video.author.verified && (
                              <Globe className="w-3 h-3 text-blue-500" />
                            )}
                          </div>
                          <span className="text-[12px] text-gray-500">{video.time}</span>
                        </div>
                      </div>
                      <p className="text-[15px] line-clamp-2 text-gray-800 mt-1">{video.title}</p>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* Video Feed */}
        <div className="space-y-4">
              {videoFeed.map((video) => (
                <div key={video.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold text-white">
                        {video.author.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{video.author.name}</span>
                          {video.author.verified && (
                            <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                              <Globe className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>{video.time}</span>
                          <span>•</span>
                          <Globe className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                    <div className="relative" ref={(el) => (menuRefs.current[video.id] = el)}>
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === video.id ? null : video.id)}
                        className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                      >
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                      </button>
                      
                      {openMenuId === video.id && (
                        <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
                          <button
                            onClick={() => { console.log('Save video', video.id); setOpenMenuId(null); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            <span>Lưu video</span>
                          </button>
                          <button
                            onClick={() => { console.log('Hide video', video.id); setOpenMenuId(null); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <EyeOff className="w-4 h-4" />
                            <span>Ẩn video</span>
                          </button>
                          <div className="border-t border-gray-200 my-1"></div>
                          <button
                            onClick={() => { console.log('Report video', video.id); setOpenMenuId(null); }}
                            className="w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Flag className="w-4 h-4" />
                            <span>Báo cáo</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="px-4 pb-3">
                    <p className="text-[15px] text-gray-900">
                      {video.description}{' '}
                      <button className="text-gray-600 hover:text-gray-800 font-medium">Xem thêm</button>
                    </p>
                  </div>

                  {/* Video Player */}
                  <div className="relative aspect-video bg-black group cursor-pointer">
                    <div className="absolute inset-0 flex items-center justify-center text-8xl">
                      {video.thumbnail}
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="w-10 h-10 ml-1 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-sm font-semibold text-white">
                      {video.views} lượt xem
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2 flex items-center justify-around border-t border-gray-200">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <ThumbsUp className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">{video.likes}</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">{video.comments}</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                      <Share2 className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-semibold text-gray-700">Chia sẻ</span>
                    </button>
                  </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
