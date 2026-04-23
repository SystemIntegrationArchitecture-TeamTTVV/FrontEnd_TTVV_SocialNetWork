import { Link, useNavigate } from 'react-router-dom';
import { Globe, Users, Lock, Eye, UserMinus, UserPlus, Loader2, ArrowLeft, Check, MessageCircle, Phone, UsersRound } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../apis/users';
import { useToast } from '../../contexts/useToast';

export default function PrivacySettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser, refreshSessionUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    profileVisibility: 'PUBLIC' as string,
    postVisibility: 'PUBLIC' as string,
    showEmail: true,
    showPhone: true,
    allowMessageFrom: 'EVERYONE' as string,
    allowCallFrom: 'EVERYONE' as string,
    allowGroupInviteFrom: 'EVERYONE' as string,
  });

  // ── Load real data ──────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.id) { setLoading(false); return; }
    usersApi.getUserById(currentUser.id)
      .then(profile => {
        setSettings({
          profileVisibility: profile.profileVisibility || 'PUBLIC',
          postVisibility: profile.postVisibility || 'PUBLIC',
          showEmail: profile.showEmail !== false,
          showPhone: profile.showPhone !== false,
          allowMessageFrom: profile.allowMessageFrom || 'EVERYONE',
          allowCallFrom: profile.allowCallFrom || 'EVERYONE',
          allowGroupInviteFrom: profile.allowGroupInviteFrom || 'EVERYONE',
        });
      })
      .catch(err => console.error('Failed to load privacy settings', err))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  // ── Save real data ──────────────────────────────────────────────
  const handleSave = async () => {
    if (!currentUser?.id) return;
    setSaving(true);
    try {
      await usersApi.updateUserProfile(currentUser.id, {
        profileVisibility: settings.profileVisibility as any,
        postVisibility: settings.postVisibility as any,
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
        allowMessageFrom: settings.allowMessageFrom as any,
        allowCallFrom: settings.allowCallFrom as any,
        allowGroupInviteFrom: settings.allowGroupInviteFrom as any,
      });
      await refreshSessionUser();
      showToast(t('privacySettings.saveChanges') + ' ✓', 'success');
    } catch (err) {
      console.error('Save failed', err);
      showToast(t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const visibilityOptions = [
    { value: 'PUBLIC', labelKey: 'privacySettings.visibilityPublic', icon: Globe, color: 'blue' },
    { value: 'FRIENDS', labelKey: 'privacySettings.visibilityFriends', icon: Users, color: 'green' },
    { value: 'PRIVATE', labelKey: 'privacySettings.visibilityOnlyMe', icon: Lock, color: 'orange' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('settingsPage.title')}
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{t('privacySettings.pageTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('privacySettings.pageSubtitle')}</p>
      </div>

      <div className="space-y-5">
        {/* Profile Visibility */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{t('privacySettings.sectionProfileTitle')}</h2>
              <p className="text-xs text-gray-500">{t('privacySettings.sectionProfileDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {visibilityOptions.map(opt => {
              const Icon = opt.icon;
              const active = settings.profileVisibility === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange('profileVisibility', opt.value)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                    active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${active ? 'text-blue-600' : 'text-gray-600'}`}>
                    {t(opt.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Post Visibility */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{t('privacySettings.sectionWhoCanSeePostsTitle')}</h2>
              <p className="text-xs text-gray-500">{t('privacySettings.sectionWhoCanSeePostsDesc')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {visibilityOptions.map(opt => {
              const Icon = opt.icon;
              const active = settings.postVisibility === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleChange('postVisibility', opt.value)}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                    active ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${active ? 'text-purple-600' : 'text-gray-600'}`}>
                    {t(opt.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Show Email / Phone toggles */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">{t('privacySettings.contactInfoTitle')}</h2>
          </div>

          {([
            { key: 'showEmail', labelKey: 'profilePage.edit.showEmail' },
            { key: 'showPhone', labelKey: 'profilePage.edit.showPhone' },
          ] as const).map(toggle => (
            <div key={toggle.key} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700 font-medium">{t(toggle.labelKey)}</span>
              <button
                onClick={() => handleChange(toggle.key, !(settings as any)[toggle.key])}
                className={`w-12 h-7 rounded-full transition-colors relative ${(settings as any)[toggle.key] ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow absolute top-1 transition-transform ${(settings as any)[toggle.key] ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>

        {/* ── Messaging & Call Privacy ──────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Tin nhắn & Cuộc gọi</h2>
              <p className="text-xs text-gray-500">Kiểm soát ai có thể liên hệ với bạn</p>
            </div>
          </div>

          {/* Allow Message From */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
              <span className="text-sm font-semibold text-gray-800">Ai có thể nhắn tin cho bạn?</span>
            </div>
            <div className="flex gap-2">
              {([{ value: 'EVERYONE', label: 'Mọi người', icon: Globe, color: 'blue' }, { value: 'FRIENDS_ONLY', label: 'Chỉ bạn bè', icon: Users, color: 'green' }] as const).map(opt => {
                const Icon = opt.icon;
                const active = settings.allowMessageFrom === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('allowMessageFrom', opt.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      active ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${active ? 'text-indigo-600' : 'text-gray-600'}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allow Call From */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Phone className="w-4 h-4 text-teal-500" />
              <span className="text-sm font-semibold text-gray-800">Ai có thể gọi điện cho bạn?</span>
            </div>
            <div className="flex gap-2">
              {([{ value: 'EVERYONE', label: 'Mọi người', icon: Globe, color: 'blue' }, { value: 'FRIENDS_ONLY', label: 'Chỉ bạn bè', icon: Users, color: 'green' }] as const).map(opt => {
                const Icon = opt.icon;
                const active = settings.allowCallFrom === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('allowCallFrom', opt.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      active ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-teal-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${active ? 'text-teal-600' : 'text-gray-600'}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allow Group Invite From */}
          <div className="border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <UsersRound className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Ai có thể mời bạn vào nhóm?</span>
            </div>
            <div className="flex gap-2">
              {([{ value: 'EVERYONE', label: 'Mọi người', icon: Globe, color: 'blue' }, { value: 'FRIENDS_ONLY', label: 'Chỉ bạn bè', icon: Users, color: 'green' }] as const).map(opt => {
                const Icon = opt.icon;
                const active = settings.allowGroupInviteFrom === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('allowGroupInviteFrom', opt.value)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1.5 ${
                      active ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-amber-600' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${active ? 'text-amber-600' : 'text-gray-600'}`}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Block Users */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <UserMinus className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{t('privacySettings.sectionBlockTitle')}</h2>
                <p className="text-xs text-gray-500">{t('privacySettings.sectionBlockDesc')}</p>
              </div>
            </div>
            <Link
              to="/settings/blocked"
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-colors"
            >
              {t('privacySettings.manage')}
            </Link>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition-colors flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {t('privacySettings.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
