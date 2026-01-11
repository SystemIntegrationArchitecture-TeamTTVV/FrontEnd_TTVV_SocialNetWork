import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Calendar, FileText, Heart, MessageCircle, UserPlus, Share2, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

export default function ActivityLog() {
  const [activeFilter, setActiveFilter] = useState('all');

  const activities = [
    {
      id: 1,
      type: 'post',
      icon: FileText,
      color: '#1877F2',
      title: 'Đã đăng một bài viết',
      description: 'Bài viết về chuyến du lịch Đà Lạt',
      time: '2 giờ trước',
    },
    {
      id: 2,
      type: 'like',
      icon: Heart,
      color: '#FF6B6B',
      title: 'Đã thích một bài viết',
      description: 'Bài viết của Nguyễn Văn B',
      time: '5 giờ trước',
    },
    {
      id: 3,
      type: 'comment',
      icon: MessageCircle,
      color: '#42B72A',
      title: 'Đã bình luận',
      description: 'Trên bài viết của Trần Thị C',
      time: '1 ngày trước',
    },
    {
      id: 4,
      type: 'friend',
      icon: UserPlus,
      color: '#4ECDC4',
      title: 'Đã kết bạn',
      description: 'Với Lê Văn D',
      time: '2 ngày trước',
    },
    {
      id: 5,
      type: 'share',
      icon: Share2,
      color: '#9B59B6',
      title: 'Đã chia sẻ',
      description: 'Một bài viết từ Nhóm Công nghệ',
      time: '3 ngày trước',
    },
    {
      id: 6,
      type: 'photo',
      icon: ImageIcon,
      color: '#F59E0B',
      title: 'Đã thêm ảnh',
      description: '5 ảnh vào album Du lịch',
      time: '5 ngày trước',
    },
  ];

  const filters = [
    { id: 'all', label: 'Tất cả' },
    { id: 'post', label: 'Bài viết' },
    { id: 'like', label: 'Lượt thích' },
    { id: 'comment', label: 'Bình luận' },
    { id: 'friend', label: 'Bạn bè' },
    { id: 'share', label: 'Chia sẻ' },
  ];

  const filteredActivities =
    activeFilter === 'all'
      ? activities
      : activities.filter((activity) => activity.type === activeFilter);

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/profile/1"
          className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nhật ký hoạt động</h1>
          <p className="text-base text-gray-600 mt-1">Xem lại tất cả hoạt động của bạn</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-base transition-all ${
                activeFilter === filter.id
                  ? 'bg-blue-50 text-blue-600 border-2 border-blue-500'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-4">
        {filteredActivities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={activity.id}
              className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activity.color + '20' }}
                >
                  <Icon className="w-7 h-7" style={{ color: activity.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-lg text-gray-900 mb-1">{activity.title}</p>
                      <p className="text-base text-gray-600">{activity.description}</p>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0 ml-4">{activity.time}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredActivities.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không có hoạt động</h3>
          <p className="text-base text-gray-600">Không có hoạt động nào phù hợp với bộ lọc đã chọn</p>
        </div>
      )}
    </div>
  );
}
