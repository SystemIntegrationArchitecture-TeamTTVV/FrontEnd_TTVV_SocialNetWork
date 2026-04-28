import { Link, useLocation } from 'react-router-dom';
import { User, Users, LayoutGrid, Store, Video, Bookmark, Music2, Gamepad2, Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';

type LabelKey = 'friends' | 'groups' | 'marketplace' | 'video' | 'music' | 'games' | 'live' | 'saved';

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
          const rowActive = 'bg-[#e7f3ff] dark:bg-blue-500/12 shadow-sm ring-1 ring-[#1877F2]/15 dark:ring-blue-400/20 scale-[1.02]';
          const rowInactive = 'hover:bg-[#f0f2f5] dark:hover:bg-[#1e2133]';

          const iconWrap = 'w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0';
          const iconActive = 'bg-[#1877F2] text-white shadow-md shadow-blue-500/30';
          const iconInactive = 'bg-[#e4e6eb] text-[#050505] group-hover:bg-[#d8dadf] dark:bg-[#22263a] dark:text-[#c8ccde] dark:group-hover:bg-[#2b2f45]';

          const labelActive = 'text-[#050505] font-bold text-base dark:text-[#edf0fa]';
          const labelInactive = 'text-[#050505] font-medium group-hover:text-[#050505] dark:text-[#c8ccde] dark:group-hover:text-[#edf0fa]';

          const rowLabel = item.isUser ? item.displayName : t(`leftSidebar.${item.labelKey}`);

          return isDisabled ? (
            <button
              key={index}
              type="button"
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

      </div>
    </div>
  );
}
