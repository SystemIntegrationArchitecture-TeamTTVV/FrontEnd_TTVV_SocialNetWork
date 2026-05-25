import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Users, LayoutGrid, Store, Video, Bookmark, Music2, Gamepad2, Radio, ChevronLeft, ChevronRight, Sparkles, Wallet } from 'lucide-react';
import SystemUpdateModal, { hasSeenLatestChangelog } from './../../components/common/SystemUpdateModal';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';

type LabelKey = 'friends' | 'groups' | 'marketplace' | 'video' | 'music' | 'games' | 'live' | 'saved' | 'wallet';

type MenuItem =
  | {
      icon: typeof User;
      path: string;
      requireAuth?: boolean;
      isUser: true;
      displayName: string;
    }
  | {
      icon: typeof User;
      path: string;
      requireAuth?: boolean;
      isUser?: false;
      labelKey: LabelKey;
    };

type LeftSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function LeftSidebar({ collapsed = false, onToggleCollapse }: LeftSidebarProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const { user: currentUser } = useAuth();
  const [showChangelog, setShowChangelog] = useState(false);

  const userAvatar = currentUser?.avatar || null;
  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'
    : 'U';

  const menuItems: MenuItem[] = [
    { icon: Users, labelKey: 'friends', path: '/friends', requireAuth: true },
    { icon: LayoutGrid, labelKey: 'groups', path: '/groups', requireAuth: true },
    { icon: Store, labelKey: 'marketplace', path: '/marketplace', requireAuth: true },
    { icon: Video, labelKey: 'video', path: '/watch', requireAuth: true },
    { icon: Music2, labelKey: 'music', path: '/music' },
    { icon: Gamepad2, labelKey: 'games', path: '/games' },
    { icon: Radio, labelKey: 'live', path: '/livestream', requireAuth: true },
    { icon: Bookmark, labelKey: 'saved', path: '/saved', requireAuth: true },
    { icon: Wallet, labelKey: 'wallet', path: '/wallet', requireAuth: true },
  ];

  const menuItemsWithUser: MenuItem[] =
    currentUser?.id && currentUser.fullName?.trim()
      ? [
          {
            icon: User,
            path: `/profile/${currentUser.id}`,
            isUser: true,
            displayName: currentUser.fullName,
          },
          ...menuItems,
        ]
      : menuItems;

  return (
    <div className={`w-full py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
      <div className={`mx-auto w-full space-y-1.5 ${collapsed ? 'max-w-[72px]' : 'max-w-[230px]'}`}>
        <div className={`mb-2 flex ${collapsed ? 'justify-center' : 'justify-end'}`}>
          <button
            type="button"
            onClick={onToggleCollapse}
            className="h-8 w-8 rounded-full bg-[#e4e6eb] text-[#7a7d82] hover:bg-[#d8dadf] dark:bg-[#22263a] dark:text-[#9aa3bc] dark:hover:bg-[#2b2f45] transition-colors flex items-center justify-center shadow-sm"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
        {menuItemsWithUser.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDisabled = 'requireAuth' in item && !!item.requireAuth && !currentUser;

          const rowBase = `flex items-center rounded-xl transition-all duration-200 group min-h-12 ${
            collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2.5'
          }`;
          const rowActive = collapsed
            ? 'bg-blue-50 dark:bg-blue-500/10'
            : 'border-l-[3px] border-[#1a6cf5] dark:border-blue-400 pl-[9px] bg-blue-50/70 dark:bg-blue-500/8';
          const rowInactive = 'hover:bg-[#f0f2f5] dark:hover:bg-[#1f2230]';

          const iconWrap = 'w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0';
          const iconActive = 'bg-[#1a6cf5] text-white shadow-sm';
          const iconInactive = 'bg-[#edf0f5] text-[#444] group-hover:bg-[#e2e6ee] dark:bg-[#272c3d] dark:text-[#c0c8da] dark:group-hover:bg-[#333848]';

          const labelActive = 'text-[#1a6cf5] dark:text-blue-400 font-semibold text-[15px]';
          const labelInactive = 'text-gray-700 dark:text-[#b8becf] font-medium group-hover:text-gray-900 dark:group-hover:text-[#e8ecf5]';

          const rowLabel = item.isUser ? item.displayName : t(`leftSidebar.${item.labelKey}`);

          return isDisabled ? (
            <button
              key={index}
              type="button"
              data-sidebar-link={item.path}
              onClick={() => showAuthRequiredPrompt(location.pathname)}
              className={`w-full ${rowBase} ${rowInactive} text-gray-400 dark:text-[#6a7494]`}
              title={`${rowLabel} - ${t('leftSidebar.loginRequired')}`}
            >
              <div className={`${iconWrap} ${iconInactive} opacity-60`}>
                <Icon className="w-5 h-5" />
              </div>
              {!collapsed && <span className="text-[15px] font-medium opacity-60">{rowLabel}</span>}
            </button>
          ) : (
            <Link key={index} to={item.path} data-sidebar-link={item.path} className={`${rowBase} ${isActive ? rowActive : rowInactive}`} title={collapsed ? rowLabel : undefined}>
              {item.isUser ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-[#1877F2]/30 dark:ring-blue-500 ring-offset-1 ring-offset-[#f0f2f5] dark:ring-offset-[#13151f]">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={item.displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = `<span class="text-white font-semibold text-sm bg-blue-500 w-full h-full flex items-center justify-center">${userInitials}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{userInitials}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className={`${iconWrap} ${isActive ? iconActive : iconInactive}`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              {!collapsed && <span className={`${isActive ? labelActive : `text-[15px] ${labelInactive}`}`}>{rowLabel}</span>}
            </Link>
          );
        })}

        {/* ── System Update Button (new — does not affect existing items) ── */}
        <button
          type="button"
          onClick={() => setShowChangelog(true)}
          className={`flex items-center rounded-xl transition-all duration-200 group min-h-12 hover:bg-[#f0f2f5] dark:hover:bg-[#1f2230] w-full ${
            collapsed ? 'justify-center px-2 py-2' : 'gap-3 px-3 py-2.5'
          }`}
          title={collapsed ? 'Bản cập nhật mới' : undefined}
        >
          <div className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[#edf0f5] text-[#444] group-hover:bg-[#e2e6ee] dark:bg-[#272c3d] dark:text-[#c0c8da] dark:group-hover:bg-[#333848] transition-all shrink-0">
            <Sparkles className="w-5 h-5" />
            {!hasSeenLatestChangelog(currentUser?.id) && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#13151f]" />
            )}
          </div>
          {!collapsed && (
            <span className="text-[15px] text-gray-700 dark:text-[#b8becf] font-medium group-hover:text-gray-900 dark:group-hover:text-[#e8ecf5] flex items-center gap-2">
              Bản cập nhật mới
              {!hasSeenLatestChangelog(currentUser?.id) && (
                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full leading-none">NEW</span>
              )}
            </span>
          )}
        </button>

        <SystemUpdateModal
          isOpen={showChangelog}
          onClose={() => setShowChangelog(false)}
          userId={currentUser?.id}
        />

      </div>
    </div>
  );
}
