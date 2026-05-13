import { Search, Filter, Eye, Trash2, Users, FileText, Loader2, Globe, Lock, RefreshCcw, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsApi, type GroupData } from '../../apis/groupsApi';
import { reportsApi, type Report } from '../../apis/reports';
import { getLocaleTag } from '../../i18n';

export default function AdminGroupManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterPrivacy, setFilterPrivacy] = useState('all');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [overviewGroup, setOverviewGroup] = useState<GroupData | null>(null);
  const [reportGroup, setReportGroup] = useState<GroupData | null>(null);
  const [groupReports, setGroupReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (reportGroup?.id) {
      setLoadingReports(true);
      reportsApi.getAllReports(reportGroup.id)
        .then(data => setGroupReports(data))
        .catch(err => console.error("Failed to load reports:", err))
        .finally(() => setLoadingReports(false));
    } else {
      setGroupReports([]);
    }
  }, [reportGroup]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.action-dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupsApi.getAllGroupsForAdmin();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('adminPanel.groups.loadError', 'Lỗi khi tải danh sách nhóm'));
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!window.confirm(t('adminPanel.groups.confirmDelete', { name: groupName }))) return;
    try {
      setDeletingId(groupId);
      await groupsApi.deleteGroup(groupId);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (err: any) {
      alert(t('adminPanel.groups.deleteError') + ': ' + (err.message || ''));
      console.error('Failed to delete group:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.adminName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrivacy = 
      filterPrivacy === 'all' ? true :
      filterPrivacy === 'locked' ? g.active === false :
      g.privacy === filterPrivacy.toUpperCase();

    return matchesSearch && matchesPrivacy;
  });

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleDateString(getLocaleTag()); }
    catch { return dateString; }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('adminPanel.groups.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('adminPanel.groups.pageTitle', 'Quản lý nhóm')}</h1>
          <p className="text-sm text-gray-600">
            {t('adminPanel.groups.totalCount', 'Tổng cộng: {{count}} nhóm', { count: filteredGroups.length })}
          </p>
        </div>
        <button
          onClick={loadGroups}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" />
          {t('adminPanel.groups.reload', 'Tải lại')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-medium flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadGroups}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
              type="text"
              placeholder={t('adminPanel.groups.searchPlaceholder', 'Tìm kiếm nhóm...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
            />
          </div>
          <select
            value={filterPrivacy}
            onChange={(e) => setFilterPrivacy(e.target.value)}
            className="h-12 px-4 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium cursor-pointer"
          >
            <option value="all">{t('adminPanel.groups.filterAll', 'Tất cả trạng thái')}</option>
            <option value="public">{t('adminPanel.groups.privacyPublic', 'Công khai')}</option>
            <option value="private">{t('adminPanel.groups.privacyPrivate', 'Kín')}</option>
            <option value="locked">{t('adminPanel.groups.filterLocked', 'Bị khóa')}</option>
          </select>
        </div>
      </div>

      {filteredGroups.length === 0 && !error ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('adminPanel.groups.emptyList')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className={`bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border border-gray-100 relative ${group.active === false ? 'opacity-75 grayscale-[40%] border-red-200' : ''}`}>
              {group.active === false && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1 z-10 border-2 border-white">
                  <Lock className="w-3 h-3" />
                  Bị khóa
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-12 h-12 rounded-xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600">
                    {getInitials(group.name)}
                  </div>
                )}
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                    group.privacy === 'PUBLIC' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {group.privacy === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {group.privacy === 'PUBLIC' ? t('adminPanel.groups.privacyPublic', 'Công khai') : t('adminPanel.groups.privacyPrivate', 'Kín')}
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{group.name}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2 min-h-[2.5rem]">
                {group.description || t('adminPanel.groups.noDescription', 'Chưa có mô tả')}
              </p>

              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold">{group.memberCount ?? 0}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold">{group.postCount ?? 0}</span>
                </div>
                <span className="text-gray-400 text-xs ml-auto">{formatDate(group.createdAt)}</span>
              </div>

              {group.adminName && (
                <p className="text-xs text-gray-500 mb-3">Admin: <span className="font-semibold text-gray-700">{group.adminName}</span></p>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <div className="flex-1 relative action-dropdown-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDropdown(activeDropdown === group.id ? null : group.id || null);
                    }}
                    title={t('adminPanel.groups.viewOptions', 'Tùy chọn xem')}
                    className={`w-full h-10 rounded-xl flex items-center justify-center transition-colors ${
                      activeDropdown === group.id ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {activeDropdown === group.id && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-20 overflow-hidden transform origin-bottom scale-100 opacity-100 transition-all duration-200">
                      {group.privacy !== 'PRIVATE' ? (
                        <button
                          onClick={() => {
                            window.open(`/groups/${group.id}`, '_blank');
                            setActiveDropdown(null);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Vào thẳng nhóm
                        </button>
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-400 bg-gray-50 rounded-lg font-medium flex flex-col gap-0.5 cursor-not-allowed">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Nhóm kín
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          setOverviewGroup(group);
                          setActiveDropdown(null);
                        }}
                        className="w-full mt-1 text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        Xem tổng quan
                      </button>

                      <button
                        onClick={() => {
                          setReportGroup(group);
                          setActiveDropdown(null);
                        }}
                        className="w-full mt-1 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2 transition-colors"
                      >
                        <ShieldAlert className="w-4 h-4" />
                        Xem báo cáo
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => group.id && handleDeleteGroup(group.id, group.name)}
                  disabled={deletingId === group.id}
                  title={t('adminPanel.groups.deleteGroup', 'Xóa nhóm')}
                  className="flex-1 h-10 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {deletingId === group.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Modal */}
      {overviewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-lg font-bold text-gray-900">{t('adminPanel.groups.overview', 'Tổng quan Nhóm')}</h2>
              <button
                onClick={() => setOverviewGroup(null)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                {overviewGroup.avatar ? (
                  <img src={overviewGroup.avatar} alt={overviewGroup.name} className="w-16 h-16 rounded-xl object-cover shadow-sm border border-gray-100" />
                ) : (
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600">
                    {getInitials(overviewGroup.name)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 line-clamp-1">{overviewGroup.name}</h3>
                  <span className="font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-xs">ID: {overviewGroup.id}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100/50 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Trạng thái</span>
                  <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 shadow-sm ${
                    overviewGroup.privacy === 'PUBLIC' ? 'bg-white text-blue-700 border border-blue-100' : 'bg-white text-gray-700 border border-gray-200'
                  }`}>
                    {overviewGroup.privacy === 'PUBLIC' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {overviewGroup.privacy === 'PUBLIC' ? 'Công khai' : 'Nhóm kín'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Admin</span>
                  <span className="font-bold text-gray-900 line-clamp-1 max-w-[150px] text-right">
                    {overviewGroup.adminName || 'Không rõ'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Thành viên</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    {overviewGroup.memberCount ?? 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Bài viết</span>
                  <span className="font-bold text-gray-900 flex items-center gap-1">
                    <FileText className="w-4 h-4 text-purple-500" />
                    {overviewGroup.postCount ?? 0}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Ngày tạo</span>
                  <span className="font-bold text-gray-900">
                    {formatDate(overviewGroup.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Report Modal */}
      {reportGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-red-50">
              <h2 className="text-lg font-bold text-red-700 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                Báo cáo vi phạm: {reportGroup.name}
              </h2>
              <button
                onClick={() => setReportGroup(null)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto bg-gray-50">
              {loadingReports ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-red-500 mb-2" />
                  <p className="text-sm text-gray-500">Đang tải báo cáo...</p>
                </div>
              ) : groupReports.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-500 text-sm">Chưa có báo cáo nào cho nhóm này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupReports.map((report) => (
                    <div key={report.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          {report.reporterAvatar ? (
                            <img src={report.reporterAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                              {getInitials(report.reporterName || 'U')}
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-sm text-gray-900 block">{report.reporterName || 'Người dùng ẩn danh'}</span>
                            <span className="text-xs text-gray-500">{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 border border-red-200">
                          {report.reason || 'Vi phạm'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {report.actionTaken ? `Đã xử lý: ${report.actionTaken}` : 'Nội dung báo cáo chi tiết chưa được cung cấp.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white flex gap-3 border-t border-gray-100 justify-end">
               <button
                 onClick={async () => {
                   if (reportGroup?.id) {
                     const isLocked = reportGroup.active === false;
                     const actionName = isLocked ? 'mở khóa' : 'khóa';
                      if (window.confirm(`Bạn có chắc chắn muốn ${actionName} nhóm "${reportGroup.name}"?`)) {
                        try {
                          await groupsApi.toggleLock(reportGroup.id);
                          alert(`Đã ${actionName} nhóm!`);
                          setGroups(groups.map(g => g.id === reportGroup.id ? { ...g, active: isLocked, isActive: isLocked } : g));
                          setReportGroup({ ...reportGroup, active: isLocked, isActive: isLocked });
                        } catch (e) {
                          alert(`Lỗi khi ${actionName} nhóm.`);
                        }
                      }
                   }
                 }}
                 className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                   reportGroup?.active === false 
                     ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' 
                     : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200'
                 }`}
               >
                 {reportGroup?.active === false ? t('adminPanel.groups.unlockGroup', 'Mở khóa nhóm') : t('adminPanel.groups.lockGroup', 'Khóa nhóm')}
               </button>
               <button
                 onClick={() => {
                   if (window.confirm(`Cảnh báo: Hành động này sẽ xóa nhóm "${reportGroup?.name}". Tiếp tục?`)) {
                     reportGroup?.id && handleDeleteGroup(reportGroup.id, reportGroup.name);
                     setReportGroup(null);
                   }
                 }}
                 className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors"
               >
                 Xóa nhóm
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
