import { useState, useEffect, useCallback } from 'react';
import {
  Home, UserPlus, Lightbulb, Users, Calendar,
  MapPin, Check, X, Loader2, UserCheck, Undo2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../apis/auth';
import { friendRequestsApi, friendsApi, getFriends } from '../../apis/friendRequests';
import type { FriendRequest } from '../../apis/friendRequests';
import { usersApi } from '../../apis/users';
import type { User } from '../../apis/users';

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
      const [allUsers, currentFriends, sentReqs, recvReqs] = await Promise.all([
        usersApi.getAllUsers().catch(() => [] as User[]),
        friendsApi.getFriendsByUserId(userId).catch(() => []),
        friendRequestsApi.getFriendRequestsBySenderId(userId).catch(() => []),
        friendRequestsApi.getFriendRequestsByReceiverId(userId).catch(() => []),
      ]);

      const pendingSent = sentReqs.filter(r => (r.status as string).toUpperCase() === 'PENDING');
      if (pendingSent.length > 0) {
        setSentRequests(prev => {
          const m = new Map(prev);
          pendingSent.forEach(r => { if (r.receiverId) m.set(r.receiverId, r.id); });
          return m;
        });
      }

      const friendIds = (currentFriends as { friendId: string }[]).map(f => f.friendId);
      const exclude = new Set([userId, ...friendIds, ...recvReqs.map(r => r.senderId)]);
      const filtered = (allUsers as User[]).filter(u => u.id && !exclude.has(u.id));
      setSuggestions(filtered.slice(0, 12));
    } catch { setSuggestions([]); }
    finally  { setLoadingSuggestions(false); }
  }, [userId]);

  useEffect(() => { loadRequests();    }, [loadRequests]);
  useEffect(() => { loadSuggestions(); }, [loadSuggestions]);
  useEffect(() => { if (activeTab === 'all') loadFriends(); }, [activeTab, loadFriends]);

  /* ── Actions ── */
  const handleAccept = async (req: FriendRequest) => {
    if (!req.id || accepting) return;
    setAccepting(req.id);
    try {
      await friendRequestsApi.acceptFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch { /* silent */ } finally { setAccepting(null); }
  };

  const handleReject = async (req: FriendRequest) => {
    if (!req.id || rejecting) return;
    setRejecting(req.id);
    try {
      await friendRequestsApi.rejectFriendRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch { /* silent */ } finally { setRejecting(null); }
  };

  const handleAddFriend = async (targetId: string) => {
    if (!userId || adding || sentRequests.has(targetId)) return;
    setAdding(targetId);
    try {
      const result = await friendRequestsApi.createFriendRequest({ senderId: userId, receiverId: targetId });
      setSentRequests(prev => new Map(prev).set(targetId, result.id));
    } catch { /* silent */ } finally { setAdding(null); }
  };

  const handleCancelRequest = async (targetId: string) => {
    const requestId = sentRequests.get(targetId);
    if (!requestId || cancelling) return;
    setCancelling(targetId);
    try {
      await friendRequestsApi.cancelFriendRequest(requestId);
      setSentRequests(prev => { const m = new Map(prev); m.delete(targetId); return m; });
    } catch { /* silent */ } finally { setCancelling(null); }
  };

  const tabs = [
    { id: 'home',        icon: Home,      label: 'Trang chủ' },
    { id: 'requests',    icon: UserPlus,  label: 'Lời mời kết bạn', badge: requests.length || null },
    { id: 'suggestions', icon: Lightbulb, label: 'Gợi ý' },
    { id: 'all',         icon: Users,     label: 'Tất cả bạn bè' },
    { id: 'birthdays',   icon: Calendar,  label: 'Sinh nhật' },
    { id: 'custom',      icon: MapPin,    label: 'Danh sách tùy chỉnh' },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0c0e14] flex">

      {/* ── Left Sidebar ── */}
      <aside className="w-72 bg-white dark:bg-[#13151f] border-r border-gray-200 dark:border-[#22263a] p-4 shrink-0 shadow-sm">
        <div className="mb-6 px-1">
          <h1 className="text-[22px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">Bạn bè</h1>
          <p className="text-xs text-gray-400 dark:text-[#5a6278] mt-0.5">Quản lý kết nối của bạn</p>
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
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm shadow-blue-200'
                      : 'bg-gray-100 dark:bg-[#22263a] text-gray-500 dark:text-[#9aa3bc]'
                  }`}>
                    <Icon className="w-[17px] h-[17px]" />
                  </div>
                  <span className={`text-sm font-semibold`}>{tab.label}</span>
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
      <main className="flex-1 px-8 py-6 overflow-y-auto">

        {/* === Lời mời kết bạn === */}
        {(activeTab === 'home' || activeTab === 'requests') && (
          <section className="mb-10">
            <SectionHeader
              title="Lời mời kết bạn"
              badge={requests.length > 0 ? `${requests.length} lời mời` : undefined}
            />
            {loadingRequests ? (
              <SkeletonGrid count={3} />
            ) : requests.length === 0 ? (
              <EmptyState icon="👋" text="Không có lời mời kết bạn nào" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {requests.map(req => {
                  const name  = req.senderName || 'Người dùng';
                  const color = getAvatarColor(name);
                  return (
                    <PersonCard
                      key={req.id}
                      name={name}
                      avatar={req.senderAvatar}
                      color={color}
                      subtitle="Đã gửi lời mời kết bạn"
                      onNameClick={() => req.senderId && navigate(`/profile/${req.senderId}`)}
                    >
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={!!accepting || !!rejecting}
                        className="w-full h-9 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-blue-200 disabled:opacity-60"
                      >
                        {accepting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Xác nhận
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={!!accepting || !!rejecting}
                        className="w-full h-9 bg-gray-100 hover:bg-gray-200 dark:bg-[#22263a] dark:hover:bg-[#2b2f45] text-gray-700 dark:text-[#c8ccde] text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {rejecting === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                        Xóa
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
            <SectionHeader title="Những người bạn có thể biết" />
            {loadingSuggestions ? (
              <SkeletonGrid count={6} />
            ) : suggestions.length === 0 ? (
              <EmptyState icon="🤝" text="Không có gợi ý nào" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {suggestions.map(user => {
                  const name  = user.fullName || user.username || 'Người dùng';
                  const color = getAvatarColor(name);
                  const sent  = sentRequests.has(user.id!);
                  return (
                    <PersonCard
                      key={user.id}
                      name={name}
                      avatar={user.avatar}
                      color={color}
                      subtitle={user.city || user.workPlace || undefined}
                      onNameClick={() => navigate(`/profile/${user.id}`)}
                    >
                      {sent ? (
                        <div className="flex gap-2">
                          <div className="flex-1 h-9 bg-gray-100 dark:bg-[#22263a] text-gray-500 dark:text-[#7e89a6] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />
                            Đã gửi lời mời
                          </div>
                          <button
                            onClick={() => handleCancelRequest(user.id!)}
                            disabled={cancelling === user.id}
                            title="Thu hồi lời mời"
                            className="h-9 px-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex items-center gap-1 disabled:opacity-60"
                          >
                            {cancelling === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
                            Thu hồi
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.id!)}
                          disabled={!!adding}
                          className="w-full h-9 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-70"
                        >
                          {adding === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <><UserPlus className="w-3.5 h-3.5" /><span>Thêm bạn bè</span></>
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
            <SectionHeader title="Tất cả bạn bè" />
            {loadingFriends ? (
              <SkeletonGrid count={6} />
            ) : friends.length === 0 ? (
              <EmptyState icon="👥" text="Chưa có bạn bè nào" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {friends.map(f => {
                  const name  = f.name || 'Người dùng';
                  const color = getAvatarColor(name);
                  return (
                    <PersonCard
                      key={f.id}
                      name={name}
                      avatar={f.avatar}
                      color={color}
                      subtitle="Bạn bè"
                      onNameClick={() => navigate(`/profile/${f.id}`)}
                    >
                      <button
                        onClick={() => navigate(`/profile/${f.id}`)}
                        className="w-full h-9 bg-gray-100 hover:bg-gray-200 dark:bg-[#22263a] dark:hover:bg-[#2b2f45] text-gray-700 dark:text-[#c8ccde] text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Trang cá nhân
                      </button>
                    </PersonCard>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'birthdays' && <EmptyState icon="🎂" text="Không có sinh nhật nào sắp tới" />}
        {activeTab === 'custom'    && <EmptyState icon="📋" text="Chưa có danh sách tùy chỉnh" />}

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

function PersonCard({ name, avatar, color, subtitle, onNameClick, children }: PersonCardProps) {
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return (
    <div className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#2b2f45] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Banner */}
      <div
        className="h-[72px] relative"
        style={{ background: `linear-gradient(135deg, rgba(${r},${g},${b},0.18) 0%, rgba(${r},${g},${b},0.35) 100%)` }}
      >
        {/* Avatar overlapping */}
        <div className="absolute -bottom-7 left-4">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-14 h-14 rounded-full border-[3px] border-white dark:border-[#1a1d28] object-cover shadow-sm"
            />
          ) : (
            <div
              className="w-14 h-14 rounded-full border-[3px] border-white dark:border-[#1a1d28] flex items-center justify-center text-white font-bold text-lg shadow-sm select-none"
              style={{ backgroundColor: color }}
            >
              {getInitials(name)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-9 px-4 pb-4">
        <h3
          className="font-bold text-gray-900 dark:text-[#edf0fa] text-[14px] leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
          onClick={onNameClick}
          title={name}
        >
          {name}
        </h3>
        {subtitle && (
          <p className="text-xs text-gray-400 dark:text-[#7e89a6] mt-0.5 truncate">{subtitle}</p>
        )}
        <div className="mt-3 space-y-1.5">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-[17px] font-bold text-gray-900 dark:text-[#edf0fa] tracking-tight">{title}</h2>
        <div className="mt-1 h-0.5 w-10 rounded-full bg-blue-500 opacity-70" />
      </div>
      {badge && (
        <span className="text-sm text-blue-500 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ─── Skeleton ─── */
function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#1a1d28] rounded-2xl border border-gray-100 dark:border-[#2b2f45] overflow-hidden shadow-sm">
          <div className="h-[72px] bg-linear-to-r from-gray-100 to-gray-50 dark:from-[#22263a] dark:to-[#1e2133] animate-pulse" />
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
  );
}

/* ─── Empty State ─── */
function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-[#1a1d28] flex items-center justify-center mb-4 shadow-sm">
        <span className="text-4xl">{icon}</span>
      </div>
      <p className="text-gray-500 dark:text-[#7e89a6] font-medium text-sm">{text}</p>
    </div>
  );
}
