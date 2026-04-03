import { useState } from 'react';
import { Settings as SettingsIcon, Lock, Bell, Shield, User, Newspaper, Globe, Palette, CreditCard, Smartphone, Info, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('general');

  const menuItems = [
    { id: 'general', icon: SettingsIcon, labelKey: 'settingsPage.menuGeneral' },
    { id: 'security', icon: Lock, labelKey: 'settingsPage.menuSecurity' },
    { id: 'notifications', icon: Bell, labelKey: 'settingsPage.menuNotifications' },
    { id: 'privacy', icon: Shield, labelKey: 'settingsPage.menuPrivacy' },
    { id: 'profile', icon: User, labelKey: 'settingsPage.menuProfile' },
    { id: 'newsfeed', icon: Newspaper, labelKey: 'settingsPage.menuNewsfeed' },
    { id: 'language', icon: Globe, labelKey: 'settingsPage.menuLanguage' },
    { id: 'display', icon: Palette, labelKey: 'settingsPage.menuDisplay' },
    { id: 'payments', icon: CreditCard, labelKey: 'settingsPage.menuPayments' },
    { id: 'apps', icon: Smartphone, labelKey: 'settingsPage.menuApps' },
    { id: 'support', icon: Info, labelKey: 'settingsPage.menuSupport' },
    { id: 'logout', icon: LogOut, labelKey: 'settingsPage.menuLogout' },
  ];

  const settings = [
    { labelKey: 'settingsPage.fieldFullName', value: 'John Doe', editable: true },
    { labelKey: 'settingsPage.fieldUsername', value: '@johndoe2026', editable: true },
    { labelKey: 'settingsPage.fieldEmail', value: 'john.doe@email.com', editable: true },
    { labelKey: 'settingsPage.fieldPhone', value: '+84 123 456 789', editable: true },
    { labelKey: 'settingsPage.fieldBirthday', value: '15/01/1990', editable: true },
    { labelKey: 'settingsPage.fieldGender', valueKey: 'settingsPage.genderMale', editable: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-80 bg-white shadow-sm shrink-0 border-r border-gray-100">
        <div className="p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-5">{t('settingsPage.title')}</h1>

          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.id === 'privacy' ? '/settings/privacy' : '#'}
                  onClick={(e) => {
                    if (item.id !== 'privacy') {
                      e.preventDefault();
                      setActiveSection(item.id);
                    }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className={`text-[15px] font-medium ${isActive ? 'text-blue-700' : ''}`}>{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="flex-1 p-8">
        <div className="bg-white rounded-[28px] shadow-sm p-8 max-w-4xl border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('settingsPage.accountTitle')}</h2>

          <div className="space-y-5">
            {settings.map((setting, index) => (
              <div key={index}>
                <label className="block text-[15px] font-medium text-gray-500 mb-2">
                  {t(setting.labelKey)}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={'valueKey' in setting ? t(setting.valueKey) : setting.value}
                    readOnly
                    className="w-full h-12 px-4 rounded-2xl border border-gray-200 bg-slate-50 text-gray-900 text-[15px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                  {setting.editable && (
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                      {t('settingsPage.edit')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 my-8" />

          <div>
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">{t('settingsPage.accountStatusTitle')}</h3>
            <div className="flex gap-3">
              <button type="button" className="flex-1 h-11 bg-gray-100 text-gray-700 font-medium text-[15px] rounded-2xl hover:bg-gray-200 transition-colors">
                {t('settingsPage.deactivateAccount')}
              </button>
              <button type="button" className="flex-1 h-11 bg-red-500 text-white font-medium text-[15px] rounded-2xl hover:bg-red-600 transition-colors shadow-sm">
                {t('settingsPage.deleteAccount')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
