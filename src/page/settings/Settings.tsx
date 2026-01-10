import { useState } from 'react';
import { Settings as SettingsIcon, Lock, Bell, Shield, User, Newspaper, Globe, Palette, CreditCard, Smartphone, Info, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('general');

  const menuItems = [
    { id: 'general', icon: SettingsIcon, label: 'General' },
    { id: 'security', icon: Lock, label: 'Security and Login' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'privacy', icon: Shield, label: 'Privacy' },
    { id: 'profile', icon: User, label: 'Profile and Tagging' },
    { id: 'newsfeed', icon: Newspaper, label: 'News Feed Preferences' },
    { id: 'language', icon: Globe, label: 'Language' },
    { id: 'display', icon: Palette, label: 'Display & Accessibility' },
    { id: 'payments', icon: CreditCard, label: 'Payments' },
    { id: 'apps', icon: Smartphone, label: 'Apps and Websites' },
    { id: 'support', icon: Info, label: 'Support' },
    { id: 'logout', icon: LogOut, label: 'Log Out' },
  ];

  const settings = [
    { label: 'Name', value: 'John Doe', editable: true },
    { label: 'Username', value: '@johndoe2026', editable: true },
    { label: 'Email', value: 'john.doe@email.com', editable: true },
    { label: 'Phone Number', value: '+1 (555) 123-4567', editable: true },
    { label: 'Birthday', value: 'January 15, 1990', editable: true },
    { label: 'Gender', value: 'Male', editable: true },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white shadow-sm p-4 shrink-0">
        <h1 className="text-lg font-bold text-[#050505] mb-6">Settings</h1>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
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
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-[#E7F3FF] text-[#1877F2]'
                    : 'hover:bg-[#F0F2F5] text-[#050505]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl">
          <h2 className="text-2xl font-bold text-[#050505] mb-6">General Account Settings</h2>

          {/* Settings List */}
          <div className="space-y-6">
            {settings.map((setting, index) => (
              <div key={index}>
                <label className="block text-base font-semibold text-[#050505] mb-2">
                  {setting.label}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={setting.value}
                    readOnly
                    className="w-full h-12 px-4 rounded-md border border-[#CCD0D5] bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:border-transparent"
                  />
                  {setting.editable && (
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#1877F2] font-semibold hover:underline">
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-[#E4E6EB] my-6"></div>

          {/* Account Actions */}
          <div>
            <h3 className="text-base font-semibold text-[#050505] mb-4">Account Status</h3>
            <div className="flex gap-4">
              <button className="flex-1 h-9 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors">
                Deactivate Account
              </button>
              <button className="flex-1 h-9 bg-[#FF4444] text-white font-semibold rounded-md hover:bg-[#E63333] transition-colors">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
