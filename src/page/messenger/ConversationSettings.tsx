import { useState } from 'react';
import { Bell, BellOff, Volume2, Image, Lock, Trash2 } from 'lucide-react';

export default function ConversationSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    mute: false,
    mediaVisibility: true,
    readReceipts: true,
  });

  const participants = [
    { id: 1, name: 'Alex Chen', avatar: 'AC', color: '#1877F2', online: true, role: 'admin' },
    { id: 2, name: 'Maria Garcia', avatar: 'MG', color: '#42B72A', online: true, role: 'member' },
    { id: 3, name: 'David Kim', avatar: 'DK', color: '#FF6B6B', online: false, role: 'member' },
  ];

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt cuộc trò chuyện</h1>
          <p className="text-sm text-gray-600">Quản lý cài đặt cho cuộc trò chuyện này</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Notifications */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Thông báo</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Thông báo</p>
                  <p className="text-sm text-gray-600">Nhận thông báo cho cuộc trò chuyện này</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notifications')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Âm thanh</p>
                  <p className="text-sm text-gray-600">Phát âm thanh khi có tin nhắn mới</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('sound')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.sound ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.sound ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <BellOff className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Tắt tiếng</p>
                  <p className="text-sm text-gray-600">Tạm thời tắt thông báo</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('mute')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.mute ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.mute ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Media</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Image className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Hiển thị media</p>
                  <p className="text-sm text-gray-600">Hiển thị ảnh và video trong cuộc trò chuyện</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('mediaVisibility')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.mediaVisibility ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.mediaVisibility ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quyền riêng tư</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Đã đọc</p>
                  <p className="text-sm text-gray-600">Gửi xác nhận đã đọc tin nhắn</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('readReceipts')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.readReceipts ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.readReceipts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Thành viên</h2>
            <span className="text-base text-gray-600">{participants.length} người</span>
          </div>
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base"
                    style={{ backgroundColor: participant.color }}
                  >
                    {participant.avatar}
                  </div>
                  {participant.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-base text-gray-900">{participant.name}</p>
                  <p className="text-sm text-gray-500">{participant.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">Khu vực nguy hiểm</h2>
          <button className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-red-200 hover:bg-red-50 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-lg text-red-600">Xóa cuộc trò chuyện</p>
              <p className="text-sm text-gray-600">Xóa vĩnh viễn cuộc trò chuyện này</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
