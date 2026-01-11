import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, Smartphone, Globe, Users, MessageSquare, Heart, Share2, UserPlus } from 'lucide-react';
import { useState } from 'react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    postNotifications: true,
    commentNotifications: true,
    likeNotifications: true,
    shareNotifications: true,
    friendRequestNotifications: true,
    messageNotifications: true,
    eventNotifications: true,
    groupNotifications: true,
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  const notificationGroups = [
    {
      title: 'Thông báo chung',
      icon: Bell,
      items: [
        { key: 'pushNotifications', label: 'Thông báo đẩy', description: 'Nhận thông báo trên trình duyệt' },
        { key: 'emailNotifications', label: 'Thông báo qua email', description: 'Nhận thông báo qua email' },
        { key: 'smsNotifications', label: 'Thông báo qua SMS', description: 'Nhận thông báo qua tin nhắn' },
      ],
    },
    {
      title: 'Hoạt động trên bài viết',
      icon: Share2,
      items: [
        { key: 'postNotifications', label: 'Bài viết mới', description: 'Khi bạn bè đăng bài viết mới' },
        { key: 'commentNotifications', label: 'Bình luận', description: 'Khi có người bình luận bài viết của bạn' },
        { key: 'likeNotifications', label: 'Lượt thích', description: 'Khi có người thích bài viết của bạn' },
        { key: 'shareNotifications', label: 'Chia sẻ', description: 'Khi có người chia sẻ bài viết của bạn' },
      ],
    },
    {
      title: 'Mạng xã hội',
      icon: Users,
      items: [
        { key: 'friendRequestNotifications', label: 'Lời mời kết bạn', description: 'Khi có người gửi lời mời kết bạn' },
        { key: 'messageNotifications', label: 'Tin nhắn', description: 'Khi có tin nhắn mới' },
        { key: 'eventNotifications', label: 'Sự kiện', description: 'Thông báo về sự kiện sắp tới' },
        { key: 'groupNotifications', label: 'Nhóm', description: 'Hoạt động trong các nhóm bạn tham gia' },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/settings"
          className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cài đặt thông báo</h1>
          <p className="text-base text-gray-600 mt-1">Quản lý cách bạn nhận thông báo</p>
        </div>
      </div>

      <div className="space-y-6">
        {notificationGroups.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
              </div>

              <div className="space-y-5">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-gray-900 mb-1">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleToggle(item.key)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings]
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings[item.key as keyof typeof settings]
                            ? 'translate-x-6'
                            : 'translate-x-0'
                        }`}
                      ></span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end mt-8">
        <button className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors shadow-lg">
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
