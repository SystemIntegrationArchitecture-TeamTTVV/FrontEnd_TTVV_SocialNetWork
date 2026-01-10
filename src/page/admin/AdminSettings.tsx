import { Save, Bell, Shield, Globe, Database, Server } from 'lucide-react';
import { useState } from 'react';

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    autoModeration: false,
    maintenanceMode: false,
    language: 'vi',
    timezone: 'Asia/Ho_Chi_Minh',
  });

  const settingGroups = [
    {
      title: 'Thông báo',
      icon: Bell,
      items: [
        { key: 'notifications', label: 'Bật thông báo hệ thống', type: 'toggle' },
        { key: 'emailAlerts', label: 'Gửi cảnh báo qua email', type: 'toggle' },
      ],
    },
    {
      title: 'Bảo mật',
      icon: Shield,
      items: [
        { key: 'autoModeration', label: 'Tự động kiểm duyệt nội dung', type: 'toggle' },
      ],
    },
    {
      title: 'Hệ thống',
      icon: Server,
      items: [
        { key: 'maintenanceMode', label: 'Chế độ bảo trì', type: 'toggle' },
        { key: 'language', label: 'Ngôn ngữ', type: 'select', options: ['vi', 'en'] },
        { key: 'timezone', label: 'Múi giờ', type: 'select', options: ['Asia/Ho_Chi_Minh', 'UTC'] },
      ],
    },
  ];

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt hệ thống</h1>
        <p className="text-lg text-gray-600">Cấu hình và quản lý cài đặt hệ thống</p>
      </div>

      <div className="space-y-6">
        {settingGroups.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{group.title}</h3>
              </div>

              <div className="space-y-5">
                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-lg text-gray-900 mb-1">{item.label}</p>
                      {item.type === 'toggle' && (
                        <p className="text-sm text-gray-500">
                          {settings[item.key as keyof typeof settings]
                            ? 'Đã bật'
                            : 'Đã tắt'}
                        </p>
                      )}
                    </div>
                    {item.type === 'toggle' ? (
                      <button
                        onClick={() => handleToggle(item.key)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        ></span>
                      </button>
                    ) : (
                      <select
                        value={settings[item.key as keyof typeof settings] as string}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, [item.key]: e.target.value }))
                        }
                        className="h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium cursor-pointer"
                      >
                        {item.options?.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors">
          Hủy
        </button>
        <button className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors flex items-center gap-2 shadow-sm">
          <Save className="w-5 h-5" />
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
