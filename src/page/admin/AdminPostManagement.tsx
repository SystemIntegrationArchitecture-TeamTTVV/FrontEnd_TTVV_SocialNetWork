import { useState } from 'react';
import { Search, Filter, Eye, Edit, Trash2, Flag, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminPostManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const posts = [
    {
      id: 1,
      author: { name: 'Nguyễn Văn A', avatar: 'NA', color: '#1877F2' },
      content: 'Hôm nay thời tiết thật đẹp! 😊',
      image: '🏞️',
      likes: 1250,
      comments: 234,
      shares: 45,
      status: 'approved',
      createdAt: '15/01/2024 10:30',
      reports: 0,
    },
    {
      id: 2,
      author: { name: 'Trần Thị B', avatar: 'TB', color: '#42B72A' },
      content: 'Chia sẻ một khoảnh khắc đáng nhớ từ chuyến du lịch...',
      image: '',
      likes: 890,
      comments: 156,
      shares: 23,
      status: 'pending',
      createdAt: '16/01/2024 14:20',
      reports: 2,
    },
    {
      id: 3,
      author: { name: 'Lê Văn C', avatar: 'LC', color: '#FF6B6B' },
      content: 'Nội dung vi phạm cần được xem xét',
      image: '',
      likes: 0,
      comments: 0,
      shares: 0,
      status: 'reported',
      createdAt: '17/01/2024 09:15',
      reports: 15,
    },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || post.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý bài viết</h1>
          <p className="text-lg text-gray-600">Quản lý và kiểm duyệt tất cả bài viết</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="approved">Đã duyệt</option>
              <option value="pending">Chờ duyệt</option>
              <option value="reported">Bị báo cáo</option>
            </select>
            <button className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
              <Filter className="w-6 h-6" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: post.author.color }}
                >
                  {post.author.avatar}
                </div>
                <div>
                  <p className="font-bold text-lg text-gray-900">{post.author.name}</p>
                  <p className="text-sm text-gray-500">{post.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-4 py-2 rounded-xl font-semibold text-base ${
                    post.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : post.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {post.status === 'approved'
                    ? 'Đã duyệt'
                    : post.status === 'pending'
                    ? 'Chờ duyệt'
                    : 'Bị báo cáo'}
                </span>
                {post.reports > 0 && (
                  <span className="px-4 py-2 rounded-xl bg-red-100 text-red-700 font-semibold text-base flex items-center gap-2">
                    <Flag className="w-5 h-5" />
                    {post.reports} báo cáo
                  </span>
                )}
              </div>
            </div>

            <p className="text-base text-gray-900 mb-4 leading-relaxed">{post.content}</p>

            {post.image && (
              <div className="w-full h-64 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-8xl">{post.image}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-6 text-base text-gray-600">
                <span className="font-semibold">❤️ {post.likes}</span>
                <span className="font-semibold">💬 {post.comments}</span>
                <span className="font-semibold">📤 {post.shares}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  title="Xem chi tiết"
                  className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {post.status !== 'approved' && (
                  <button
                    title="Duyệt bài"
                    className="w-11 h-11 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  title="Xóa bài viết"
                  className="w-11 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
        <p className="text-base text-gray-600">
          Hiển thị <span className="font-semibold">1-3</span> trong tổng số{' '}
          <span className="font-semibold">892,456</span> bài viết
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
            Trước
          </button>
          <button className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">1</button>
          <button className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
            2
          </button>
          <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
