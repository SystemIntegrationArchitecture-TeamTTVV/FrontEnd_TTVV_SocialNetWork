import { Search, Filter, Eye, Trash2, Users, FileText, Loader2, Globe, Lock, RefreshCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { groupsApi, type GroupData } from '../../apis/groupsApi';
import { getLocaleTag } from '../../i18n';

export default function AdminGroupManagement() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterPrivacy, setFilterPrivacy] = useState('all');

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupsApi.getAllGroups();
      setGroups(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('adminPanel.groups.loadError'));
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
    const matchesPrivacy = filterPrivacy === 'all' || g.privacy === filterPrivacy.toUpperCase();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.groups.pageTitle')}</h1>
          <p className="text-lg text-gray-600">
            {t('adminPanel.groups.totalCount', { count: filteredGroups.length })}
          </p>
        </div>
        <button
          onClick={loadGroups}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCcw className="w-5 h-5" />
          {t('adminPanel.users.reload')}
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
              placeholder={t('adminPanel.groups.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <select
            value={filterPrivacy}
            onChange={(e) => setFilterPrivacy(e.target.value)}
            className="h-14 px-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium cursor-pointer"
          >
            <option value="all">{t('adminPanel.groups.filterAll')}</option>
            <option value="public">{t('adminPanel.groups.privacyPublic')}</option>
            <option value="private">{t('adminPanel.groups.privacyPrivate')}</option>
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
            <div key={group.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                {group.avatar ? (
                  <img
                    src={group.avatar}
                    alt={group.name}
                    className="w-16 h-16 rounded-2xl object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600">
                    {getInitials(group.name)}
                  </div>
                )}
                <span
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 ${
                    group.privacy === 'PUBLIC' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {group.privacy === 'PUBLIC' ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  {group.privacy === 'PUBLIC' ? t('adminPanel.groups.privacyPublic') : t('adminPanel.groups.privacyPrivate')}
                </span>
              </div>

              <h3 className="font-bold text-xl text-gray-900 mb-1 line-clamp-1">{group.name}</h3>
              <p className="text-base text-gray-600 mb-4 line-clamp-2 min-h-[3rem]">
                {group.description || t('adminPanel.groups.noDescription')}
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

              <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => window.open(`/groups/${group.id}`, '_blank')}
                  title={t('adminPanel.groups.viewGroup')}
                  className="flex-1 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => group.id && handleDeleteGroup(group.id, group.name)}
                  disabled={deletingId === group.id}
                  title={t('adminPanel.groups.deleteGroup')}
                  className="flex-1 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50"
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
    </div>
  );
}
