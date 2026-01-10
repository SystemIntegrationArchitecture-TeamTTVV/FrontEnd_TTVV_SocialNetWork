import { Users, CheckCircle2, FileText, AlertCircle, TrendingUp, Plus, Bell, BarChart3, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    {
      icon: Users,
      label: 'Tổng người dùng',
      value: '124,583',
      change: '+12.5%',
      changeType: 'positive',
      color: '#E7F3FF',
    },
    {
      icon: CheckCircle2,
      label: 'Đang hoạt động',
      value: '45,892',
      change: '+8.2%',
      changeType: 'positive',
      color: '#D4EDDA',
    },
    {
      icon: FileText,
      label: 'Tổng bài viết',
      value: '892,456',
      change: '+15.3%',
      changeType: 'positive',
      color: '#FFF3CD',
    },
    {
      icon: AlertCircle,
      label: 'Báo cáo chờ xử lý',
      value: '28',
      change: 'Cần xem xét ngay',
      changeType: 'warning',
      color: '#FFE4E4',
    },
  ];

  const activities = [
    { type: 'user', message: 'Người dùng mới đăng ký', detail: 'john.doe@example.com', time: '2 phút trước', icon: Users, color: '#E7F3FF' },
    { type: 'report', message: 'Báo cáo nội dung vi phạm', detail: 'Bài viết #8923', time: '5 phút trước', icon: AlertCircle, color: '#FFE4E4' },
    { type: 'success', message: 'Đã xử lý báo cáo', detail: 'Admin đã xóa bài viết', time: '10 phút trước', icon: CheckCircle2, color: '#D4EDDA' },
    { type: 'post', message: 'Bài viết mới được đăng', detail: 'sarah.j đã đăng ảnh', time: '15 phút trước', icon: FileText, color: '#FFF3CD' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Tổng quan Dashboard</h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: stat.color }}
                    >
                      <Icon className="w-8 h-8 text-gray-900" />
                    </div>
                  </div>
                  <p className="text-base text-gray-600 mb-3 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold text-gray-900 mb-3">{stat.value}</p>
                  <p
                    className={`text-base font-semibold ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'warning'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {stat.changeType === 'positive' && '↑ '}
                    {stat.change}
                    {stat.changeType === 'positive' && ' so với tháng trước'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Tăng trưởng người dùng</h3>
                <button className="px-5 py-2.5 rounded-xl bg-gray-100 text-base text-gray-700 hover:bg-gray-200 transition-colors font-semibold">
                  7 ngày ▼
                </button>
              </div>
              <div className="h-[280px] flex items-end justify-between gap-3">
                {[60, 65, 70, 75, 80, 85, 95].map((height, index) => (
                  <div
                    key={index}
                    className="flex-1 rounded-t-xl hover:opacity-80 transition-opacity"
                    style={{
                      height: `${height}%`,
                      backgroundColor: index >= 4 ? '#1877F2' : index >= 2 ? '#1877F2' : '#E7F3FF',
                    }}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between mt-4 text-base text-gray-600 font-medium">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                  <span key={day}>{day}</span>
                ))}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Hoạt động gần đây</h3>
              <div className="space-y-5">
                {activities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: activity.color }}
                      >
                        <Icon className="w-6 h-6 text-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-gray-900 mb-1">{activity.message}</p>
                        <p className="text-sm text-gray-600">
                          {activity.detail} · {activity.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button className="w-full mt-6 text-center text-base text-blue-600 hover:underline font-semibold">
                Xem tất cả hoạt động →
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Hành động nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: Plus, label: 'Thêm quản trị viên', desc: 'Cấp quyền admin mới', color: '#E7F3FF' },
                { icon: Bell, label: 'Gửi thông báo', desc: 'Thông báo hệ thống', color: '#E7F3FF' },
                { icon: BarChart3, label: 'Xuất báo cáo', desc: 'Tải xuống thống kê', color: '#E7F3FF' },
                { icon: Settings, label: 'Bảo trì hệ thống', desc: 'Cài đặt và cập nhật', color: '#E7F3FF' },
              ].map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="p-8 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all text-center hover:shadow-md"
                  >
                    <div
                      className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center"
                      style={{ backgroundColor: action.color }}
                    >
                      <Icon className="w-10 h-10 text-gray-900" />
                    </div>
                    <p className="font-bold text-lg text-gray-900 mb-2">{action.label}</p>
                    <p className="text-sm text-gray-600">{action.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
    </div>
  );
}

