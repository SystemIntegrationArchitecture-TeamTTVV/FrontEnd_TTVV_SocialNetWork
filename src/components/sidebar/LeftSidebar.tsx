import { Link, useLocation } from 'react-router-dom';
import { User, Users, Store, Video, Bookmark, ChevronDown, Music2 } from 'lucide-react';
import { authApi } from '../../apis/auth';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';

type MenuItem = {
  icon: typeof User;
  label: string;
  path: string;
  isUser?: boolean;
  requireAuth?: boolean;
};

export default function LeftSidebar() {
  const location = useLocation();
  const isAuthenticated = authApi.isAuthenticated();
  const currentUser = isAuthenticated ? authApi.getCurrentUser() : null;
  
  const userAvatar = currentUser?.avatar || null;
  const userInitials = currentUser?.fullName
    ? currentUser.fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';
  
  const menuItems: MenuItem[] = [
    { icon: Users, label: 'Bạn bè', path: '/friends', requireAuth: true },
    { icon: Users, label: 'Nhóm', path: '/groups', requireAuth: true },
    { icon: Store, label: 'Chợ', path: '/marketplace', requireAuth: true },
    { icon: Video, label: 'Video', path: '/watch', requireAuth: true },
    { icon: Music2, label: 'Nhạc', path: '/music' },
    { icon: Bookmark, label: 'Đã lưu', path: '/saved', requireAuth: true },
  ];

  const menuItemsWithUser: MenuItem[] = currentUser?.id && currentUser.fullName?.trim()
    ? [
        {
          icon: User,
          label: currentUser.fullName,
          path: `/profile/${currentUser.id}`,
          isUser: true,
        },
        ...menuItems,
      ]
    : menuItems;

  return (
    <div className="w-full px-2 py-3">
      <div className="space-y-1">
        {menuItemsWithUser.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDisabled = !!item.requireAuth && !currentUser;

          const rowBase = 'flex items-center gap-3 px-2 py-2 rounded-lg transition-colors duration-150 group';
          const rowActive = 'bg-[#e7f3ff] dark:bg-blue-500/12';
          const rowInactive = 'hover:bg-[#f0f2f5] dark:hover:bg-[#1e2133]';

          const iconWrap = 'w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0';
          const iconActive = 'bg-[#1877F2] text-white';
          const iconInactive = 'bg-[#e4e6eb] text-[#050505] group-hover:bg-[#d8dadf] dark:bg-[#22263a] dark:text-[#c8ccde] dark:group-hover:bg-[#2b2f45]';

          const labelActive = 'text-[#050505] font-semibold dark:text-[#edf0fa]';
          const labelInactive = 'text-[#050505] font-medium group-hover:text-[#050505] dark:text-[#c8ccde] dark:group-hover:text-[#edf0fa]';

          return (
            isDisabled ? (
              <button
                key={index}
                type="button"
                onClick={() => showAuthRequiredPrompt(location.pathname)}
                className={`w-full ${rowBase} ${rowInactive} text-gray-400 dark:text-[#6a7494]`}
                title="Vui lòng đăng nhập"
              >
                <div className={`${iconWrap} ${iconInactive} opacity-60`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-medium opacity-60">{item.label}</span>
              </button>
            ) : (
              <Link
                key={index}
                to={item.path}
                className={`${rowBase} ${isActive ? rowActive : rowInactive}`}
              >
              {item.isUser ? (
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-[#1877F2]/30 dark:ring-blue-500 ring-offset-1 ring-offset-[#f0f2f5] dark:ring-offset-[#13151f]">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={item.label}
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
              <span className={`text-[15px] ${isActive ? labelActive : labelInactive}`}>
                {item.label}
              </span>
              </Link>
            )
          );
        })}

        <button
          type="button"
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg transition-colors duration-150 group hover:bg-[#f0f2f5] dark:hover:bg-[#1e2133]"
        >
          <div className="w-9 h-9 rounded-full bg-[#e4e6eb] flex items-center justify-center group-hover:bg-[#d8dadf] dark:bg-[#22263a] dark:group-hover:bg-[#2b2f45] transition-colors shrink-0">
            <ChevronDown className="w-5 h-5 text-[#65676b] dark:text-[#9aa3bc]" />
          </div>
          <span className="text-[15px] font-medium text-[#65676b] group-hover:text-[#050505] dark:text-[#9aa3bc] dark:group-hover:text-[#edf0fa]">
            Xem thêm
          </span>
        </button>
      </div>
    </div>
  );
}
