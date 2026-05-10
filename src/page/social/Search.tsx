import { useState, useEffect, useRef, useCallback } from 'react';
import { Search as SearchIcon, Users, UserPlus, X, Clock, Loader2, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usersApi, type User } from '../../apis/users';
import { groupsApi, type GroupData } from '../../apis/groupsApi';
import { friendRequestsApi } from '../../apis/friendRequests';
import { authApi } from '../../apis/auth';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { useNavigate } from 'react-router-dom';

const RECENT_KEY = 'search_recent';
const MAX_RECENT = 8;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function saveRecent(q: string) {
  const list = [q, ...getRecent().filter((s) => s !== q)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}
function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}
function removeRecent(q: string) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(getRecent().filter((s) => s !== q)));
}

const AVATAR_COLORS = ['#1877F2', '#42B72A', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#6C5CE7'];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}

type TabKey = 'all' | 'people' | 'groups' | 'messages';

export default function Search() {
  const { t } = useTranslation();
  const currentUser = authApi.getCurrentUser();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [recent, setRecent] = useState<string[]>(getRecent);

  const [people, setPeople] = useState<User[]>([]);
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [convResults, setConvResults] = useState<Conversation[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [errorPeople, setErrorPeople] = useState(false);
  const [errorGroups, setErrorGroups] = useState(false);
  const [errorConvs, setErrorConvs] = useState(false);
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Fetch people
  const fetchPeople = useCallback(async (q: string) => {
    if (!q) { setPeople([]); return; }
    setLoadingPeople(true);
    setErrorPeople(false);
    try {
      const data = await usersApi.searchUsers(q);
      setPeople(Array.isArray(data) ? data.filter((u) => u.id !== currentUser?.id) : []);
    } catch {
      setErrorPeople(true);
    } finally {
      setLoadingPeople(false);
    }
  }, [currentUser?.id]);

  // Fetch group conversations matching keyword
  const fetchConvs = useCallback(async (q: string) => {
    if (!q || !currentUser?.id) { setConvResults([]); return; }
    setLoadingConvs(true);
    setErrorConvs(false);
    try {
      const data = await conversationsApi.searchGroupConversations(currentUser.id, q);
      setConvResults(Array.isArray(data) ? data : []);
    } catch {
      setErrorConvs(true);
    } finally {
      setLoadingConvs(false);
    }
  }, [currentUser?.id]);

  // Fetch groups
  const fetchGroups = useCallback(async (q: string) => {
    if (!q) { setGroups([]); return; }
    setLoadingGroups(true);
    setErrorGroups(false);
    try {
      const data = await groupsApi.searchGroups(q);
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setErrorGroups(true);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setPeople([]); setGroups([]);
      return;
    }
    saveRecent(debouncedQuery);
    setRecent(getRecent());
    if (activeTab === 'all' || activeTab === 'people') fetchPeople(debouncedQuery);
    if (activeTab === 'all' || activeTab === 'groups') fetchGroups(debouncedQuery);
    if (activeTab === 'all' || activeTab === 'messages') fetchConvs(debouncedQuery);
  }, [debouncedQuery, activeTab, fetchPeople, fetchGroups, fetchConvs]);

  const handleAddFriend = async (user: User) => {
    if (!currentUser?.id || !user.id) return;
    try {
      await friendRequestsApi.createFriendRequest({ senderId: currentUser.id, receiverId: user.id });
      setAddedFriends((prev) => new Set(prev).add(user.id!));
    } catch {/* silent */}
  };

  const handleJoinGroup = async (group: GroupData) => {
    if (!currentUser?.id || !group.id) return;
    try {
      await groupsApi.joinGroup(group.id, currentUser.id);
      setJoinedGroups((prev) => new Set(prev).add(group.id!));
    } catch {/* silent */}
  };

  const handleSelectRecent = (q: string) => {
    setQuery(q);
    setDebouncedQuery(q);
  };
  const handleRemoveRecent = (q: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRecent(q);
    setRecent(getRecent());
  };
  const handleClearAll = () => { clearRecent(); setRecent([]); };

  const tabs: { id: TabKey; label: string }[] = [
    { id: 'all', label: t('searchSocial.filters.all') },
    { id: 'people', label: t('searchSocial.filters.people') },
    { id: 'groups', label: t('searchSocial.filters.groups') },
    { id: 'messages', label: t('searchSocial.filters.messages') },
  ];

  const showPeople = (activeTab === 'all' || activeTab === 'people') && debouncedQuery;
  const showGroups = (activeTab === 'all' || activeTab === 'groups') && debouncedQuery;
  const showConvs = (activeTab === 'all' || activeTab === 'messages') && debouncedQuery;

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-blue-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchSocial.searchPlaceholder')}
            className="w-full h-12 pl-12 pr-10 rounded-full border-2 border-blue-500 bg-white dark:bg-[#1a1d28] dark:text-[#edf0fa] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setDebouncedQuery(''); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                : 'bg-gray-100 text-gray-600 dark:bg-[#242838] dark:text-[#9aa3bc] hover:bg-gray-200 dark:hover:bg-[#2a2e3f]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Recent Searches */}
      {!debouncedQuery && recent.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-[#9aa3bc]">
              {t('searchSocial.recentSearches')}
            </h2>
            <button
              onClick={handleClearAll}
              className="text-xs text-blue-500 hover:underline font-medium"
            >
              {t('searchSocial.clearAll')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((q) => (
              <button
                key={q}
                onClick={() => handleSelectRecent(q)}
                className="group flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#242838] rounded-full text-sm text-gray-700 dark:text-[#edf0fa] hover:bg-gray-200 dark:hover:bg-[#2a2e3f] transition-colors"
              >
                <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{q}</span>
                <X
                  className="w-3 h-3 text-gray-400 hover:text-gray-600 ml-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemoveRecent(q, e)}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Empty prompt when no query */}
      {!debouncedQuery && recent.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <SearchIcon className="w-12 h-12" />
          <p className="text-sm">{t('searchSocial.prompt')}</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-8">
        {/* People */}
        {showPeople && (
          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3">
              {t('searchSocial.sections.people')}
            </h2>
            {loadingPeople ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : errorPeople ? (
              <p className="text-sm text-red-400 py-4">{t('searchSocial.error')}</p>
            ) : people.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t('searchSocial.noResults')}</p>
            ) : (
              <div className="space-y-2">
                {people.map((user) => {
                  const uid = user.id ?? user.username ?? '';
                  const name = user.fullName ?? (`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || (user.username ?? uid));
                  const added = addedFriends.has(uid);
                  return (
                    <div
                      key={uid}
                      className="rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-100/60 dark:border-white/5 p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#1e212b] transition-colors"
                    >
                      {user.avatar ? (
                        <img src={user.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" alt={name} />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                          style={{ backgroundColor: avatarColor(uid) }}
                        >
                          {initials(name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-[#edf0fa] truncate">{name}</p>
                        {user.bio && <p className="text-xs text-gray-500 dark:text-[#9aa3bc] truncate">{user.bio}</p>}
                        {user.city && <p className="text-xs text-gray-400 truncate">{user.city}{user.country ? `, ${user.country}` : ''}</p>}
                      </div>
                      <button
                        onClick={() => handleAddFriend(user)}
                        disabled={added}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors shrink-0 ${
                          added
                            ? 'bg-gray-100 dark:bg-[#242838] text-gray-400 cursor-default'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <UserPlus className="w-4 h-4" />
                        {added ? t('searchSocial.requested') : t('searchSocial.addFriend')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Groups */}
        {showGroups && (
          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3">
              {t('searchSocial.sections.groups')}
            </h2>
            {loadingGroups ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : errorGroups ? (
              <p className="text-sm text-red-400 py-4">{t('searchSocial.error')}</p>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t('searchSocial.noResults')}</p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const gid = group.id ?? group.name;
                  const joined = joinedGroups.has(gid);
                  return (
                    <div
                      key={gid}
                      className="rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-100/60 dark:border-white/5 p-4 hover:bg-gray-50 dark:hover:bg-[#1e212b] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {group.avatar ? (
                          <img src={group.avatar} className="w-12 h-12 rounded-xl object-cover shrink-0" alt={group.name} />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0"
                            style={{ backgroundColor: avatarColor(gid) }}
                          >
                            {initials(group.name)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-[#edf0fa] truncate">{group.name}</p>
                          <p className="text-xs text-gray-500 dark:text-[#9aa3bc]">
                            {group.privacy === 'PUBLIC' ? t('searchSocial.publicGroup') : t('searchSocial.privateGroup')}
                            {group.memberCount != null ? ` · ${group.memberCount.toLocaleString()} ${t('searchSocial.members')}` : ''}
                          </p>
                          {group.description && <p className="text-xs text-gray-400 dark:text-[#9aa3bc] truncate mt-0.5">{group.description}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinGroup(group)}
                        disabled={joined}
                        className={`w-full flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-semibold transition-colors ${
                          joined
                            ? 'bg-gray-100 dark:bg-[#242838] text-gray-400 cursor-default'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        {joined ? t('searchSocial.requested') : t('searchSocial.joinGroup')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Messages / Conversations */}
        {showConvs && (
          <section>
            <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3">
              {t('searchSocial.sections.messages')}
            </h2>
            {loadingConvs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
            ) : errorConvs ? (
              <p className="text-sm text-red-400 py-4">{t('searchSocial.error')}</p>
            ) : convResults.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">{t('searchSocial.noResults')}</p>
            ) : (
              <div className="space-y-2">
                {convResults.map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => navigate(`/messenger?conversation=${encodeURIComponent(conv.id)}`)}
                    className="w-full rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-100/60 dark:border-white/5 p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1e212b] transition-colors text-left"
                  >
                    {conv.groupAvatar ? (
                      <img src={conv.groupAvatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={conv.groupName ?? ''} />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-[#edf0fa] truncate">
                        {conv.groupName ?? conv.participantNames?.join(', ') ?? conv.id}
                      </p>
                      {conv.lastMessagePreview && (
                        <p className="text-xs text-gray-500 dark:text-[#9aa3bc] truncate">{conv.lastMessagePreview}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
