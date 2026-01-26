import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Video, Store, Users, Menu, MessageCircle, Bell, User as UserIcon, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import { authApi } from '../../apis/auth';
import { useSocket } from '../../contexts/SocketContext';
import { usersApi, type User } from '../../apis/users';
import { notificationsApi } from '../../apis/notifications';
import { conversationsApi } from '../../apis/conversations';
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
  const [pendingJoinRequestCount, setPendingJoinRequestCount] = useState(0);
  const { isConnected: socketConnected, subscribe } = useSocket();
  const [currentUser] = useState<{
    id: string;
    username: string;
    fullName: string;
    avatar: string;
    role: string;
  } | null>(() => authApi.getCurrentUser());
  const searchRef = useRef<HTMLDivElement>(null);

  // Reload user when route changes
  useEffect(() => {
    const user = authApi.getCurrentUser();
    if (user?.id !== currentUser?.id) {
      window.location.reload();
    }
  }, [location.pathname, currentUser?.id]);

  // Function to reload unread notification count
  const loadUnreadCount = async () => {
    if (!currentUser?.id) return;
    
    try {
      const count = await notificationsApi.getUnreadNotificationCount(currentUser.id);
      setUnreadNotificationCount(count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // Load unread notification count and pending join requests
  useEffect(() => {
    const loadCounts = async () => {
      if (!currentUser?.id) return;
      
      try {
        const count = await notificationsApi.getUnreadNotificationCount(currentUser.id);
        setUnreadNotificationCount(count);

        // Load pending join requests count
        const conversations = await conversationsApi.getConversationsByUserId(currentUser.id);
        let joinRequestCount = 0;
        for (const conv of conversations) {
          if (
            conv.isGroup &&
            conv.approvalsRequired &&
            conv.pendingJoinIds &&
            conv.pendingJoinIds.length > 0 &&
            (conv.ownerId === currentUser.id || conv.adminIds?.includes(currentUser.id))
          ) {
            joinRequestCount += conv.pendingJoinIds.length;
          }
        }
        setPendingJoinRequestCount(joinRequestCount);
      } catch (error) {
        console.error('Failed to load counts:', error);
      }
    };

    loadCounts();
  }, [currentUser?.id]);

  // Subscribe to socket for real-time updates
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsubscribe = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'NOTIFICATION' && event.data) {
        setUnreadNotificationCount((prev) => prev + 1);
      }

      // Handle join request events
      if ((event.type === 'JOIN_REQUEST_CREATED' || event.type === 'JOIN_REQUEST_UPDATED') && event.data) {
        // Reload conversations to get updated count
        conversationsApi.getConversationsByUserId(currentUser.id).then((conversations) => {
          let joinRequestCount = 0;
          for (const conv of conversations) {
            if (
              conv.isGroup &&
              conv.approvalsRequired &&
              conv.pendingJoinIds &&
              conv.pendingJoinIds.length > 0 &&
              (conv.ownerId === currentUser.id || conv.adminIds?.includes(currentUser.id))
            ) {
              joinRequestCount += conv.pendingJoinIds.length;
            }
          }
          setPendingJoinRequestCount(joinRequestCount);
        }).catch(console.error);
      }
    });

    return unsubscribe;
  }, [currentUser?.id, subscribe]);

  // Debounced search
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

  // Click outside handler
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
    <nav className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6 h-full flex items-center justify-between gap-4">
        
        {/* LEFT - Logo & Search */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link to="/home" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src={logo} 
              alt="TTVV" 
              className="w-12 h-12 rounded-full object-cover shadow-sm"
            />
          </Link>
          
          <div className="hidden md:block relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  }
                }}
                placeholder="Search TTVV"
                className="w-64 lg:w-80 h-11 pl-11 pr-4 rounded-full bg-gray-50 text-sm border border-gray-200 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-500"
              />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[9999] max-h-96 overflow-y-auto">
                <div className="py-2">
                  {suggestions.map((user) => {
                    const userInitials = user.fullName
                      ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      : user.username.charAt(0).toUpperCase();

                    return (
                      <button
                        key={user.id}
                        onClick={() => handleSuggestionClick(user)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                            {userInitials}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
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

        {/* CENTER - Nav Icons */}
        <div className="flex items-center justify-center flex-1 max-w-2xl gap-2">
          <Link
            to="/home"
            className={`relative flex-1 max-w-[140px] h-14 flex items-center justify-center rounded-lg transition-all ${
              isActive('/home') 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Home className={`w-[26px] h-[26px] ${isActive('/home') ? 'fill-current' : ''}`} />
            {isActive('/home') && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] h-1 bg-blue-600 rounded-t"></div>
            )}
          </Link>
          
          <Link
            to="/watch"
            className={`relative flex-1 max-w-[140px] h-14 flex items-center justify-center rounded-lg transition-all ${
              isActive('/watch') 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Video className={`w-[26px] h-[26px] ${isActive('/watch') ? 'fill-current' : ''}`} />
            {isActive('/watch') && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] h-1 bg-blue-600 rounded-t"></div>
            )}
          </Link>

          <Link
            to="/marketplace"
            className={`relative flex-1 max-w-[140px] h-14 flex items-center justify-center rounded-lg transition-all ${
              isActive('/marketplace') 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Store className={`w-[26px] h-[26px] ${isActive('/marketplace') ? 'fill-current' : ''}`} />
            {isActive('/marketplace') && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] h-1 bg-blue-600 rounded-t"></div>
            )}
          </Link>

          <Link
            to="/groups"
            className={`relative flex-1 max-w-[140px] h-14 flex items-center justify-center rounded-lg transition-all ${
              isActive('/groups') 
                ? 'text-blue-600' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className={`w-[26px] h-[26px] ${isActive('/groups') ? 'fill-current' : ''}`} />
            {isActive('/groups') && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[calc(100%-20px)] h-1 bg-blue-600 rounded-t"></div>
            )}
          </Link>
        </div>

        {/* RIGHT - Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Menu className="w-5 h-5 text-gray-700" />
          </button>
          
          <Link
            to="/messenger"
            className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors relative"
          >
            <MessageCircle className="w-5 h-5 text-gray-700" />
          </Link>
          
          <div className="relative">
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="w-11 h-11 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors relative"
            >
              <Bell className="w-6 h-6 text-gray-700" />
              {(unreadNotificationCount + pendingJoinRequestCount) > 0 && (
                <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            <NotificationDropdown 
              isOpen={isNotificationOpen} 
              onClose={() => setIsNotificationOpen(false)}
              onNotificationRead={loadUnreadCount}
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-11 h-11 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-300 transition-all shadow-sm"
            >
              {currentUser?.avatar ? (
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : currentUser?.fullName ? (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                  {currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
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