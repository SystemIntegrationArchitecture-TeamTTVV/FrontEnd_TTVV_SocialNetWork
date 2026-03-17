import { Link, useLocation } from 'react-router-dom';
import { User, Users, Store, Video, Bookmark, UserPlus, ChevronDown, Music2 } from 'lucide-react';
import { authApi } from '../../apis/auth';

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
    { icon: UserPlus, label: 'Tìm bạn bè', path: '/find-people' },
    { icon: Users, label: 'Bạn bè', path: '/friends', requireAuth: true },
    { icon: Users, label: 'Groups', path: '/groups' },
    { icon: Store, label: 'Marketplace', path: '/marketplace' },
    { icon: Video, label: 'Watch', path: '/watch' },
    { icon: Music2, label: 'Music edm', path: '/music' },
    { icon: Bookmark, label: 'Saved', path: '/saved', requireAuth: true },
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
    <aside className="hidden lg:block w-72 px-4 py-6">
      <div className="space-y-2.5">
        {menuItemsWithUser.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDisabled = !!item.requireAuth && !currentUser;
          
          return (
            isDisabled ? (
              <div
                key={index}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 cursor-not-allowed select-none"
                title="Vui lòng đăng nhập để sử dụng"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ) : (
              <Link
                key={index}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
              {item.isUser ? (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                  isActive 
                    ? 'bg-blue-500' 
                    : 'bg-blue-500'
                }`}>
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
                          parent.innerHTML = `<span class="text-white font-semibold text-sm">${userInitials}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">{userInitials}</span>
                  )}
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className={`text-sm font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {item.label}
              </span>
              </Link>
            )
          );
        })}
        
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 w-full text-gray-600 hover:text-gray-900 group">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
            <ChevronDown className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">See more</span>
        </button>
      </div>
    </aside>
  );
}
