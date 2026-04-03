import { Link } from 'react-router-dom';
import { Globe, Users, Lock, Eye, UserMinus, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PrivacySettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    profileVisibility: 'friends',
    friendRequests: 'everyone',
    whoCanPost: 'friends',
    whoCanSeePosts: 'friends',
    whoCanSeeFriends: 'friends',
    whoCanSeeEmail: 'friends',
    blockUsers: false,
  });

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const privacyOptions = [
    { value: 'public', labelKey: 'privacySettings.visibilityPublic' as const, icon: Globe },
    { value: 'friends', labelKey: 'privacySettings.visibilityFriends' as const, icon: Users },
    { value: 'private', labelKey: 'privacySettings.visibilityOnlyMe' as const, icon: Lock },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('privacySettings.pageTitle')}</h1>
        <p className="text-base text-gray-600 mt-1">{t('privacySettings.pageSubtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionProfileTitle')}</h2>
              <p className="text-base text-gray-600">{t('privacySettings.sectionProfileDesc')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {privacyOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleChange('profileVisibility', option.value)}
                  className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                    settings.profileVisibility === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 mb-2 ${settings.profileVisibility === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className={`font-semibold text-base ${settings.profileVisibility === option.value ? 'text-blue-600' : 'text-gray-700'}`}>
                    {t(option.labelKey)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Friend Requests */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionFriendRequestsTitle')}</h2>
              <p className="text-base text-gray-600">{t('privacySettings.sectionFriendRequestsDesc')}</p>
            </div>
          </div>
          <select
            value={settings.friendRequests}
            onChange={(e) => handleChange('friendRequests', e.target.value)}
            className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
          >
            <option value="everyone">{t('privacySettings.friendFromEveryone')}</option>
            <option value="friendsOfFriends">{t('privacySettings.friendFromFriendsOfFriends')}</option>
            <option value="nobody">{t('privacySettings.friendFromNobody')}</option>
          </select>
        </div>

        {/* Who Can Post */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionWhoCanPostTitle')}</h2>
                <p className="text-base text-gray-600">{t('privacySettings.sectionWhoCanPostDesc')}</p>
              </div>
            </div>
          </div>
          <select
            value={settings.whoCanPost}
            onChange={(e) => handleChange('whoCanPost', e.target.value)}
            className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
          >
            <option value="everyone">{t('privacySettings.whoCanPostEveryone')}</option>
            <option value="friends">{t('privacySettings.whoCanPostFriends')}</option>
            <option value="onlyMe">{t('privacySettings.whoCanPostOnlyMe')}</option>
          </select>
        </div>

        {/* Who Can See Posts */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionWhoCanSeePostsTitle')}</h2>
              <p className="text-base text-gray-600">{t('privacySettings.sectionWhoCanSeePostsDesc')}</p>
            </div>
          </div>
          <select
            value={settings.whoCanSeePosts}
            onChange={(e) => handleChange('whoCanSeePosts', e.target.value)}
            className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
          >
            <option value="public">{t('privacySettings.seePostsPublic')}</option>
            <option value="friends">{t('privacySettings.seePostsFriends')}</option>
            <option value="onlyMe">{t('privacySettings.seePostsOnlyMe')}</option>
          </select>
        </div>

        {/* Who Can See Friends */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionWhoCanSeeFriendsTitle')}</h2>
              <p className="text-base text-gray-600">{t('privacySettings.sectionWhoCanSeeFriendsDesc')}</p>
            </div>
          </div>
          <select
            value={settings.whoCanSeeFriends}
            onChange={(e) => handleChange('whoCanSeeFriends', e.target.value)}
            className="w-full h-14 px-5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-medium"
          >
            <option value="public">{t('privacySettings.seeFriendsPublic')}</option>
            <option value="friends">{t('privacySettings.seeFriendsFriends')}</option>
            <option value="onlyMe">{t('privacySettings.seeFriendsOnlyMe')}</option>
          </select>
        </div>

        {/* Block Users */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <UserMinus className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{t('privacySettings.sectionBlockTitle')}</h2>
                <p className="text-base text-gray-600">{t('privacySettings.sectionBlockDesc')}</p>
              </div>
            </div>
            <Link
              to="/settings/blocked"
              className="px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-base transition-colors"
            >
              {t('privacySettings.manage')}
            </Link>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button type="button" className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors shadow-lg">
            {t('privacySettings.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  );
}
