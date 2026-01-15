import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, UserPlus, Tag, Clock, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  user: { name: string; avatar: string; color: string } | null;
  action: string;
  time: string;
  read: boolean;
  icon: any;
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'like',
      user: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
      action: 'liked your post.',
      time: '2m ago',
      read: false,
      icon: Heart,
    },
    {
      id: 2,
      type: 'comment',
      user: { name: 'Mike Chen', avatar: 'MC', color: '#FF6B6B' },
      action: 'commented: "Awesome photo!"',
      time: '15m ago',
      read: false,
      icon: MessageCircle,
    },
    {
      id: 3,
      type: 'share',
      user: { name: 'Emma Davis', avatar: 'ED', color: '#4ECDC4' },
      action: 'shared your post.',
      time: '1h ago',
      read: false,
      icon: Share2,
    },
    {
      id: 4,
      type: 'friend_request',
      user: { name: 'Alex Rodriguez', avatar: 'AR', color: '#FFD93D' },
      action: 'sent you a friend request.',
      time: '3h ago',
      read: true,
      icon: UserPlus,
    },
    {
      id: 5,
      type: 'reaction',
      user: { name: 'Lisa Wang', avatar: 'LW', color: '#A8E6CF' },
      action: 'reacted to your comment.',
      time: '5h ago',
      read: true,
      icon: Heart,
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[480px] bg-white rounded-xl shadow-xl border border-gray-100/50 z-50 max-h-[600px] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100/50">
        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors">
              Mark all read
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
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <p className="text-base">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer ${
                    !notification.read ? 'bg-blue-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {notification.user ? (
                      <div className="relative shrink-0">
                        <div
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                          style={{ backgroundColor: notification.user.color }}
                        >
                          {notification.user.avatar}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-sm">
                          <Icon className="w-3 h-3 text-gray-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-gray-900 leading-relaxed">
                        {notification.user ? (
                          <>
                            <span className="font-semibold">{notification.user.name}</span>{' '}
                            <span className="text-gray-600">{notification.action}</span>
                          </>
                        ) : (
                          <span className="text-gray-600">{notification.action}</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">{notification.time}</p>
                      {notification.type === 'friend_request' && (
                        <div className="flex gap-2 mt-3">
                          <button className="h-8 px-4 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors">
                            Confirm
                          </button>
                          <button className="h-8 px-4 bg-gray-100 text-gray-600 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors">
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    {!notification.read && (
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
      <div className="p-3 border-t border-gray-100/50">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2.5 rounded-md hover:bg-blue-50/50 transition-colors"
        >
          See all notifications
        </Link>
      </div>
    </div>
  );
}

