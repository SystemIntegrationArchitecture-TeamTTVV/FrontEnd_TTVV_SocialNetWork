import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Lock, Bell, Shield, Globe,
  Palette, LogOut, Loader2, Check, Moon, Sun, Eye, UserMinus,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi, type User as UserType } from '../../apis/users';
import { setAppLanguage, getCurrentAppLanguage, type AppLanguage } from '../../i18n';
import { useToast } from '../../contexts/useToast';

// ─── Types ───────────────────────────────────────────────────────────
type TabId = 'general' | 'security' | 'notifications' | 'privacy' | 'language' | 'display' | 'logout';

interface SettingField {
  key: string;
  labelKey: string;
  value: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'select';
  options?: { value: string; labelKey: string }[];
}

// ─── Component ───────────────────────────────────────────────────────
export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, refreshSessionUser, logout } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('general');
  const [profile, setProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [language, setLanguage] = useState<AppLanguage>(getCurrentAppLanguage());

  // Privacy settings (synced from profile)
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'PUBLIC',
    postVisibility: 'PUBLIC',
    showEmail: true,
    showPhone: true,
  });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Notification prefs (localStorage)
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('notifPrefs') || '{}');
    } catch { return {}; }
  });

  // ── Load profile ──────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return; }
    setLoading(true);
    usersApi.getUserById(currentUser.id)
      .then(u => {
        setProfile(u);
        setPrivacySettings({
          profileVisibility: u.profileVisibility || 'PUBLIC',
          postVisibility: u.postVisibility || 'PUBLIC',
          showEmail: u.showEmail !== false,
          showPhone: u.showPhone !== false,
        });
      })
      .catch(err => console.error('Failed to load profile', err))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // ── Menu items ────────────────────────────────────────────────────
  const menuItems: { id: TabId; icon: typeof SettingsIcon; labelKey: string }[] = [
    { id: 'general', icon: SettingsIcon, labelKey: 'settingsPage.menuGeneral' },
    { id: 'security', icon: Lock, labelKey: 'settingsPage.menuSecurity' },
    { id: 'notifications', icon: Bell, labelKey: 'settingsPage.menuNotifications' },
    { id: 'privacy', icon: Shield, labelKey: 'settingsPage.menuPrivacy' },
    { id: 'language', icon: Globe, labelKey: 'settingsPage.menuLanguage' },
    { id: 'display', icon: Palette, labelKey: 'settingsPage.menuDisplay' },
    { id: 'logout', icon: LogOut, labelKey: 'settingsPage.menuLogout' },
  ];

  // ── Build fields from real profile ────────────────────────────────
  const fields: SettingField[] = profile ? [
    { key: 'fullName', labelKey: 'settingsPage.fieldFullName', value: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() },
    { key: 'username', labelKey: 'settingsPage.fieldUsername', value: profile.username || '' },
    { key: 'email', labelKey: 'settingsPage.fieldEmail', value: profile.email || '', type: 'email' },
    { key: 'phoneNumber', labelKey: 'settingsPage.fieldPhone', value: profile.phoneNumber || '', type: 'tel' },
    { key: 'dateOfBirth', labelKey: 'settingsPage.fieldBirthday', value: profile.dateOfBirth || '', type: 'date' },
    {
      key: 'gender', labelKey: 'settingsPage.fieldGender', value: profile.gender || '', type: 'select',
      options: [
        { value: '', labelKey: 'profilePage.edit.genderPlaceholder' },
        { value: 'Nam', labelKey: 'settingsPage.genderMale' },
        { value: 'Nữ', labelKey: 'settingsPage.genderFemale' },
        { value: 'Khác', labelKey: 'profilePage.edit.genderOther' },
      ],
    },
  ] : [];

  // ── Inline edit handlers ──────────────────────────────────────────
  const startEdit = (key: string, current: string) => {
    setEditingField(key);
    setEditValues(prev => ({ ...prev, [key]: current }));
  };

  const cancelEdit = () => setEditingField(null);

  const saveField = async (key: string) => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      const val = editValues[key]?.trim() ?? '';
      const payload: Record<string, any> = {};

      if (key === 'fullName') {
        const parts = val.split(' ');
        payload.firstName = parts[0] || '';
        payload.lastName = parts.slice(1).join(' ') || '';
        payload.fullName = val;
      } else {
        payload[key] = val;
      }

      await usersApi.updateUserProfile(currentUser.id, payload);
      await refreshSessionUser();
      // Reload profile
      const fresh = await usersApi.getUserById(currentUser.id);
      setProfile(fresh);
      setEditingField(null);
      showToast(t('common.saveChanges') + ' ✓', 'success');
    } catch (err) {
      console.error('Save failed', err);
      showToast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Account actions ───────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!currentUser?.id) return;
    if (!window.confirm(t('settingsPage.deactivateConfirm'))) return;
    try {
      await usersApi.updateUserProfile(currentUser.id, { isActive: false });
      logout();
      navigate('/login');
    } catch { showToast(t('common.error'), 'error'); }
  };

  const handleDelete = async () => {
    if (!currentUser?.id) return;
    if (!window.confirm(t('settingsPage.deleteConfirm'))) return;
    try {
      await usersApi.deleteUser(currentUser.id);
      logout();
      navigate('/login');
    } catch { showToast(t('common.error'), 'error'); }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Notification toggle ───────────────────────────────────────────
  const toggleNotif = (key: string) => {
    setNotifPrefs((prev: Record<string, boolean>) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('notifPrefs', JSON.stringify(updated));
      return updated;
    });
  };

  // ── Language change ───────────────────────────────────────────────
  const handleLangChange = (lang: AppLanguage) => {
    setLanguage(lang);
    setAppLanguage(lang);
    showToast('✓', 'success');
  };

  // ── Theme change ──────────────────────────────────────────────────
  const handleThemeChange = (t: string) => {
    setTheme(t);
    localStorage.setItem('theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  };

  // ── Render tab content ────────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
    }

    switch (activeTab) {
      // ── General ─────────────────────────────────────────────────
      case 'general':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{t('settingsPage.accountTitle')}</h2>
            <div className="space-y-4">
              {fields.map(f => (
                <div key={f.key} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{t(f.labelKey)}</p>
                    {editingField === f.key ? (
                      <div className="flex items-center gap-2">
                        {f.type === 'select' ? (
                          <select
                            value={editValues[f.key] ?? f.value}
                            onChange={e => setEditValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                            className="flex-1 h-10 px-3 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            {f.options?.map(o => (
                              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={f.type || 'text'}
                            value={editValues[f.key] ?? f.value}
                            onChange={e => setEditValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                            autoFocus
                            className="flex-1 h-10 px-3 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        )}
                        <button
                          onClick={() => saveField(f.key)}
                          disabled={saving}
                          className="h-10 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium flex items-center gap-1"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button onClick={cancelEdit} className="h-10 px-3 text-gray-600 hover:text-gray-900 text-sm font-medium">
                          {t('common.cancel')}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-900 font-medium truncate">{f.value || '—'}</p>
                    )}
                  </div>
                  {editingField !== f.key && (
                    <button
                      onClick={() => startEdit(f.key, f.value)}
                      className="text-sm text-blue-600 font-medium hover:text-blue-700 shrink-0"
                    >
                      {t('settingsPage.edit')}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 mt-8 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('settingsPage.accountStatusTitle')}</h3>
              <div className="flex gap-3">
                <button onClick={handleDeactivate} className="flex-1 h-10 bg-gray-100 text-gray-700 font-medium text-sm rounded-xl hover:bg-gray-200 transition-colors">
                  {t('settingsPage.deactivateAccount')}
                </button>
                <button onClick={handleDelete} className="flex-1 h-10 bg-red-50 text-red-600 font-medium text-sm rounded-xl hover:bg-red-100 transition-colors">
                  {t('settingsPage.deleteAccount')}
                </button>
              </div>
            </div>
          </div>
        );

      // ── Security ────────────────────────────────────────────────
      case 'security':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settingsPage.menuSecurity')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('settingsPage.securityDesc')}</p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="font-medium text-gray-900 mb-1">{t('settingsPage.changePassword')}</p>
                <p className="text-sm text-gray-500 mb-3">{t('settingsPage.changePasswordDesc')}</p>
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('settingsPage.changePassword')}
                </button>
              </div>
              <div className="p-4 rounded-xl bg-gray-50">
                <p className="font-medium text-gray-900 mb-1">{t('settingsPage.loginHistory')}</p>
                <p className="text-sm text-gray-500">{t('settingsPage.loginHistoryDesc')}</p>
              </div>
            </div>
          </div>
        );

      // ── Notifications ───────────────────────────────────────────
      case 'notifications':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settingsPage.menuNotifications')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('settingsPage.notifDesc')}</p>
            <div className="space-y-3">
              {[
                { key: 'push', labelKey: 'settingsPage.notifPush', descKey: 'settingsPage.notifPushDesc' },
                { key: 'email', labelKey: 'settingsPage.notifEmail', descKey: 'settingsPage.notifEmailDesc' },
                { key: 'comments', labelKey: 'settingsPage.notifComments', descKey: 'settingsPage.notifCommentsDesc' },
                { key: 'likes', labelKey: 'settingsPage.notifLikes', descKey: 'settingsPage.notifLikesDesc' },
                { key: 'friendReq', labelKey: 'settingsPage.notifFriendReq', descKey: 'settingsPage.notifFriendReqDesc' },
                { key: 'messages', labelKey: 'settingsPage.notifMessages', descKey: 'settingsPage.notifMessagesDesc' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{t(n.labelKey)}</p>
                    <p className="text-xs text-gray-500">{t(n.descKey)}</p>
                  </div>
                  <button
                    onClick={() => toggleNotif(n.key)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${notifPrefs[n.key] !== false ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${notifPrefs[n.key] !== false ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      // ── Privacy (inline) ──────────────────────────────────────
      case 'privacy': {
        const visOpts = [
          { value: 'PUBLIC', labelKey: 'privacySettings.visibilityPublic', icon: Globe },
          { value: 'FRIENDS', labelKey: 'privacySettings.visibilityFriends', icon: Shield },
          { value: 'PRIVATE', labelKey: 'privacySettings.visibilityOnlyMe', icon: Lock },
        ];
        const handlePrivacyChange = (key: string, val: string | boolean) => setPrivacySettings(prev => ({ ...prev, [key]: val }));
        const savePrivacy = async () => {
          if (!currentUser?.id) return;
          setSavingPrivacy(true);
          try {
            await usersApi.updateUserProfile(currentUser.id, {
              profileVisibility: privacySettings.profileVisibility as any,
              postVisibility: privacySettings.postVisibility as any,
              showEmail: privacySettings.showEmail,
              showPhone: privacySettings.showPhone,
            });
            await refreshSessionUser();
            showToast(t('privacySettings.saveChanges') + ' ✓', 'success');
          } catch { showToast(t('common.error'), 'error'); }
          finally { setSavingPrivacy(false); }
        };
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('privacySettings.pageTitle')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('privacySettings.pageSubtitle')}</p>

            {/* Profile visibility */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-semibold text-gray-900">{t('privacySettings.sectionProfileTitle')}</span>
              </div>
              <div className="flex gap-2">
                {visOpts.map(o => {
                  const I = o.icon; const active = privacySettings.profileVisibility === o.value;
                  return (
                    <button key={o.value} onClick={() => handlePrivacyChange('profileVisibility', o.value)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <I className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>{t(o.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Post visibility */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-semibold text-gray-900">{t('privacySettings.sectionWhoCanSeePostsTitle')}</span>
              </div>
              <div className="flex gap-2">
                {visOpts.map(o => {
                  const I = o.icon; const active = privacySettings.postVisibility === o.value;
                  return (
                    <button key={o.value} onClick={() => handlePrivacyChange('postVisibility', o.value)}
                      className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <I className={`w-4 h-4 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${active ? 'text-purple-600' : 'text-gray-600'}`}>{t(o.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact toggles */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <UserMinus className="w-5 h-5 text-green-500" />
                <span className="text-sm font-semibold text-gray-900">{t('privacySettings.contactInfoTitle')}</span>
              </div>
              {(['showEmail', 'showPhone'] as const).map(key => (
                <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 mb-2">
                  <span className="text-sm text-gray-700 font-medium">{t(`privacySettings.${key}`)}</span>
                  <button onClick={() => handlePrivacyChange(key, !privacySettings[key])}
                    className={`w-12 h-7 rounded-full transition-colors relative ${privacySettings[key] ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <span className={`block w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${privacySettings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button onClick={savePrivacy} disabled={savingPrivacy}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium text-sm transition-colors flex items-center gap-2">
                {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {t('privacySettings.saveChanges')}
              </button>
            </div>
          </div>
        );
      }

      // ── Language ────────────────────────────────────────────────
      case 'language':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settingsPage.menuLanguage')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('settingsPage.languageDesc')}</p>
            <div className="space-y-2">
              {([
                { code: 'vi' as AppLanguage, label: '🇻🇳 Tiếng Việt' },
                { code: 'en' as AppLanguage, label: '🇺🇸 English' },
                { code: 'ja' as AppLanguage, label: '🇯🇵 日本語' },
              ]).map(l => (
                <button
                  key={l.code}
                  onClick={() => handleLangChange(l.code)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                    language === l.code
                      ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <span className="font-medium">{l.label}</span>
                  {language === l.code && <Check className="w-5 h-5 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        );

      // ── Display ─────────────────────────────────────────────────
      case 'display':
        return (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('settingsPage.menuDisplay')}</h2>
            <p className="text-sm text-gray-500 mb-6">{t('settingsPage.displayDesc')}</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${theme === 'light' ? 'text-blue-700' : 'text-gray-700'}`}>
                  {t('navbar.themeLight')}
                </span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                }`}
              >
                <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className={`font-medium ${theme === 'dark' ? 'text-blue-700' : 'text-gray-700'}`}>
                  {t('navbar.themeDark')}
                </span>
              </button>
            </div>
          </div>
        );

      // ── Logout ──────────────────────────────────────────────────
      case 'logout':
        return (
          <div className="text-center py-12">
            <LogOut className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">{t('settingsPage.logoutConfirm')}</p>
            <button
              onClick={handleLogout}
              className="px-8 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
            >
              {t('settingsPage.menuLogout')}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white shadow-sm shrink-0 border-r border-gray-100">
        <div className="p-5">
          <h1 className="text-lg font-bold text-gray-900 mb-4">{t('settingsPage.title')}</h1>

          {/* User card */}
          {profile && (
            <Link to={`/profile/${currentUser?.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (profile.firstName?.[0] || 'U').toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{profile.fullName || profile.username}</p>
                <p className="text-xs text-gray-500 truncate">{t('settingsPage.menuProfile')}</p>
              </div>
            </Link>
          )}

          <div className="space-y-1">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const isLogout = item.id === 'logout';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : isLogout
                        ? 'hover:bg-red-50 text-red-500'
                        : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isActive ? 'bg-blue-500 text-white' : isLogout ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : ''}`}>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-3xl border border-gray-100">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
