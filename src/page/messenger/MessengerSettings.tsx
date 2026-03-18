import { Bell, Lock, Palette, Download, Shield, Globe, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

export default function MessengerSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    activeStatus: true,
    readReceipts: true,
    theme: 'light',
    language: 'vi',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt Messenger</h1>
          <p className="text-sm text-gray-600">Quản lý cài đặt tin nhắn của bạn</p>
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
                  <p className="text-sm text-gray-600">Nhận thông báo tin nhắn mới</p>
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
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Âm thanh</p>
                  <p className="text-sm text-gray-600">Phát âm thanh khi có tin nhắn</p>
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
          </div>
        </div>

        {/* Privacy */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quyền riêng tư</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Trạng thái hoạt động</p>
                  <p className="text-sm text-gray-600">Hiển thị khi bạn đang online</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('activeStatus')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.activeStatus ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.activeStatus ? 'translate-x-6' : 'translate-x-0'
                  }`}
                ></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Đã đọc</p>
                  <p className="text-sm text-gray-600">Gửi xác nhận đã đọc</p>
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

        {/* Appearance */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Giao diện</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Chủ đề</p>
                  <p className="text-sm text-gray-600">Chọn chủ đề giao diện</p>
                </div>
              </div>
              <div className="flex gap-3 ml-16">
                <button
                  onClick={() => handleChange('theme', 'light')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className={`w-6 h-6 mx-auto mb-2 ${settings.theme === 'light' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-base ${settings.theme === 'light' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Sáng
                  </p>
                </button>
                <button
                  onClick={() => handleChange('theme', 'dark')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className={`w-6 h-6 mx-auto mb-2 ${settings.theme === 'dark' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-base ${settings.theme === 'dark' ? 'text-blue-600' : 'text-gray-700'}`}>
                    Tối
                  </p>
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">Ngôn ngữ</p>
                  <p className="text-sm text-gray-600">Chọn ngôn ngữ hiển thị</p>
                </div>
              </div>
              <select
                value={settings.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="ml-16 w-full max-w-xs h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
              >
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data */}
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Dữ liệu</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-lg text-gray-900">Tải dữ liệu</p>
                <p className="text-sm text-gray-600">Tải xuống tất cả tin nhắn và media của bạn</p>
              </div>
            </button>

            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-lg text-gray-900">Bảo mật</p>
                <p className="text-sm text-gray-600">Quản lý bảo mật và mã hóa</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
