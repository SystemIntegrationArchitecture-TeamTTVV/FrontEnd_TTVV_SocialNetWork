import { useState, useEffect } from 'react';
import { Search, MessageSquare, Loader2, Users, User, Clock, RefreshCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { getLocaleTag } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminMessages() {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'group' | 'dm'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load conversations for admin monitoring
      const userId = currentUser?.id || '';
      const data = userId ? await conversationsApi.getConversationsByUserId(userId) : [];
      setConversations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || t('adminPanel.messages.loadError'));
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participantNames?.some(n => n.toLowerCase().includes(searchQuery.toLowerCase())) ||
      conv.participantIds?.some(id => id.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType =
      filterType === 'all' ||
      (filterType === 'group' && conv.isGroup) ||
      (filterType === 'dm' && !conv.isGroup);
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const paginatedConversations = filteredConversations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try { return new Date(dateString).toLocaleString(getLocaleTag()); }
    catch { return dateString; }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  // Stats
  const totalConversations = conversations.length;
  const groupChats = conversations.filter(c => c.isGroup).length;
  const dmChats = conversations.filter(c => !c.isGroup).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">{t('adminPanel.messages.loadingList')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.messages.pageTitle')}</h1>
          <p className="text-lg text-gray-600">{t('adminPanel.messages.pageSubtitle')}</p>
        </div>
        <button
          onClick={loadConversations}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <RefreshCcw className="w-5 h-5" />
          {t('adminPanel.users.reload')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">{t('adminPanel.messages.statTotal')}</p>
            <p className="text-2xl font-bold text-gray-900">{totalConversations}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">{t('adminPanel.messages.statGroups')}</p>
            <p className="text-2xl font-bold text-gray-900">{groupChats}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
            <User className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">{t('adminPanel.messages.statDM')}</p>
            <p className="text-2xl font-bold text-gray-900">{dmChats}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 font-medium">
          {error}
          <button onClick={loadConversations} className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">{t('common.retry')}</button>
        </div>
      )}

      {/* Filter + Search */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('adminPanel.messages.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'group', 'dm'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-5 py-3 rounded-xl font-semibold transition-all ${
                  filterType === type
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type === 'all' ? t('adminPanel.messages.tabAll') : type === 'group' ? t('adminPanel.messages.tabGroups') : t('adminPanel.messages.tabDM')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      {paginatedConversations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">{t('adminPanel.messages.emptyList')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">{t('adminPanel.messages.colConversation')}</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">{t('adminPanel.messages.colType')}</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">{t('adminPanel.messages.colParticipants')}</th>
                <th className="px-6 py-4 text-left text-base font-bold text-gray-900">{t('adminPanel.messages.colLastMessage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedConversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${
                        conv.isGroup ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                      }`}>
                        {conv.isGroup ? <Users className="w-5 h-5" /> : getInitials(conv.participantNames?.[0])}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 line-clamp-1">{conv.isGroup ? (conv.groupName || t('adminPanel.messages.unnamed')) : (conv.participantNames?.join(', ') || t('adminPanel.messages.unnamed'))}</p>
                        <p className="text-xs text-gray-500 font-mono">{conv.id?.substring(0, 8)}…</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                      conv.isGroup ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {conv.isGroup ? t('adminPanel.messages.typeGroup') : t('adminPanel.messages.typeDM')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-base font-semibold text-gray-700">
                      {conv.participantIds?.length ?? 0}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(conv.lastMessageAt)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {filteredConversations.length > itemsPerPage && (
            <div className="px-6 py-5 border-t border-gray-200 flex items-center justify-between">
              <p className="text-base text-gray-600">
                {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredConversations.length)} / {filteredConversations.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50"
                >
                  {t('adminPanel.users.prev')}
                </button>
                <span className="px-4 py-2 text-base font-semibold">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-colors disabled:opacity-50"
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
