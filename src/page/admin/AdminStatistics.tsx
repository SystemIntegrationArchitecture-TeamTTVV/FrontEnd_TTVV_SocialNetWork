import { TrendingUp, Users, FileText, MessageSquare, Eye, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function AdminStatistics() {
  const [timeRange, setTimeRange] = useState('7days');

  const overviewStats = [
    { label: 'Tổng lượt xem', value: '12.5M', change: '+15.3%', icon: Eye, color: '#3B82F6' },
    { label: 'Người dùng mới', value: '8,234', change: '+8.7%', icon: Users, color: '#10B981' },
    { label: 'Bài viết mới', value: '45,678', change: '+22.1%', icon: FileText, color: '#F59E0B' },
    { label: 'Tin nhắn', value: '234,567', change: '+12.4%', icon: MessageSquare, color: '#EF4444' },
  ];

  const topPosts = [
    { id: 1, author: 'Nguyễn Văn A', content: 'Bài viết viral về du lịch...', views: 125000, likes: 8500 },
    { id: 2, author: 'Trần Thị B', content: 'Chia sẻ kinh nghiệm làm việc...', views: 98000, likes: 6200 },
    { id: 3, author: 'Lê Văn C', content: 'Review sản phẩm mới...', views: 76000, likes: 4800 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thống kê và phân tích</h1>
          <p className="text-lg text-gray-600">Xem các chỉ số và xu hướng của hệ thống</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="h-14 px-6 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold cursor-pointer shadow-sm"
        >
          <option value="7days">7 ngày qua</option>
          <option value="30days">30 ngày qua</option>
          <option value="90days">90 ngày qua</option>
          <option value="1year">1 năm qua</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon className="w-7 h-7" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-base text-gray-600 mb-2 font-medium">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-base font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-5 h-5" />
                {stat.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Tăng trưởng người dùng</h3>
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 48, 58, 65, 72, 80, 85, 78, 88, 92, 95].map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-xl hover:opacity-80 transition-opacity"
                style={{
                  height: `${height}%`,
                  backgroundColor: index >= 8 ? '#1877F2' : index >= 4 ? '#42B72A' : '#E7F3FF',
                }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-600 font-medium">
            {['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Mức độ tương tác</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-700">Likes</span>
                <span className="text-base font-bold text-gray-900">85%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-700">Comments</span>
                <span className="text-base font-bold text-gray-900">62%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-700">Shares</span>
                <span className="text-base font-bold text-gray-900">38%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-base font-semibold text-gray-700">Views</span>
                <span className="text-base font-bold text-gray-900">92%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '92%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Bài viết phổ biến nhất</h3>
        <div className="space-y-4">
          {topPosts.map((post, index) => (
            <div key={post.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900 mb-1">{post.author}</p>
                <p className="text-base text-gray-600">{post.content}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">{post.views.toLocaleString()}</p>
                <p className="text-sm text-gray-500">lượt xem</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">{post.likes.toLocaleString()}</p>
                <p className="text-sm text-gray-500">likes</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
