import { Bell, Users, Share2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const PREF_KEY = 'notification_preferences';

type NotifSettings = {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  postNotifications: boolean;
  commentNotifications: boolean;
  likeNotifications: boolean;
  shareNotifications: boolean;
  friendRequestNotifications: boolean;
  messageNotifications: boolean;
  eventNotifications: boolean;
  groupNotifications: boolean;
};

const DEFAULTS: NotifSettings = {
  pushNotifications: true,
  emailNotifications: true,
  smsNotifications: false,
  postNotifications: true,
  commentNotifications: true,
  likeNotifications: true,
  shareNotifications: true,
  friendRequestNotifications: true,
  messageNotifications: true,
  eventNotifications: true,
  groupNotifications: true,
};

function loadSettings(): NotifSettings {
  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return DEFAULTS;
}

export default function NotificationSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<NotifSettings>(loadSettings);

  const handleToggle = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key as keyof NotifSettings] };
      try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  const notificationGroups = [
    {
      titleKey: 'notificationSettings.groupGeneral' as const,
      icon: Bell,
      items: [
        { key: 'pushNotifications', labelKey: 'notificationSettings.pushLabel' as const, descKey: 'notificationSettings.pushDesc' as const },
        { key: 'emailNotifications', labelKey: 'notificationSettings.emailLabel' as const, descKey: 'notificationSettings.emailDesc' as const },
        { key: 'smsNotifications', labelKey: 'notificationSettings.smsLabel' as const, descKey: 'notificationSettings.smsDesc' as const },
      ],
    },
    {
      titleKey: 'notificationSettings.groupPostActivity' as const,
      icon: Share2,
      items: [
        { key: 'postNotifications', labelKey: 'notificationSettings.postNewLabel' as const, descKey: 'notificationSettings.postNewDesc' as const },
        { key: 'commentNotifications', labelKey: 'notificationSettings.commentLabel' as const, descKey: 'notificationSettings.commentDesc' as const },
        { key: 'likeNotifications', labelKey: 'notificationSettings.likeLabel' as const, descKey: 'notificationSettings.likeDesc' as const },
        { key: 'shareNotifications', labelKey: 'notificationSettings.shareLabel' as const, descKey: 'notificationSettings.shareDesc' as const },
      ],
    },
    {
      titleKey: 'notificationSettings.groupSocial' as const,
      icon: Users,
      items: [
        { key: 'friendRequestNotifications', labelKey: 'notificationSettings.friendReqLabel' as const, descKey: 'notificationSettings.friendReqDesc' as const },
        { key: 'messageNotifications', labelKey: 'notificationSettings.messageLabel' as const, descKey: 'notificationSettings.messageDesc' as const },
        { key: 'eventNotifications', labelKey: 'notificationSettings.eventLabel' as const, descKey: 'notificationSettings.eventDesc' as const },
        { key: 'groupNotifications', labelKey: 'notificationSettings.groupLabel' as const, descKey: 'notificationSettings.groupDesc' as const },
      ],
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('notificationSettings.pageTitle')}</h1>
        <p className="text-base text-gray-600 mt-1">{t('notificationSettings.pageSubtitle')}</p>
      </div>

      <div className="space-y-6">
        {notificationGroups.map((group, groupIndex) => {
          const Icon = group.icon;
          return (
            <div key={groupIndex} className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t(group.titleKey)}</h2>
              </div>

              <div className="space-y-5">
                {group.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-lg text-gray-900 mb-1">{t(item.labelKey)}</p>
                      <p className="text-sm text-gray-600">{t(item.descKey)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(item.key)}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        settings[item.key as keyof typeof settings]
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                          settings[item.key as keyof typeof settings]
                            ? 'translate-x-6'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button type="button" className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors shadow-lg">
          {t('notificationSettings.saveChanges')}
        </button>
      </div>
    </div>
  );
}
