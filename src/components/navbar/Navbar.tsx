import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Store, Users, Menu, MessageCircle, Bell, User, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import { authApi } from '../../apis/auth';
import logo from '../../assets/logo-favicon.png';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());

  // Reload user when route changes (in case user logs in/out)
  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user?.id !== currentUser?.id) {
      window.location.reload(); // Simple reload to sync state
    }
  }, [location.pathname, currentUser?.id]);

  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-50 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Logo & Search */}
        <div className="flex items-center gap-5">
          <Link to="/home" className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
              <img 
                src={logo} 
                alt="TTVV Logo" 
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
          <div className="hidden md:block relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search TTVV"
              className="w-80 lg:w-96 h-14 pl-14 pr-5 rounded-full bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white text-lg transition-all"
            />
          </div>
        </div>

        {/* Nav Icons - Cleaner */}
        <div className="flex items-center gap-3">
          <Link
            to="/home"
            className={`w-20 h-14 rounded-xl flex items-center justify-center transition-all ${
              isActive('/home')
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Home className={`w-7 h-7 ${isActive('/home') ? 'fill-blue-600' : ''}`} />
          </Link>
          
          <Link
            to="/watch"
            className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Video className="w-7 h-7" />
          </Link>

          <Link
            to="/marketplace"
            className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Store className="w-7 h-7" />
          </Link>

          <Link
            to="/groups"
            className="w-14 h-14 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all"
          >
            <Users className="w-7 h-7" />
          </Link>
        </div>

        {/* Right Actions - Modern */}
        <div className="flex items-center gap-4">
          <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <Link
            to="/messenger"
            className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors relative"
          >
            <MessageCircle className="w-6 h-6 text-gray-700" />
          </Link>
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors relative"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:shadow-md transition-shadow overflow-hidden"
              title={currentUser?.fullName || 'Profile'}
            >
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent && currentUser) {
                      const initials = currentUser.fullName
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2);
                      parent.innerHTML = `<span class="text-white font-semibold text-sm">${initials}</span>`;
                    }
                  }}
                />
              ) : currentUser?.fullName ? (
                <span className="text-white font-semibold text-sm">
                  {currentUser.fullName
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </span>
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </button>
            <UserDropdown 
              isOpen={isUserMenuOpen} 
              onClose={() => setIsUserMenuOpen(false)}
              user={currentUser}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
