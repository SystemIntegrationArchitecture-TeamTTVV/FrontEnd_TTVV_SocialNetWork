import { useState, useEffect } from 'react';
import { Search, Ban, CheckCircle2, XCircle, Eye, Trash2, Loader2, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usersApi, type User } from '../../apis/users';

export default function AdminUserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersApi.getAllUsers();
      setUsers(data);
      console.log('✅ Loaded users:', data.length);
    } catch (err: any) {
      console.error('❌ Failed to load users:', err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    if (!window.confirm(`Bạn có chắc muốn ${currentStatus === 'ACTIVE' ? 'khóa' : 'mở khóa'} tài khoản này?`)) {
      return;
    }

    try {
      setIsUpdating(userId);
      const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
      await usersApi.updateUserStatus(userId, newStatus);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      ));
      
      console.log('✅ User status updated');
    } catch (error) {
      console.error('❌ Failed to update user status:', error);
      alert('Không thể cập nhật trạng thái người dùng');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleUserRole = async (userId: string, currentRole: string) => {
    if (!window.confirm(`Bạn có chắc muốn thay đổi vai trò người dùng này?`)) {
      return;
    }

    try {
      setIsUpdating(userId);
      const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
      await usersApi.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      console.log('✅ User role updated');
    } catch (error) {
      console.error('❌ Failed to update user role:', error);
      alert('Không thể cập nhật vai trò người dùng');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${userName}"? Hành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      setIsUpdating(userId);
      await usersApi.deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      console.log('✅ User deleted');
    } catch (error) {
      console.error('❌ Failed to delete user:', error);
      alert('Không thể xóa người dùng');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && user.status === 'ACTIVE') ||
      (filterStatus === 'banned' && user.status === 'BANNED');
    
    const matchesRole = filterRole === 'all' || 
      (filterRole === 'admin' && user.role === 'ADMIN') ||
      (filterRole === 'user' && user.role === 'USER') ||
      (filterRole === 'moderator' && user.role === 'MODERATOR');
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'MODERATOR': return 'Kiểm duyệt viên';
      default: return 'Người dùng';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return 'Hoạt động';
      case 'BANNED': return 'Đã khóa';
      case 'DELETED': return 'Đã xóa';
      default: return 'Không xác định';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý người dùng</h1>
          <p className="text-lg text-gray-600">
            Tổng số: <span className="font-semibold">{filteredUsers.length}</span> người dùng
          </p>
        </div>
        <button 
          onClick={loadUsers}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Tải lại
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc username..."
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
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium cursor-pointer"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="moderator">Kiểm duyệt viên</option>
              <option value="user">Người dùng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-gray-600 text-lg">Đang tải danh sách người dùng...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Người dùng</th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Trạng thái</th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Ngày tham gia</th>
                  <th className="px-6 py-4 text-left text-base font-bold text-gray-900">Vai trò</th>
                  <th className="px-6 py-4 text-center text-base font-bold text-gray-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Không tìm thấy người dùng nào
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.fullName}
                              className="w-14 h-14 rounded-full object-cover shadow-sm"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm bg-blue-500">
                              {getInitials(user.fullName)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-lg text-gray-900">{user.fullName || 'N/A'}</p>
                            <p className="text-sm text-gray-500">@{user.username || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-base text-gray-700">{user.email || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-base ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : user.status === 'BANNED'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-50 text-gray-700'
                          }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <XCircle className="w-5 h-5" />
                          )}
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-base text-gray-700">{formatDate(user.createdAt)}</p>
                      </td>
                      <td className="px-6 py-5">
                        <button
                          onClick={() => handleToggleUserRole(user.id!, user.role!)}
                          disabled={isUpdating === user.id}
                          className={`inline-flex items-center px-4 py-2 rounded-xl font-semibold text-base transition-colors ${
                            user.role === 'ADMIN'
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : user.role === 'MODERATOR'
                              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {getRoleLabel(user.role)}
                        </button>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            to={`/admin/users/${user.id}`}
                            title="Xem chi tiết"
                            className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleToggleUserStatus(user.id!, user.status!)}
                            disabled={isUpdating === user.id}
                            title={user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 ${
                              user.status === 'ACTIVE'
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            {isUpdating === user.id ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Ban className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id!, user.fullName!)}
                            disabled={isUpdating === user.id}
                            title="Xóa"
                            className="w-10 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-between">
              <p className="text-base text-gray-600">
                Hiển thị <span className="font-semibold">{startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)}</span> trong tổng số{' '}
                <span className="font-semibold">{filteredUsers.length}</span> người dùng
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-5 py-2 rounded-xl font-semibold transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-500">...</span>}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
