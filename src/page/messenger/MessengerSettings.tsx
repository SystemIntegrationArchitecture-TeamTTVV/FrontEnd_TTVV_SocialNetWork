import { Bell, Lock, Palette, Download, Shield, Globe, Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentAppLanguage, setAppLanguage, type AppLanguage } from '../../i18n';

export default function MessengerSettings() {
  const { t } = useTranslation();
  const language = getCurrentAppLanguage();
  const [settings, setSettings] = useState({
    notifications: true,
    sound: true,
    activeStatus: true,
    readReceipts: true,
    theme: 'light',
  });

  const handleToggle = (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key as keyof typeof settings] }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('messengerSettings.title')}</h1>
          <p className="text-sm text-gray-600">{t('messengerSettings.subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('messengerSettings.notificationsSection')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.notificationsTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.notificationsDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('notifications')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <Bell className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.soundTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.soundDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('sound')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.sound ? 'bg-green-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.sound ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('messengerSettings.privacySection')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.activeStatusTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.activeStatusDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('activeStatus')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.activeStatus ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.activeStatus ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.readReceiptsTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.readReceiptsDesc')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('readReceipts')}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.readReceipts ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    settings.readReceipts ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('messengerSettings.appearanceSection')}</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.themeTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.themeDesc')}</p>
                </div>
              </div>
              <div className="flex gap-3 ml-16">
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'light')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'light'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Sun className={`w-6 h-6 mx-auto mb-2 ${settings.theme === 'light' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-base ${settings.theme === 'light' ? 'text-blue-600' : 'text-gray-700'}`}>
                    {t('messengerSettings.themeLight')}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange('theme', 'dark')}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === 'dark'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Moon className={`w-6 h-6 mx-auto mb-2 ${settings.theme === 'dark' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-base ${settings.theme === 'dark' ? 'text-blue-600' : 'text-gray-700'}`}>
                    {t('messengerSettings.themeDark')}
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
                  <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.languageTitle')}</p>
                  <p className="text-sm text-gray-600">{t('messengerSettings.languageDesc')}</p>
                </div>
              </div>
              <select
                value={language}
                onChange={(e) => setAppLanguage(e.target.value as AppLanguage)}
                className="ml-16 w-full max-w-xs h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
              >
                <option value="vi">{t('navbar.vietnamese')}</option>
                <option value="en">{t('navbar.english')}</option>
                <option value="ja">{t('navbar.japanese')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('messengerSettings.dataSection')}</h2>
          <div className="space-y-3">
            <button type="button" className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.downloadTitle')}</p>
                <p className="text-sm text-gray-600">{t('messengerSettings.downloadDesc')}</p>
              </div>
            </button>

            <button type="button" className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-lg text-gray-900">{t('messengerSettings.securityTitle')}</p>
                <p className="text-sm text-gray-600">{t('messengerSettings.securityDesc')}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
