import { Save, Bell, Shield, Server } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminSettings() {
  const { t } = useTranslation();
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
      titleKey: 'adminPanel.settingsPage.groupNotifications',
      icon: Bell,
      items: [
        { key: 'notifications', labelKey: 'adminPanel.settingsPage.notifySystem', type: 'toggle' as const },
        { key: 'emailAlerts', labelKey: 'adminPanel.settingsPage.emailAlerts', type: 'toggle' as const },
      ],
    },
    {
      titleKey: 'adminPanel.settingsPage.groupSecurity',
      icon: Shield,
      items: [
        { key: 'autoModeration', labelKey: 'adminPanel.settingsPage.autoModeration', type: 'toggle' as const },
      ],
    },
    {
      titleKey: 'adminPanel.settingsPage.groupSystem',
      icon: Server,
      items: [
        { key: 'maintenanceMode', labelKey: 'adminPanel.settingsPage.maintenanceMode', type: 'toggle' as const },
        { key: 'language', labelKey: 'adminPanel.settingsPage.language', type: 'select' as const, options: ['vi', 'en', 'ja'] },
        { key: 'timezone', labelKey: 'adminPanel.settingsPage.timezone', type: 'select' as const, options: ['Asia/Ho_Chi_Minh', 'UTC'] },
      ],
    },
  ];

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('adminPanel.settingsPage.pageTitle')}</h1>
        <p className="text-lg text-gray-600">{t('adminPanel.settingsPage.pageSubtitle')}</p>
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
                <h3 className="text-2xl font-bold text-gray-900">{t(group.titleKey)}</h3>
              </div>

              <div className="space-y-5">
                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-lg text-gray-900 mb-1">{t(item.labelKey)}</p>
                      {item.type === 'toggle' && (
                        <p className="text-sm text-gray-500">
                          {settings[item.key as keyof typeof settings]
                            ? t('adminPanel.settingsPage.toggleOn')
                            : t('adminPanel.settingsPage.toggleOff')}
                        </p>
                      )}
                    </div>
                    {item.type === 'toggle' ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(item.key)}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                            settings[item.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
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
                            {item.key === 'language'
                              ? opt === 'vi'
                                ? t('navbar.vietnamese')
                                : opt === 'en'
                                  ? t('navbar.english')
                                  : opt === 'ja'
                                    ? t('navbar.japanese')
                                    : opt
                              : opt}
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
        <button type="button" className="px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors">
          {t('adminPanel.settingsPage.cancel')}
        </button>
        <button type="button" className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors flex items-center gap-2 shadow-sm">
          <Save className="w-5 h-5" />
          {t('adminPanel.settingsPage.saveChanges')}
        </button>
      </div>
    </div>
  );
}
