import { useState, useRef, useEffect, useMemo } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, Tag, X, Check, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationsApi, type Notification as NotificationData } from '../../apis/notifications';
import { authApi } from '../../apis/auth';
import { useSocket } from '../../contexts/SocketContext';
import { friendRequestsApi } from '../../apis/friendRequests';
import { conversationsApi } from '../../apis/conversations';
import { usersApi } from '../../apis/users';
import { groupsApi } from '../../apis/groupsApi';
import { useTranslation } from 'react-i18next';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationRead?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return UserPlus;
    case 'GROUP_INVITE':
      return Users;
    case 'LIKE_POST':
    case 'LIKE_COMMENT':
      return Heart;
    case 'COMMENT_POST':
      return MessageCircle;
    case 'SHARE_POST':
      return Share2;
    default:
      return Tag;
  }
};

const generateColor = (str: string): string => {
  const colors = ['#42B72A', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A8E6CF', '#FF9F66', '#6C5CE7'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string): string => {
  if (!name) return 'U';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

interface JoinRequestItem {
  id: string; // conversationId-requesterId
  type: 'JOIN_REQUEST';
  conversationId: string;
  conversationName: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationDropdown({ isOpen, onClose, onNotificationRead }: NotificationDropdownProps) {
  const { t } = useTranslation();
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t('notificationDropdown.timeSeconds', { count: diffInSeconds });
    if (diffInSeconds < 3600) return t('notificationDropdown.timeMinutes', { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return t('notificationDropdown.timeHours', { count: Math.floor(diffInSeconds / 3600) });
    return t('notificationDropdown.timeDays', { count: Math.floor(diffInSeconds / 86400) });
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const currentUser = authApi.getCurrentUser();
  const { subscribe } = useSocket();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadRequestSeq = useRef(0);

  // Load notifications and join requests when dropdown opens
  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!currentUser?.id) return;
      const requestSeq = ++loadRequestSeq.current;

      try {
        const shouldShowLoading = !hasLoadedOnce && notifications.length === 0 && joinRequests.length === 0;
        if (shouldShowLoading) {
          setLoading(true);
        }

        // Load core data in parallel to reduce open latency
        const [rawData, friendRequestsRaw, sentFriendRequestsRaw, rawConversations] = await Promise.all([
          notificationsApi.getNotificationsByRecipientId(currentUser.id),
          friendRequestsApi.getFriendRequestsByReceiverId(currentUser.id),
          friendRequestsApi.getFriendRequestsBySenderId(currentUser.id),
          conversationsApi.getConversationsByUserId(currentUser.id),
        ]);

        const data = Array.isArray(rawData) ? rawData : [];
        const friendRequests = Array.isArray(friendRequestsRaw) ? friendRequestsRaw : [];
        const sentFriendRequests = Array.isArray(sentFriendRequestsRaw) ? sentFriendRequestsRaw : [];
        const conversations = Array.isArray(rawConversations) ? rawConversations : [];
        const allFriendRequests = [...friendRequests, ...sentFriendRequests];
        
        // Filter notifications: Ẩn FRIEND_REQUEST nếu friend request đã ACTIVE
        const filteredData = data.filter(notification => {
          if (notification.type === 'FRIEND_REQUEST' && notification.relatedId) {
            const friendRequest = allFriendRequests.find(fr => fr.id === notification.relatedId);
            if (friendRequest && friendRequest.status === 'ACTIVE') {
              return false;
            }
          }
          return true;
        });
        
        // Ignore stale/obsolete response when a newer load has started.
        if (isCancelled || requestSeq !== loadRequestSeq.current) return;
        setNotifications(filteredData);

        // Build join requests and fetch requesters in parallel
        const joinRequestsList: JoinRequestItem[] = [];
        const eligibleConversations = conversations.filter(
          (conv) =>
            conv.isGroup &&
            conv.approvalsRequired &&
            conv.pendingJoinIds &&
            conv.pendingJoinIds.length > 0 &&
            (conv.ownerId === currentUser.id || conv.adminIds?.includes(currentUser.id)),
        );

        const requesterTasks = eligibleConversations.flatMap((conv) =>
          conv.pendingJoinIds.map(async (requesterId) => {
            try {
              const requester = await usersApi.getUserById(requesterId);
              return {
                id: `${conv.id}-${requesterId}`,
                type: 'JOIN_REQUEST' as const,
                conversationId: conv.id,
                conversationName: conv.groupName || t('notificationDropdown.groupChat'),
                requesterId,
                requesterName: requester.fullName || requester.username || requesterId,
                requesterAvatar: requester.avatar,
                createdAt: new Date().toISOString(),
                isRead: false,
              };
            } catch (err) {
              console.error(`Failed to fetch user ${requesterId}:`, err);
              return {
                id: `${conv.id}-${requesterId}`,
                type: 'JOIN_REQUEST' as const,
                conversationId: conv.id,
                conversationName: conv.groupName || t('notificationDropdown.groupChat'),
                requesterId,
                requesterName: requesterId,
                createdAt: new Date().toISOString(),
                isRead: false,
              };
            }
          }),
        );

        const requesterResults = await Promise.all(requesterTasks);
        joinRequestsList.push(...requesterResults);
        
        if (isCancelled || requestSeq !== loadRequestSeq.current) return;
        setJoinRequests(joinRequestsList);
        setHasLoadedOnce(true);
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load notifications/join requests:', error);
        }
      } finally {
        if (!isCancelled && requestSeq === loadRequestSeq.current) {
          setLoading(false);
        }
      }
    };

    if (isOpen) {
      loadData();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentUser?.id]);

  // Subscribe to socket for real-time notifications and join requests
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribeNotification = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'NOTIFICATION' && event.data) {
        const notification = event.data as NotificationData;
        console.log('🔔 New notification received in dropdown:', notification);
        
        setNotifications((prev) => {
          const exists = prev.some(n => n.id === notification.id);
          if (exists) return prev;
          return [notification, ...prev];
        });
      }

      // Handle JOIN_REQUEST_CREATED events
      if (event.type === 'JOIN_REQUEST_CREATED' && event.data) {
        const { conversationId, requesterId } = event.data as { conversationId: string; requesterId: string };
        console.log('👥 JOIN_REQUEST_CREATED received:', conversationId, requesterId);
        
        // Load conversation and user info to add to joinRequests
        Promise.all([
          conversationsApi.getConversationById(conversationId),
          usersApi.getUserById(requesterId).catch(() => null),
        ]).then(([conv, requester]) => {
          if (conv && conv.isGroup && conv.approvalsRequired) {
            const conversationName = conv.groupName || t('notificationDropdown.groupChat');
            const requesterName = requester?.fullName || requester?.username || requesterId;
            const requesterAvatar = requester?.avatar;
            
            setJoinRequests((prev) => {
              const exists = prev.some(jr => jr.id === `${conversationId}-${requesterId}`);
              if (exists) return prev;
              return [
                {
                  id: `${conversationId}-${requesterId}`,
                  type: 'JOIN_REQUEST',
                  conversationId,
                  conversationName,
                  requesterId,
                  requesterName,
                  requesterAvatar,
                  createdAt: new Date().toISOString(),
                  isRead: false,
                },
                ...prev,
              ];
            });
          }
        }).catch((err) => {
          console.error('Failed to load join request details:', err);
        });
      }

      // Handle JOIN_REQUEST_UPDATED (remove from list if rejected, or just mark handled if approved)
      if (event.type === 'JOIN_REQUEST_UPDATED' && event.data) {
        const { conversationId, requesterId } = event.data as { conversationId: string; requesterId: string };
        console.log('👥 JOIN_REQUEST_UPDATED received:', conversationId, requesterId);
        
        setJoinRequests((prev) => prev.filter(jr => jr.id !== `${conversationId}-${requesterId}`));
      }
    });

    return unsubscribeNotification;
  }, [currentUser?.id, subscribe]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleMarkAllRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      await notificationsApi.markAllAsRead(currentUser.id);
      setNotifications((prev) => prev.map(n => ({ ...n, isRead: true })));
      setJoinRequests((prev) => prev.map(jr => ({ ...jr, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleAcceptJoinRequest = async (joinRequest: JoinRequestItem) => {
    if (!currentUser?.id) return;

    try {
      await conversationsApi.handleJoinRequest(joinRequest.conversationId, {
        requesterId: joinRequest.requesterId,
        approverId: currentUser.id,
        approved: true,
      });
      setJoinRequests((prev) => prev.filter(jr => jr.id !== joinRequest.id));
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to accept join request:', error);
      alert(t('notificationDropdown.acceptJoinError'));
    }
  };

  const handleRejectJoinRequest = async (joinRequest: JoinRequestItem) => {
    if (!currentUser?.id) return;

    try {
      await conversationsApi.handleJoinRequest(joinRequest.conversationId, {
        requesterId: joinRequest.requesterId,
        approverId: currentUser.id,
        approved: false,
      });
      setJoinRequests((prev) => prev.filter(jr => jr.id !== joinRequest.id));
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to reject join request:', error);
      alert(t('notificationDropdown.rejectJoinError'));
    }
  };

  const handleAcceptFriendRequest = async (notification: NotificationData) => {
    if (!notification.relatedId) {
      console.warn('⚠️ Cannot accept friend request: relatedId is missing');
      return;
    }
    
    try {
      await friendRequestsApi.acceptFriendRequest(notification.relatedId);
      // Xóa notification FRIEND_REQUEST khỏi UI ngay lập tức
      setNotifications((prev) => prev.filter(n => n.id !== notification.id));
      // Update unread count
      onNotificationRead?.();
      
      // Reload notifications để đảm bảo đồng bộ (backend đã xóa notification)
      if (currentUser?.id) {
        try {
          const rawData = await notificationsApi.getNotificationsByRecipientId(currentUser.id);
          const data = Array.isArray(rawData) ? rawData : [];
          // Load friend requests để filter notifications đã ACTIVE
          const friendRequestsRaw = await friendRequestsApi.getFriendRequestsByReceiverId(currentUser.id);
          const sentFriendRequestsRaw = await friendRequestsApi.getFriendRequestsBySenderId(currentUser.id);
          const friendRequests = Array.isArray(friendRequestsRaw) ? friendRequestsRaw : [];
          const sentFriendRequests = Array.isArray(sentFriendRequestsRaw) ? sentFriendRequestsRaw : [];
          const allFriendRequests = [...friendRequests, ...sentFriendRequests];
          
          // Filter notifications: Ẩn FRIEND_REQUEST nếu friend request đã ACTIVE
          const filteredData = data.filter(n => {
            if (n.type === 'FRIEND_REQUEST' && n.relatedId) {
              const fr = allFriendRequests.find(f => f.id === n.relatedId);
              if (fr && fr.status === 'ACTIVE') {
                return false;
              }
            }
            return true;
          });
          
          setNotifications(filteredData);
        } catch (reloadError) {
          console.error('Failed to reload notifications:', reloadError);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to accept friend request:', error);
      // Nếu friend request không tồn tại (404), chỉ xóa notification khỏi UI
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Not Found') || errorMessage.includes('not found')) {
        setNotifications((prev) => prev.filter(n => n.id !== notification.id));
      } else {
        alert(t('notificationDropdown.acceptFriendError'));
      }
    }
  };

  const handleRejectFriendRequest = async (notification: NotificationData) => {
    if (!notification.relatedId) {
      console.warn('⚠️ Cannot reject friend request: relatedId is missing');
      return;
    }
    
    try {
      await friendRequestsApi.rejectFriendRequest(notification.relatedId);
      // Reload notifications
      if (currentUser?.id) {
        const rawData = await notificationsApi.getNotificationsByRecipientId(currentUser.id);
        setNotifications(Array.isArray(rawData) ? rawData : []);
      }
    } catch (error: unknown) {
      console.error('Failed to reject friend request:', error);
      // Nếu friend request không tồn tại (404), chỉ xóa notification khỏi UI
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Not Found') || errorMessage.includes('not found')) {
        setNotifications((prev) => prev.filter(n => n.id !== notification.id));
      } else {
        alert(t('notificationDropdown.rejectFriendError'));
      }
    }
  };

  const handleAcceptGroupInvite = async (notification: NotificationData) => {
    if (!currentUser?.id || !notification.relatedId) return;

    try {
      await groupsApi.joinGroup(notification.relatedId, currentUser.id);
      await notificationsApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to accept group invite:', error);
      alert(t('notificationDropdown.acceptGroupError'));
    }
  };

  const handleRejectGroupInvite = async (notification: NotificationData) => {
    if (!currentUser?.id || !notification.relatedId) return;

    try {
      await groupsApi.rejectGroupInvite(notification.relatedId, currentUser.id);
      await notificationsApi.markAsRead(notification.id);
      setNotifications((prev) =>
        prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      );
      onNotificationRead?.();
    } catch (error) {
      console.error('Failed to reject group invite:', error);
      alert(t('notificationDropdown.rejectGroupError'));
    }
  };

  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read if not read
    if (!notification.isRead) {
      notificationsApi.markAsRead(notification.id).then(() => {
        setNotifications((prev) => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        // Notify parent to update unread count
        onNotificationRead?.();
      });
    }

    // Navigate based on notification type
    if (notification.type === 'FRIEND_REQUEST' && notification.actorId) {
      navigate(`/profile/${notification.actorId}`);
      onClose();
      return;
    }

    if (notification.type === 'GROUP_INVITE' && notification.relatedId) {
      navigate(`/groups/${notification.relatedId}`);
      onClose();
    }
  };

  // Merge join requests with notifications and sort by createdAt
  const allItems = useMemo(() => {
    const combined: Array<NotificationData | JoinRequestItem> = [
      ...notifications,
      ...joinRequests,
    ];
    return combined.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime; // Newest first
    });
  }, [notifications, joinRequests]);

  const unreadCount = useMemo(() => {
    return (
      notifications.filter((n) => !n.isRead).length +
      joinRequests.filter((jr) => !jr.isRead).length
    );
  }, [notifications, joinRequests]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-full right-0 mt-2 w-120 bg-white rounded-2xl shadow-xl border border-gray-200/80 z-80 max-h-150 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100/80">
        <h3 className="text-lg font-semibold text-gray-900">{t('notificationDropdown.title')}</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors"
            >
              {t('notificationDropdown.markAllRead')}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-base">{t('common.loading')}</p>
          </div>
        ) : allItems.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-base">{t('notificationDropdown.empty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allItems.map((item) => {
              // Handle JoinRequestItem
              if ('type' in item && item.type === 'JOIN_REQUEST') {
                const joinRequest = item as JoinRequestItem;
                const avatarColor = generateColor(joinRequest.requesterId);
                const initials = getInitials(joinRequest.requesterName);

                return (
                  <div
                    key={joinRequest.id}
                    onClick={() => navigate(`/messenger?conversation=${joinRequest.conversationId}`)}
                    className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                      !joinRequest.isRead ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        {joinRequest.requesterAvatar ? (
                          <img
                            src={joinRequest.requesterAvatar}
                            alt={joinRequest.requesterName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {initials}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                          <Users className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base text-gray-900 leading-relaxed">
                          <span className="font-semibold">{joinRequest.requesterName}</span>{' '}
                          <span className="text-gray-600">{t('notificationDropdown.wantsJoinGroup')}</span>{' '}
                          <span className="font-semibold text-gray-900">{joinRequest.conversationName}</span>
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatTimeAgo(joinRequest.createdAt)}
                        </p>
                        {!joinRequest.isRead && (
                          <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAcceptJoinRequest(joinRequest);
                              }}
                              className="h-8 px-4 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {t('notificationDropdown.accept')}
                            </button>
                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRejectJoinRequest(joinRequest);
                              }}
                              className="h-8 px-4 bg-gray-100 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                            >
                              {t('notificationDropdown.reject')}
                            </button>
                          </div>
                        )}
                      </div>
                      {!joinRequest.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                      )}
                    </div>
                  </div>
                );
              }

              // Handle regular NotificationData
              const notification = item as NotificationData;
              const Icon = getNotificationIcon(notification.type);
              const actorName = notification.actorName || t('notificationDropdown.someone');
              const actorAvatar = notification.actorAvatar;
              const avatarColor = generateColor(notification.actorId || '');
              const initials = getInitials(actorName);
              
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      {actorAvatar ? (
                        <img
                          src={actorAvatar}
                          alt={actorName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {initials}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                        <Icon className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-900 leading-relaxed">
                        <span className="font-semibold">{actorName}</span>{' '}
                        <span className="text-gray-600">{notification.content}</span>
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                      {notification.type === 'FRIEND_REQUEST' && !notification.isRead && notification.relatedId && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcceptFriendRequest(notification);
                            }}
                            className="h-8 px-4 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {t('notificationDropdown.accept')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRejectFriendRequest(notification);
                            }}
                            className="h-8 px-4 bg-gray-100 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                          >
                            {t('notificationDropdown.delete')}
                          </button>
                        </div>
                      )}

                      {notification.type === 'GROUP_INVITE' && !notification.isRead && notification.relatedId && (
                        <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAcceptGroupInvite(notification);
                            }}
                            className="h-8 px-4 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {t('notificationDropdown.join')}
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRejectGroupInvite(notification);
                            }}
                            className="h-8 px-4 bg-gray-100 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                          >
                            {t('notificationDropdown.reject')}
                          </button>
                        </div>
                      )}
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100/80">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2.5 rounded-md hover:bg-blue-50/50 transition-colors"
        >
          {t('notificationDropdown.seeAll')}
        </Link>
      </div>
    </div>
  );
}
