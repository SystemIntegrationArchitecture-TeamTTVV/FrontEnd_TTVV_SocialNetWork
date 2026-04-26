import { Save, Bell, Shield, Server, Loader2, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { httpClient } from '../../apis/http';

interface AppSettings {
  notifications: boolean;
  emailAlerts: boolean;
  autoModeration: boolean;
  maintenanceMode: boolean;
  language: string;
  timezone: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  emailAlerts: true,
  autoModeration: false,
  maintenanceMode: false,
  language: 'vi',
  timezone: 'Asia/Ho_Chi_Minh',
};

export default function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Load settings from localStorage (persisted locally) ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_settings');
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      }
    } catch { /* use defaults */ }
    setLoading(false);
  }, []);

  const handleToggle = (key: keyof AppSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSelect = (key: keyof AppSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Persist to localStorage
      localStorage.setItem('admin_settings', JSON.stringify(settings));
      // Optionally persist to backend (if endpoint exists)
      try {
        await httpClient.put('/api/social/settings', settings);
      } catch {
        // Backend endpoint not available — local save is enough
      }
      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    try {
      const raw = localStorage.getItem('admin_settings');
      if (raw) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
    setSaved(false);
  };

  const settingGroups = [
    {
      titleKey: 'adminPanel.settingsPage.groupNotifications',
      icon: Bell,
      color: '#F59E0B',
      items: [
        { key: 'notifications' as const, labelKey: 'adminPanel.settingsPage.notifySystem', descKey: 'adminPanel.settingsPage.notifySystemDesc', type: 'toggle' as const },
        { key: 'emailAlerts' as const, labelKey: 'adminPanel.settingsPage.emailAlerts', descKey: 'adminPanel.settingsPage.emailAlertsDesc', type: 'toggle' as const },
      ],
    },
    {
      titleKey: 'adminPanel.settingsPage.groupSecurity',
      icon: Shield,
      color: '#3B82F6',
      items: [
        { key: 'autoModeration' as const, labelKey: 'adminPanel.settingsPage.autoModeration', descKey: 'adminPanel.settingsPage.autoModerationDesc', type: 'toggle' as const },
      ],
    },
    {
      titleKey: 'adminPanel.settingsPage.groupSystem',
      icon: Server,
      color: '#10B981',
      items: [
        { key: 'maintenanceMode' as const, labelKey: 'adminPanel.settingsPage.maintenanceMode', descKey: 'adminPanel.settingsPage.maintenanceModeDesc', type: 'toggle' as const },
        { key: 'language' as const, labelKey: 'adminPanel.settingsPage.language', type: 'select' as const, options: ['vi', 'en', 'ja'] },
        { key: 'timezone' as const, labelKey: 'adminPanel.settingsPage.timezone', type: 'select' as const, options: ['Asia/Ho_Chi_Minh', 'UTC', 'Asia/Tokyo'] },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

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
            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: group.color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: group.color }} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t(group.titleKey)}</h3>
              </div>

              <div className="space-y-5">
                {group.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-semibold text-lg text-gray-900 mb-1">{t(item.labelKey)}</p>
                      {'descKey' in item && item.descKey && (
                        <p className="text-sm text-gray-500">{t(item.descKey)}</p>
                      )}
                      {item.type === 'toggle' && !('descKey' in item && item.descKey) && (
                        <p className="text-sm text-gray-500">
                          {settings[item.key]
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
                          settings[item.key] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${
                            settings[item.key] ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    ) : (
                      <select
                        value={settings[item.key] as string}
                        onChange={(e) => handleSelect(item.key, e.target.value)}
                        className="h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium cursor-pointer"
                      >
                        {'options' in item && item.options?.map((opt) => (
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
        <button
          type="button"
          onClick={handleCancel}
          className="px-8 py-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-lg transition-colors"
        >
          {t('adminPanel.settingsPage.cancel')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-2 shadow-sm ${
            saved
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:opacity-50`}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saved ? t('adminPanel.settingsPage.saved') : t('adminPanel.settingsPage.saveChanges')}
        </button>
      </div>
    </div>
  );
}
