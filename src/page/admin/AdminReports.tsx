import { useState } from 'react';
import { Search, Filter, Eye, CheckCircle2, XCircle, Flag } from 'lucide-react';

export default function AdminReports() {
  const [filterStatus, setFilterStatus] = useState('pending');

  const reports = [
    {
      id: 1,
      type: 'Nội dung vi phạm',
      reason: 'Nội dung không phù hợp, spam',
      reporter: { name: 'Nguyễn Văn X', avatar: 'NX', color: '#1877F2' },
      target: { type: 'post', id: 8923, author: 'Lê Văn C', content: 'Bài viết có nội dung vi phạm...' },
      status: 'pending',
      createdAt: '2 phút trước',
      priority: 'high',
    },
    {
      id: 2,
      type: 'Tài khoản giả mạo',
      reason: 'Tài khoản giả mạo người khác',
      reporter: { name: 'Trần Thị Y', avatar: 'TY', color: '#42B72A' },
      target: { type: 'user', id: 1234, author: 'User Fake', content: '' },
      status: 'pending',
      createdAt: '15 phút trước',
      priority: 'high',
    },
    {
      id: 3,
      type: 'Quấy rối',
      reason: 'Gửi tin nhắn quấy rối',
      reporter: { name: 'Phạm Văn Z', avatar: 'PZ', color: '#FF6B6B' },
      target: { type: 'message', id: 5678, author: 'User ABC', content: 'Tin nhắn quấy rối...' },
      status: 'resolved',
      createdAt: '1 giờ trước',
      priority: 'medium',
    },
    {
      id: 4,
      type: 'Spam',
      reason: 'Đăng quá nhiều bài viết spam',
      reporter: { name: 'Hoàng Thị M', avatar: 'HM', color: '#4ECDC4' },
      target: { type: 'post', id: 9123, author: 'Spam User', content: 'Bài viết spam...' },
      status: 'resolved',
      createdAt: '3 giờ trước',
      priority: 'low',
    },
  ];

  const filteredReports = reports.filter(
    (report) => filterStatus === 'all' || report.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý báo cáo</h1>
          <p className="text-lg text-gray-600">Xem xét và xử lý các báo cáo từ người dùng</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-red-50 rounded-xl">
            <p className="text-sm text-gray-600 font-medium">Chờ xử lý</p>
            <p className="text-2xl font-bold text-red-600">28</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm báo cáo..."
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="pending">Chờ xử lý</option>
              <option value="resolved">Đã xử lý</option>
              <option value="dismissed">Đã từ chối</option>
            </select>
            <button className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
              <Filter className="w-6 h-6" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-all border-l-4"
            style={{
              borderLeftColor:
                report.priority === 'high' ? '#EF4444' : report.priority === 'medium' ? '#F59E0B' : '#10B981',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center"
                  style={{ backgroundColor: report.reporter.color + '20' }}
                >
                  <Flag className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <p className="font-bold text-lg text-gray-900">{report.type}</p>
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        report.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : report.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {report.priority === 'high' ? 'Cao' : report.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>
                  </div>
                  <p className="text-base text-gray-600">{report.reason}</p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-xl font-semibold text-base ${
                  report.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700'
                    : report.status === 'resolved'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-gray-50 text-gray-700'
                }`}
              >
                {report.status === 'pending'
                  ? 'Chờ xử lý'
                  : report.status === 'resolved'
                  ? 'Đã xử lý'
                  : 'Đã từ chối'}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-sm font-semibold text-gray-700">Người báo cáo:</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: report.reporter.color }}
                  >
                    {report.reporter.avatar}
                  </div>
                  <span className="font-medium text-gray-900">{report.reporter.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-gray-700">Đối tượng:</p>
                <span className="text-base text-gray-900">
                  {report.target.type === 'post'
                    ? `Bài viết #${report.target.id}`
                    : report.target.type === 'user'
                    ? `Người dùng: ${report.target.author}`
                    : `Tin nhắn #${report.target.id}`}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">{report.createdAt}</p>
              <div className="flex items-center gap-2">
                <button
                  title="Xem chi tiết"
                  className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                {report.status === 'pending' && (
                  <>
                    <button
                      title="Chấp nhận và xử lý"
                      className="w-11 h-11 rounded-xl bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                    <button
                      title="Từ chối báo cáo"
                      className="w-11 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between">
        <p className="text-base text-gray-600">
          Hiển thị <span className="font-semibold">1-4</span> trong tổng số{' '}
          <span className="font-semibold">28</span> báo cáo chờ xử lý
        </p>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
            Trước
          </button>
          <button className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">1</button>
          <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}
