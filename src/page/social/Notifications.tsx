import { Heart, MessageCircle, Share2, UserPlus, Tag, Users, Bell } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { notificationsApi, type Notification as NotificationData } from '../../apis/notifications';
import { authApi } from '../../apis/auth';
import { useSocket } from '../../contexts/SocketContext';
import { SocketEventTypes } from '../../services/socketEvents';

// Map BE notification type â†’ icon
const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  FRIEND_REQUEST: UserPlus,
  FRIEND_ACCEPTED: UserPlus,
  GROUP_INVITE: Users,
  LIKE_POST: Heart,
  LIKE_COMMENT: Heart,
  COMMENT_POST: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  SHARE_POST: Share2,
  MENTION: Tag,
};

const AVATAR_COLORS = ['#42B72A', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF9F66', '#6C5CE7'];
function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
}
function formatTimeAgo(
  dateStr: string,
  t: (key: string, opts?: Record<string, unknown>) => string
) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return t('notificationDropdown.timeSeconds', { count: diff });
  if (diff < 3600) return t('notificationDropdown.timeMinutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('notificationDropdown.timeHours', { count: Math.floor(diff / 3600) });
  return t('notificationDropdown.timeDays', { count: Math.floor(diff / 86400) });
}

type TabKey = 'all' | 'unread' | 'friend' | 'group' | 'social';
const TABS: TabKey[] = ['all', 'unread', 'friend', 'group', 'social'];
const TAB_TYPES: Record<TabKey, string[]> = {
  all: [],
  unread: [],
  friend: ['FRIEND_REQUEST', 'FRIEND_ACCEPTED'],
  group: ['GROUP_INVITE', 'JOIN_REQUEST_APPROVED', 'JOIN_REQUEST_CREATED'],
  social: ['LIKE_POST', 'LIKE_COMMENT', 'COMMENT_POST', 'COMMENT_REPLY', 'SHARE_POST', 'MENTION'],
};

export default function Notifications() {
  const { t } = useTranslation();
  const { subscribe } = useSocket();
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = authApi.getCurrentUser();

  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const data = await notificationsApi.getNotificationsByRecipientId(currentUser.id);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      // silent fail â€“ socket will still push new notifications
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Realtime: prepend new notification on socket event
  useEffect(() => {
    const unsub = subscribe(SocketEventTypes.NOTIFICATION, (event) => {
      const notif = event.data as NotificationData | undefined;
      if (!notif?.id) return;
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
    });
    return unsub;
  }, [subscribe]);

  const handleMarkAllAsRead = async () => {
    if (!currentUser?.id) return;
    try {
      await notificationsApi.markAllAsRead(currentUser.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // silent
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    const types = TAB_TYPES[activeTab];
    if (types.length > 0) return types.includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const newNotifs = filtered.filter((n) => !n.isRead);
  const earlierNotifs = filtered.filter((n) => n.isRead);

  const renderCard = (n: NotificationData, isNew: boolean) => {
    const Icon = NOTIFICATION_ICONS[n.type] ?? Tag;
    const name = n.actorName ?? '';
    const color = getAvatarColor(n.actorId ?? n.id);

    return (
      <div
        key={n.id}
        onClick={() => !n.isRead && handleMarkAsRead(n.id)}
        className={`rounded-[28px] p-5 transition-all cursor-pointer shadow-sm group ${
          isNew
            ? 'bg-blue-50/50 dark:bg-blue-500/10 hover:bg-blue-100/50 dark:hover:bg-blue-500/20 border border-blue-100/30 dark:border-blue-500/10'
            : 'bg-white dark:bg-[#1a1d28] hover:bg-gray-50 dark:hover:bg-[#1e212b] border border-gray-100/50 dark:border-white/5'
        }`}
      >
        <div className="flex items-start gap-3">
          {n.actorId ? (
            <div className="relative shrink-0">
              {n.actorAvatar ? (
                <img
                  src={n.actorAvatar}
                  className="w-12 h-12 rounded-full object-cover shadow-sm"
                  alt={name}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                  style={{ backgroundColor: color }}
                >
                  {getInitials(name)}
                </div>
              )}
              {isNew && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm">
                  <Icon className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-[#edf0fa] mb-1 leading-relaxed">
              {name && <span className="font-semibold">{name} </span>}
              {n.content}
            </p>
            <p className={`text-xs font-medium ${isNew ? 'text-blue-600' : 'text-gray-500'}`}>
              {formatTimeAgo(n.createdAt, t)}
            </p>
          </div>
          {isNew && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa]">
          {t('notificationsSocial.title')}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:underline font-semibold"
          >
            {t('notificationsSocial.markAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-100/50 dark:bg-[#1a1d28]/50 glass-surface rounded-[24px] p-1.5 mb-8 flex gap-1 shadow-sm overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-w-fit h-11 px-3 rounded-[18px] font-semibold text-sm transition-all relative whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white dark:bg-[#242838] text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-[#9aa3bc] hover:text-gray-700 dark:hover:text-[#edf0fa] hover:bg-white/50 dark:hover:bg-[#22263a]'
            }`}
          >
            {t(`notificationsSocial.tabs.${tab}`)}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading spinner */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            {t('notificationDropdown.empty')}
          </p>
        </div>
      )}

      {/* Notification list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {newNotifs.length > 0 && (
            <>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3 px-2">
                {t('notificationsSocial.new')}
              </h2>
              <div className="space-y-2 mb-6">
                {newNotifs.map((n) => renderCard(n, true))}
              </div>
            </>
          )}
          {earlierNotifs.length > 0 && (
            <>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3 px-2">
                {t('notificationsSocial.earlier')}
              </h2>
              <div className="space-y-2">
                {earlierNotifs.map((n) => renderCard(n, false))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
              </div>
            </>
          )}
          {earlierNotifs.length > 0 && (
            <>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#edf0fa] mb-3 px-2">
                {t('notificationsSocial.earlier')}
              </h2>
              <div className="space-y-2">
                {earlierNotifs.map((n) => renderCard(n, false))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
