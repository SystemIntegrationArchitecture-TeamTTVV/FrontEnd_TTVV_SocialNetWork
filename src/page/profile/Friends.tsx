import { useState, useEffect, useCallback } from 'react';
import {
  Home, UserPlus, Lightbulb, Users, Calendar,
  MapPin, Check, X, Loader2, UserCheck, Undo2,
  HandMetal, Handshake, UserRound, Cake, ListTodo,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../apis/auth';
import { friendRequestsApi, friendsApi, getFriends } from '../../apis/friendRequests';
import type { FriendRequest } from '../../apis/friendRequests';
import type { User } from '../../apis/users';
import { useTranslation } from 'react-i18next';
import { notify } from '../../services/notify';
import { useSocket } from '../../contexts/SocketContext';

/* ─── helpers ─── */
function getAvatarColor(name: string): string {
  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#F97316'];
  const hash = (name || '?').split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface Friend { id: string; name?: string; avatar?: string; }

/* ─────────────────────────────────────────────────────────────────── */

export default function Friends() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const [currentUser] = useState(() => authApi.getCurrentUser());
  const userId = currentUser?.id;

  const [activeTab, setActiveTab] = useState('home');

  const [requests,    setRequests]    = useState<FriendRequest[]>([]);
  const [friends,     setFriends]     = useState<Friend[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);

  const [loadingRequests,    setLoadingRequests]    = useState(true);
  const [loadingFriends,     setLoadingFriends]     = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [accepting,  setAccepting]  = useState<string | null>(null);
  const [rejecting,  setRejecting]  = useState<string | null>(null);
  const [adding,     setAdding]     = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Map<string, string>>(new Map());

  /* ── Loaders ── */
  const loadRequests = useCallback(async () => {
    if (!userId) { setLoadingRequests(false); return; }
    setLoadingRequests(true);
    try {
      const data = await friendRequestsApi.getPendingFriendRequestsByReceiverId(userId);
      setRequests(Array.isArray(data) ? data : []);
    } catch { setRequests([]); }
    finally  { setLoadingRequests(false); }
  }, [userId]);

  const loadFriends = useCallback(async () => {
    if (!userId) return;
    setLoadingFriends(true);
    try {
      const data = await getFriends(userId);
      setFriends(Array.isArray(data) ? (data as Friend[]) : []);
    } catch (e) {
      console.error('[loadFriends] ERROR:', e);
      setFriends([]);
    }
    finally  { setLoadingFriends(false); }
  }, [userId]);

  const loadSuggestions = useCallback(async () => {
    if (!userId) return;
    setLoadingSuggestions(true);
    try {
      // Fast path: use the dedicated friends-of-friends suggestion API
      const [data, sentReqs] = await Promise.all([
        friendsApi.getSuggestions(userId, 12).catch(() => null),
        friendRequestsApi.getFriendRequestsBySenderId(userId).catch(() => []),
      ]);

      // Populate sentRequests map (freshly from API data)
      const m = new Map<string, string>();
      const pending = (sentReqs || []).filter(r => (r.status as string).toUpperCase() === 'PENDING');
      pending.forEach(r => { if (r.receiverId) m.set(r.receiverId, r.id); });
      setSentRequests(m);

      if (data && Array.isArray(data)) {
        // Map FriendSuggestionDTO → User-compatible shape
        setSuggestions(data.map(s => ({
          id: s.userId,
          fullName: s.fullName,
          username: s.username,
          avatar: s.avatar,
          city: s.mutualFriendCount > 0 ? `${s.mutualFriendCount} bạn chung` : undefined,
          online: false,
        } as User)));
      } else {
        setSuggestions([]);
      }
    } catch { setSuggestions([]); }
    finally  { setLoadingSuggestions(false); }
  }, [userId]);

  useEffect(() => { loadRequests();    }, [loadRequests]);
  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);
  useEffect(() => { if (activeTab === 'all') loadFriends(); }, [activeTab, loadFriends]);

  const { subscribe } = useSocket();
  
  // Lắng nghe sự kiện realtime để cập nhật danh sách
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type !== 'NOTIFICATION' || !event.data) return;
      const type = event.data.type;
      
      // Có thay đổi về lời mời kết bạn (nhận, hủy, xác nhận, từ chối)
      if (['FRIEND_REQUEST', 'FRIEND_CANCELLED', 'FRIEND_ACCEPTED', 'FRIEND_REJECTED'].includes(type)) {
        loadRequests();
        loadSuggestions();
      }
      
      // Có thay đổi về danh sách bạn bè (thêm bạn, hủy bạn)
      if (['FRIEND_ACCEPTED', 'FRIEND_REMOVED'].includes(type)) {
        loadSuggestions();
        if (activeTab === 'all') {
          loadFriends();
        }
      }
    });

    return unsubscribe;
  }, [userId, subscribe, loadRequests, loadFriends, activeTab]);

  /* ── Actions ── */
  const handleAccept = async (req: FriendRequest) => {
    if (!req.id || accepting) return;
    setAccepting(req.id);
    try {
      await friendRequestsApi.acceptFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      notify.success('Đã chấp nhận lời mời kết bạn!');
    } catch {
      notify.error('Không thể chấp nhận lời mời, thử lại sau.');
    } finally { setAccepting(null); }
  };

  const handleReject = async (req: FriendRequest) => {
    if (!req.id || rejecting) return;
    setRejecting(req.id);
    try {
      await friendRequestsApi.rejectFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
      notify.success('Đã xóa lời mời kết bạn.');
    } catch {
      notify.error('Không thể xóa lời mời, thử lại sau.');
    } finally { setRejecting(null); }
  };

  const handleAddFriend = async (targetId: string) => {
    if (!userId || adding || sentRequests.has(targetId)) return;
    setAdding(targetId);
    try {
      const result = await friendRequestsApi.createFriendRequest({ senderId: userId, receiverId: targetId });
      setSentRequests(prev => new Map(prev).set(targetId, result.id));
      notify.success('Đã gửi lời mời kết bạn!');
    } catch {
      notify.error('Không thể gửi lời mời, thử lại sau.');
    } finally { setAdding(null); }
  };

  const handleCancelRequest = async (targetId: string) => {
    const requestId = sentRequests.get(targetId);
    if (!requestId || cancelling) return;
    setCancelling(targetId);
    try {
      await friendRequestsApi.cancelFriendRequest(requestId);
      setSentRequests(prev => { const m = new Map(prev); m.delete(targetId); return m; });
      notify.success('Đã thu hồi lời mời kết bạn.');
    } catch {
      notify.error('Không thể thu hồi lời mời, thử lại sau.');
    } finally { setCancelling(null); }
  };

  const tabs = [
    { id: 'home',        icon: Home,      label: t('friends.tabs.home') },
    { id: 'requests',    icon: UserPlus,  label: t('friends.tabs.requests'), badge: requests.length || null },
    { id: 'suggestions', icon: Lightbulb, label: t('friends.tabs.suggestions') },
    { id: 'all',         icon: Users,     label: t('friends.tabs.all') },
    { id: 'birthdays',   icon: Calendar,  label: t('friends.tabs.birthdays') },
    { id: 'custom',      icon: MapPin,    label: t('friends.tabs.custom') },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0c0e14] flex">

      {/* ── Left Sidebar ── */}
      <aside className="hidden md:flex md:flex-col w-60 xl:w-64 bg-white dark:bg-[#13151f] border-r border-gray-200 dark:border-[#22263a] p-3.5 shrink-0 shadow-sm">
        <div className="mb-4 px-1">
          <h1 className="text-[16px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">{t('friends.title')}</h1>
          <p className="text-[11px] text-gray-400 dark:text-[#5a6278] mt-0.5">{t('friends.subtitle')}</p>
        </div>

        <nav className="space-y-0.5">
          {tabs.map(tab => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-[#c8ccde] hover:bg-gray-50 dark:hover:bg-[#1e2133] hover:text-gray-900 dark:hover:text-[#edf0fa]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                      : 'bg-gray-100 dark:bg-[#22263a] text-gray-500 dark:text-[#9aa3bc]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[12.5px] font-semibold">{tab.label}</span>
                </div>
                {tab.badge ? (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 px-4 md:px-6 py-5 overflow-y-auto">

        {/* === Lời mời kết bạn === */}
        {(activeTab === 'home' || activeTab === 'requests') && (
          <section className="mb-10">
            <SectionHeader
              title={t('friends.sections.requests')}
              badge={requests.length > 0 ? t('friends.requestCount', { count: requests.length }) : undefined}
            />
            {loadingRequests ? (
              <SkeletonGrid count={3} loadingText={t('friends.loading')} />
            ) : requests.length === 0 ? (
              <EmptyState icon={HandMetal} text={t('friends.empty.noRequests')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {requests.map((req, i) => {
                  const name  = req.senderName || t('friends.userFallback');
                  const color = getAvatarColor(name);
                  return (
                    <PersonCard
                      key={req.id}
                      name={name}
                      avatar={req.senderAvatar}
                      color={color}
                      subtitle={t('friends.requestSent')}
                      index={i}
                      onNameClick={() => req.senderId && navigate(`/profile/${req.senderId}`)}
                    >
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={!!accepting || !!rejecting}
                        className="w-full h-9 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_4px_rgba(37,99,235,0.35)] disabled:opacity-60"
                      >
                        {accepting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        {t('friends.confirm')}
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={!!accepting || !!rejecting}
                        className="w-full h-9 bg-gray-100 hover:bg-gray-200 dark:bg-[#252840] dark:hover:bg-[#2d3150] text-gray-600 dark:text-[#c8ccde] text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {rejecting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        {t('friends.reject', 'Từ chối')}
                      </button>
                    </PersonCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* === Gợi ý === */}
        {(activeTab === 'home' || activeTab === 'suggestions') && (
          <section>
            <SectionHeader title={t('friends.sections.suggestions')} />
            {loadingSuggestions ? (
              <SkeletonGrid count={6} loadingText={t('friends.loading')} />
            ) : suggestions.length === 0 ? (
              <EmptyState icon={Handshake} text={t('friends.empty.noSuggestions')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suggestions.map((user, i) => {
                  const name  = user.fullName || user.username || t('friends.userFallback');
                  const color = getAvatarColor(name);
                  const sent  = sentRequests.has(user.id!);
                  return (
                    <PersonCard
                      key={user.id}
                      name={name}
                      avatar={user.avatar}
                      color={color}
                      subtitle={user.city || user.workPlace || undefined}
                      index={i}
                      onNameClick={() => navigate(`/profile/${user.id}`)}
                    >
                      {sent ? (
                        <div className="space-y-1.5">
                          <div className="w-full h-9 bg-gray-100 dark:bg-[#22263a] text-gray-500 dark:text-[#7e89a6] text-[12.5px] font-semibold rounded-xl flex items-center justify-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{t('friends.requestAlreadySent')}</span>
                          </div>
                          <button
                            onClick={() => handleCancelRequest(user.id!)}
                            disabled={cancelling === user.id}
                            className="w-full h-9 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-[12.5px] font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {cancelling === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                            {t('friends.withdraw')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id!)}
                          disabled={!!adding}
                          className="w-full h-9 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_1px_4px_rgba(37,99,235,0.3)] disabled:opacity-70"
                        >
                          {adding === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <><UserPlus className="w-3.5 h-3.5" /><span>{t('friends.addFriend')}</span></>
                          }
                        </button>
                      )}
                    </PersonCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* === Tất cả bạn bè === */}
        {activeTab === 'all' && (
          <section>
            <SectionHeader title={t('friends.sections.all')} />
            {loadingFriends ? (
              <SkeletonGrid count={6} loadingText={t('friends.loading')} />
            ) : friends.length === 0 ? (
              <EmptyState icon={UserRound} text={t('friends.empty.noFriends')} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {friends.map((f, i) => {
                  const name  = f.name || t('friends.userFallback');
                  const color = getAvatarColor(name);
                  return (
                    <PersonCard
                      key={f.id}
                      name={name}
                      avatar={f.avatar}
                      color={color}
                      subtitle={t('friends.friend')}
                      index={i}
                      onNameClick={() => navigate(`/profile/${f.id}`)}
                    >
                      <button
                        onClick={() => navigate(`/profile/${f.id}`)}
                        className="w-full h-9 bg-gray-100 hover:bg-gray-200 dark:bg-[#252840] dark:hover:bg-[#2d3150] text-gray-700 dark:text-[#c8ccde] text-[13px] font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {t('friends.profile')}
                      </button>
                    </PersonCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'birthdays' && <EmptyState icon={Cake} text={t('friends.empty.noBirthdays')} />}
        {activeTab === 'custom'    && <EmptyState icon={ListTodo} text={t('friends.empty.noCustomList')} />}

      </main>
    </div>
  );
}

/* ─── PersonCard ─── */
interface PersonCardProps {
  name: string;
  avatar?: string;
  color: string;
  subtitle?: string;
  onNameClick?: () => void;
  children?: React.ReactNode;
}

function PersonCard({ name, avatar, color, subtitle, onNameClick, children, index = 0 }: PersonCardProps & { index?: number }) {
  return (
    <div
      className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#252840] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.09)] hover:-translate-y-[3px] transition-all duration-200 animate-card-in flex flex-col"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      {/* Avatar area */}
      <div className="pt-6 px-4 pb-3 flex flex-col items-center text-center">
        <div className="mb-3 relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-[68px] h-[68px] rounded-full object-cover ring-[3px] ring-white dark:ring-[#1a1d28] shadow-[0_2px_12px_rgba(0,0,0,0.12)]"
            />
          ) : (
            <div
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] select-none"
              style={{ backgroundColor: color }}
            >
              {getInitials(name)}
            </div>
          )}
        </div>
        <h3
          className="font-semibold text-[#0f1117] dark:text-[#edf0fa] text-[13px] leading-tight cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1 w-full"
          onClick={onNameClick}
          title={name}
        >
          {name}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-gray-400 dark:text-[#7e89a6] mt-0.5 truncate w-full">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-3 pb-4 mt-auto space-y-1.5">
        {children}
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="text-[14px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">{title}</h2>
        <div className="mt-1 h-0.5 w-10 rounded-full bg-blue-500 opacity-70" />
      </div>
      {badge && (
        <span className="text-[11.5px] text-blue-500 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-2.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */
function SkeletonGrid({ count, loadingText }: { count: number; loadingText: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-full border-[2.5px] border-gray-200 dark:border-[#2b2f45]" />
          <div className="absolute inset-0 rounded-full border-[2.5px] border-transparent border-t-blue-500 animate-spin" />
        </div>
        <span className="text-sm text-gray-400 dark:text-[#7e89a6] font-medium">{loadingText}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#2b2f45] overflow-hidden shadow-sm"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="h-[72px] bg-linear-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-[#22263a] dark:via-[#1e2133] dark:to-[#22263a] animate-shimmer bg-size-[200%_100%]" />
            <div className="pt-9 px-4 pb-4 space-y-2">
              <div className="h-3.5 bg-gray-100 dark:bg-[#22263a] rounded-lg animate-pulse w-2/3" />
              <div className="h-2.5 bg-gray-100 dark:bg-[#22263a] rounded-lg animate-pulse w-1/2" />
              <div className="pt-1 space-y-1.5">
                <div className="h-9 bg-gray-100 dark:bg-[#22263a] rounded-lg animate-pulse" />
                <div className="h-9 bg-gray-100 dark:bg-[#22263a] rounded-lg animate-pulse opacity-60" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-[#1a1d28] flex items-center justify-center mb-4 shadow-sm">
        <Icon className="w-9 h-9 text-gray-300 dark:text-[#4a5270]" />
      </div>
      <p className="text-gray-500 dark:text-[#7e89a6] font-medium text-sm">{text}</p>
    </div>
  );
}

