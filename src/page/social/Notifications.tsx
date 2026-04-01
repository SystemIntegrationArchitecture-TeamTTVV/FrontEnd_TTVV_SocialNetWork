import { Heart, MessageCircle, Share2, UserPlus, Tag, Clock } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Notifications() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const notifications = [
    {
      id: 1,
      type: 'like',
      user: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
      action: t('notificationsSocial.actions.likedPost'),
      time: '2m ago',
      read: false,
      icon: Heart,
    },
    {
      id: 2,
      type: 'comment',
      user: { name: 'Mike Chen', avatar: 'MC', color: '#FF6B6B' },
      action: t('notificationsSocial.actions.commented'),
      time: '15m ago',
      read: false,
      icon: MessageCircle,
    },
    {
      id: 3,
      type: 'share',
      user: { name: 'Emma Davis', avatar: 'ED', color: '#4ECDC4' },
      action: t('notificationsSocial.actions.sharedPost'),
      time: '1h ago',
      read: false,
      icon: Share2,
    },
    {
      id: 4,
      type: 'friend_request',
      user: { name: 'Alex Rodriguez', avatar: 'AR', color: '#FFD93D' },
      action: t('notificationsSocial.actions.friendRequest'),
      time: '3h ago',
      read: true,
      icon: UserPlus,
    },
    {
      id: 5,
      type: 'reaction',
      user: { name: 'Lisa Wang', avatar: 'LW', color: '#A8E6CF' },
      action: t('notificationsSocial.actions.reactedComment'),
      time: '5h ago',
      read: true,
      icon: Heart,
    },
    {
      id: 6,
      type: 'tag',
      user: { name: 'Tom Brown', avatar: 'TB', color: '#FFB6B9' },
      action: t('notificationsSocial.actions.taggedPost'),
      time: 'Yesterday',
      read: true,
      icon: Tag,
    },
    {
      id: 7,
      type: 'memory',
      user: null,
      action: t('notificationsSocial.actions.memory'),
      time: 'Yesterday',
      read: true,
      icon: Clock,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayedNotifications = activeTab === 'all' ? notifications : notifications.filter((n) => !n.read);

  return (
    <div className="max-w-2xl mx-auto p-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa]">{t('notificationsSocial.title')}</h1>

        {unreadCount > 0 && (
          <button className="text-sm text-blue-600 hover:underline font-semibold">
            {t('notificationsSocial.markAllRead')}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-gray-100/50 dark:bg-[#1a1d28]/50 glass-surface rounded-[24px] p-1.5 mb-8 flex gap-2 shadow-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 h-11 rounded-[18px] font-semibold transition-all relative ${
            activeTab === 'all'
              ? 'bg-white dark:bg-[#242838] text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-[#9aa3bc] hover:text-gray-700 dark:hover:text-[#edf0fa] hover:bg-white/50 dark:hover:bg-[#22263a]'
          }`}
        >
          {t('notificationsSocial.tabs.all')}
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={`flex-1 h-11 rounded-[18px] font-semibold transition-all relative ${
            activeTab === 'unread'
              ? 'bg-white dark:bg-[#242838] text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-500 dark:text-[#9aa3bc] hover:text-gray-700 dark:hover:text-[#edf0fa] hover:bg-white/50 dark:hover:bg-[#22263a]'
          }`}
        >
          {t('notificationsSocial.tabs.unread')}
          {unreadCount > 0 && (
            <span className="absolute top-2 right-4 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {/* New Section */}
        {displayedNotifications.filter((n) => !n.read).length > 0 && (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-3 px-2">{t('notificationsSocial.new')}</h2>
            <div className="space-y-2 mb-6">
              {displayedNotifications
                .filter((n) => !n.read)
                .map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className="bg-blue-50/50 dark:bg-blue-500/10 rounded-[28px] p-5 hover:bg-blue-100/50 dark:hover:bg-blue-500/20 transition-all cursor-pointer border border-blue-100/30 dark:border-blue-500/10 shadow-sm group"
                    >

                      <div className="flex items-start gap-3">
                        {notification.user ? (
                          <div className="relative shrink-0">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm"
                              style={{ backgroundColor: notification.user.color }}
                            >
                              {notification.user.avatar}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-sm">
                              <Icon className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-1 leading-relaxed">
                            {notification.user ? (
                              <>
                                <span className="font-semibold">{notification.user.name}</span>{' '}
                                {notification.action}
                              </>
                            ) : (
                              notification.action
                            )}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">{notification.time}</p>
                          {notification.type === 'friend_request' && (
                            <div className="flex gap-2 mt-3">
                              <button className="h-8 px-4 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                                {t('notificationsSocial.confirm')}
                              </button>
                              <button className="h-8 px-4 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                {t('notificationsSocial.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Earlier Section */}
        {displayedNotifications.filter((n) => n.read).length > 0 && (
          <>
            <h2 className="text-base font-bold text-gray-900 mb-3 px-2">{t('notificationsSocial.earlier')}</h2>
            <div className="space-y-2">
              {displayedNotifications
                .filter((n) => n.read)
                .map((notification) => {
                  const Icon = notification.icon;
                  return (
                    <div
                      key={notification.id}
                      className="bg-white dark:bg-[#1a1d28] rounded-[28px] p-5 hover:bg-gray-50 dark:hover:bg-[#1e212b] transition-all cursor-pointer border border-gray-100/50 dark:border-white/5 shadow-sm group"
                    >

                      <div className="flex items-start gap-3">
                        {notification.user ? (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm shrink-0"
                            style={{ backgroundColor: notification.user.color }}
                          >
                            {notification.user.avatar}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-gray-600" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 mb-1 leading-relaxed">
                            {notification.user ? (
                              <>
                                <span className="font-semibold">{notification.user.name}</span>{' '}
                                {notification.action}
                              </>
                            ) : (
                              notification.action
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                          {notification.type === 'friend_request' && (
                            <div className="flex gap-2 mt-3">
                              <button className="h-8 px-4 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                                {t('notificationsSocial.confirm')}
                              </button>
                              <button className="h-8 px-4 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                                {t('notificationsSocial.delete')}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
