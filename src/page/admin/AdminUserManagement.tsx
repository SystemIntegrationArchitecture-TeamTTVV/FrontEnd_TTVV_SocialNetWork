import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, CheckCircle2, XCircle, Eye, Trash2, Loader2, Lock, Unlock, RefreshCcw, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usersApi, type User } from '../../apis/users';
import { reportsApi } from '../../apis/reports';
import { getLocaleTag } from '../../i18n';

export default function AdminUserManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const filterRole = 'all';
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'createdAt' | 'reportCount'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const itemsPerPage = 10;

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [usersData, reportsData] = await Promise.all([
        usersApi.getAllUsers(),
        reportsApi.getAllReports().catch(() => [])
      ]);

      const reportCounts: Record<string, number> = {};
      if (Array.isArray(reportsData)) {
        reportsData.forEach(r => {
          if (((r.targetType as string) === 'USER' || r.targetType === 'user') && r.targetId) {
            reportCounts[r.targetId] = (reportCounts[r.targetId] || 0) + 1;
          }
        });
      }

      if (Array.isArray(usersData)) {
        const mappedData = usersData.map((u: User) => ({
          ...u,
          status: u.isActive ? 'ACTIVE' : 'BANNED',
          name: u.fullName || u.username,
          reportCount: reportCounts[u.id!] || 0,
        }));
        setUsers(mappedData);
      } else {
        setUsers([]);
      }
      console.log('✅ Loaded users:', Array.isArray(usersData) ? usersData.length : 0);
    } catch (err: any) {
      console.error('❌ Failed to load users:', err);
      setError(t('adminPanel.users.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    if (
      !window.confirm(
        currentStatus === 'ACTIVE' ? t('adminPanel.users.confirmBan') : t('adminPanel.users.confirmUnban'),
      )
    ) {
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
      alert(t('adminPanel.users.updateStatusError'));
    } finally {
      setIsUpdating(null);
    }
  };
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(t('adminPanel.users.confirmDelete', { name: userName }))) {
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
      alert(t('adminPanel.users.deleteError'));
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
      (filterRole === 'user' && user.role === 'USER');

    return matchesSearch && matchesStatus && matchesRole;
  }).sort((a, b) => {
    let comparison = 0;
    if (sortField === 'reportCount') {
      comparison = (a.reportCount || 0) - (b.reportCount || 0);
    } else if (sortField === 'createdAt') {
      comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'createdAt' | 'reportCount') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

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
      case 'ADMIN': return t('adminPanel.users.roleAdmin');
      case 'MODERATOR': return t('adminPanel.users.roleModerator');
      default: return t('adminPanel.users.roleUser');
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return t('adminPanel.users.statusActive');
      case 'BANNED': return t('adminPanel.users.statusBanned');
      case 'DELETED': return t('adminPanel.users.statusDeleted');
      default: return t('adminPanel.users.statusUnknown');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return t('common.notAvailable');
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocaleTag());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('adminPanel.users.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('adminPanel.users.totalCount', { count: filteredUsers.length })}
          </p>
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          {t('adminPanel.users.reload')}
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.users.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-10 px-3 py-0 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer"
            >
              <option value="all">{t('adminPanel.users.filterStatusAll')}</option>
              <option value="active">{t('adminPanel.users.filterStatusActive')}</option>
              <option value="banned">{t('adminPanel.users.filterStatusBanned')}</option>
            </select>
            {/* <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="h-10 px-3 py-0 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer"
            >
              <option value="all">{t('adminPanel.users.filterRoleAll')}</option>
              <option value="admin">{t('adminPanel.users.roleAdmin')}</option>
              <option value="user">{t('adminPanel.users.roleUser')}</option>
            </select> */}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-gray-500 text-sm">{t('adminPanel.users.loadingList')}</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={loadUsers}
            className="mt-3 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Users Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('adminPanel.users.colUser')}</th>
                  <th className="px-4 py-3 font-semibold">{t('adminPanel.users.colEmail')}</th>
                  <th className="px-4 py-3 font-semibold">{t('adminPanel.users.colStatus')}</th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort('reportCount')}
                  >
                    <div className="flex items-center gap-1">
                      {t('adminPanel.users.colReportCount')}
                      <span className="text-gray-400 group-hover:text-gray-600">
                        {sortField === 'reportCount' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 font-semibold cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center gap-1">
                      {t('adminPanel.users.colJoined')}
                      <span className="text-gray-400 group-hover:text-gray-600">
                        {sortField === 'createdAt' ? (
                          sortDirection === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-3 font-semibold">{t('adminPanel.users.colRole')}</th>
                  <th className="px-4 py-3 font-semibold text-center">{t('adminPanel.users.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {t('adminPanel.users.emptyList')}
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full object-cover shadow-sm border border-gray-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm shadow-sm bg-blue-500">
                              {getInitials(user.fullName)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.fullName || t('common.notAvailable')}</p>
                            <p className="text-xs text-gray-500">@{user.username || t('common.notAvailable')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{user.email || t('common.notAvailable')}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${user.status === 'ACTIVE'
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : user.status === 'BANNED'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                        >
                          {user.status === 'ACTIVE' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.reportCount && user.reportCount > 0 ? (
                          <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                            {user.reportCount}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${user.role === 'ADMIN'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                            }`}
                        >
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            to={`/admin/users/${user.id}`}
                            title={t('adminPanel.users.viewDetail')}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleToggleUserStatus(user.id!, user.status!)}
                            disabled={isUpdating === user.id}
                            title={user.status === 'ACTIVE' ? t('adminPanel.users.banTitle') : t('adminPanel.users.unbanTitle')}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 ${user.status === 'ACTIVE'
                              ? 'bg-red-50 text-red-600 hover:bg-red-100'
                              : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                          >
                            {isUpdating === user.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : user.status === 'ACTIVE' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id!, user.fullName!)}
                            disabled={isUpdating === user.id}
                            title={t('adminPanel.users.deleteTitle')}
                            className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('adminPanel.users.paginationRange', {
                  from: startIndex + 1,
                  to: Math.min(startIndex + itemsPerPage, filteredUsers.length),
                  total: filteredUsers.length,
                })}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('adminPanel.users.prev')}
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${currentPage === page
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-gray-400 px-1">...</span>}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('adminPanel.users.next')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
