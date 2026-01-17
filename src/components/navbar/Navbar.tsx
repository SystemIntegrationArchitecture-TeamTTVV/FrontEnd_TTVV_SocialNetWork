import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Video, Store, Users, Menu, MessageCircle, Bell, User as UserIcon, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import { authApi } from '../../apis/auth';
import { useSocket } from '../../contexts/SocketContext';
import { usersApi, type User } from '../../apis/users';
import { notificationsApi } from '../../apis/notifications';
import logo from '../../assets/logo-favicon.png';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { isConnected: socketConnected, subscribe } = useSocket();
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());
  const searchRef = useRef<HTMLDivElement>(null);

  // Reload user when route changes (in case user logs in/out)
  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user?.id !== currentUser?.id) {
      window.location.reload(); // Simple reload to sync state
    }
  }, [location.pathname, currentUser?.id]);

  // Load unread notification count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!currentUser?.id) return;
      
      try {
        const count = await notificationsApi.getUnreadNotificationCount(currentUser.id);
        setUnreadNotificationCount(count);
      } catch (error) {
        console.error('Failed to load unread notification count:', error);
      }
    };

    loadUnreadCount();
  }, [currentUser?.id]);

  // Subscribe to socket for real-time unread count updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'NOTIFICATION' && event.data) {
        // Increment unread count when new notification arrives
        setUnreadNotificationCount((prev) => prev + 1);
      }
    });

    return unsubscribe;
  }, [currentUser?.id, subscribe]);

  // Debounced search for suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const results = await usersApi.searchUsers(searchQuery);
        const filtered = results
          .filter(user => user.id !== currentUser?.id)
          .slice(0, 5);
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      } catch (error) {
        console.error('Search suggestions failed:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser?.id]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = (user: User) => {
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    navigate(`/profile/${user.id}`);
  };

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
          <div className="hidden md:block relative" ref={searchRef}>
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  navigate(`/find-people?q=${encodeURIComponent(searchQuery)}`);
                  setShowSuggestions(false);
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                }
              }}
              placeholder="Search TTVV"
              className="w-80 lg:w-96 h-14 pl-14 pr-5 rounded-full bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white text-lg transition-all"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border-2 border-blue-500 shadow-xl z-[9999] max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((user) => {
                    const userInitials = user.fullName
                      ? user.fullName
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : user.username.charAt(0).toUpperCase();

                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSuggestionClick(user)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {userInitials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-sm">
                            {user.fullName || user.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
              {unreadNotificationCount > 0 && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <NotificationDropdown 
              isOpen={isNotificationOpen} 
              onClose={() => setIsNotificationOpen(false)}
              onNotificationRead={() => setUnreadNotificationCount((prev) => Math.max(0, prev - 1))}
            />
          </div>
          {/* Socket Connection Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={socketConnected ? 'Socket Connected' : 'Socket Disconnected'}></div>
            <span className="text-xs text-gray-600 font-medium hidden lg:inline">
              {socketConnected ? 'Online' : 'Offline'}
            </span>
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
                <UserIcon className="w-6 h-6 text-white" />
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
