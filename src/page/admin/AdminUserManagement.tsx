import { useState } from 'react';
import { Search, Filter, MoreVertical, Ban, CheckCircle2, XCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const users = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@example.com',
      avatar: 'NA',
      color: '#1877F2',
      status: 'active',
      joinDate: '15/01/2024',
      posts: 125,
      role: 'user',
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@example.com',
      avatar: 'TB',
      color: '#42B72A',
      status: 'active',
      joinDate: '20/02/2024',
      posts: 89,
      role: 'user',
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@example.com',
      avatar: 'LC',
      color: '#FF6B6B',
      status: 'banned',
      joinDate: '10/03/2024',
      posts: 0,
      role: 'user',
    },
    {
      id: 4,
      name: 'Phạm Thị D',
      email: 'phamthid@example.com',
      avatar: 'PD',
      color: '#4ECDC4',
      status: 'active',
      joinDate: '05/04/2024',
      posts: 234,
      role: 'admin',
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
          <p className="text-lg text-gray-600">Quản lý tất cả người dùng trong hệ thống</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm">
          + Thêm người dùng
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc email..."
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
              <option value="active">Đang hoạt động</option>
              <option value="banned">Đã khóa</option>
            </select>
            <button className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
              <Filter className="w-6 h-6" />
              Bộ lọc
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Người dùng</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Email</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Trạng thái</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Ngày tham gia</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Bài viết</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Vai trò</th>
                <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">ID: #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-base text-gray-700">{user.email}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-base ${
                        user.status === 'active'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      {user.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-base text-gray-700">{user.joinDate}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-base font-semibold text-gray-900">{user.posts}</p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-base ${
                        user.role === 'admin'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        title="Xem chi tiết"
                        className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        title="Chỉnh sửa"
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          user.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                      <button
                        title="Xóa"
                        className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-between">
          <p className="text-base text-gray-600">
            Hiển thị <span className="font-semibold">1-4</span> trong tổng số{' '}
            <span className="font-semibold">124,583</span> người dùng
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
              Trước
            </button>
            <button className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">1</button>
            <button className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
              2
            </button>
            <button className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
              3
            </button>
            <button className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
