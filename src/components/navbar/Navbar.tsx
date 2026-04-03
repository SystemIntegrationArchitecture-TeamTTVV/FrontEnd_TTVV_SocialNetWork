import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Video, Store, Users, MessageCircle, Bell, User as UserIcon, Search, Sun, Moon, X, Globe, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { usersApi, type User } from '../../apis/users';
import { notificationsApi } from '../../apis/notifications';
import { conversationsApi } from '../../apis/conversations';
import logo from '../../assets/logo-favicon.png';
import { showAuthRequiredPrompt } from '../../utils/authPrompt';
import { getCurrentAppLanguage, setAppLanguage } from '../../i18n';

export default function Navbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;
  const { isDark, toggleTheme } = useTheme();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [pendingJoinRequestCount, setPendingJoinRequestCount] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [loadingMessenger, setLoadingMessenger] = useState(false);
  const { subscribe } = useSocket();
  const { user: currentUser } = useAuth();
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const langMenuDesktopRef = useRef<HTMLDivElement>(null);
  const langMenuMobileRef = useRef<HTMLDivElement>(null);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const requestLogin = () => showAuthRequiredPrompt(location.pathname);

  const currentLang = getCurrentAppLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        langMenuDesktopRef.current?.contains(target) ||
        langMenuMobileRef.current?.contains(target)
      ) {
        return;
      }
      setIsLangOpen(false);
    };
    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen]);

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
        const rawConversations = await conversationsApi.getConversationsByUserId(currentUser.id);
        const conversations = Array.isArray(rawConversations) ? rawConversations : [];
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
        conversationsApi.getConversationsByUserId(currentUser.id).then((rawConversations) => {
          const conversations = Array.isArray(rawConversations) ? rawConversations : [];
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
    if (!searchQuery.trim()) return;

    const timeoutId = setTimeout(async () => {
      try {
        const rawResults = await usersApi.searchUsers(searchQuery);
        const results = Array.isArray(rawResults) ? rawResults : [];
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
      const target = event.target as Node;
      const inDesktop = searchRef.current?.contains(target);
      const inMobile = mobileSearchRef.current?.contains(target);
      if (!inDesktop && !inMobile) {
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

  const handleMessengerClick = () => {
    if (!currentUser) { requestLogin(); return; }
    if (location.pathname === '/messenger') return;
    setLoadingMessenger(true);
    setTimeout(() => {
      navigate('/messenger');
      setLoadingMessenger(false);
    }, 2000);
  };

  /* ── Shared avatar renderer ── */
  const renderAvatar = (size: 'sm' | 'md') => {
    const dim = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';
    const text = size === 'sm' ? 'text-xs' : 'text-sm';
    const icon = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    if (currentUser?.avatar)
      return <img src={currentUser.avatar} alt={currentUser.fullName} className={`${dim} rounded-full object-cover`} />;
    if (currentUser?.fullName)
      return (
        <div className={`${dim} rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ${text}`}>
          {currentUser.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
      );
    return (
      <div className={`${dim} rounded-full bg-gray-200 dark:bg-[#1e2130] flex items-center justify-center`}>
        <UserIcon className={`${icon} text-gray-600 dark:text-gray-400`} />
      </div>
    );
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════════════
          TOP NAVBAR  (fixed, h-20 on all breakpoints)
      ═══════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 h-14 z-50 bg-white dark:bg-[#13151f] border-b border-[#e4e6eb] dark:border-[#22263a] shadow-none">


        {/* ── DESKTOP layout (md+) ── */}
        <div className="hidden md:flex max-w-[1920px] mx-auto px-4 lg:px-6 h-full items-center justify-between gap-3">

          {/* LEFT - Logo & Search */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/home" className="flex items-center hover:opacity-90 transition-opacity">
              <img src={logo} alt="TTVV" className="w-10 h-10 rounded-full object-cover" />
            </Link>

            <div className="hidden md:block relative" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#65676b] dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSearchQuery(next);
                    if (!next.trim()) { setSuggestions([]); setShowSuggestions(false); }
                  }}
                  onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/find-people?q=${encodeURIComponent(searchQuery)}`);
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder={t('navbar.searchPlaceholder')}
                  className="w-56 lg:w-72 h-10 pl-10 pr-4 rounded-full bg-[#f0f2f5] dark:bg-[#1e2130] text-[15px] border-0 focus:outline-none focus:bg-[#e4e6eb] dark:focus:bg-[#252a3d] transition-colors placeholder:text-[#65676b] dark:text-gray-200"

                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200/80 z-80 max-h-96 overflow-y-auto">
                  <div className="py-2">
                    {suggestions.map((user) => {
                      const safeUsername = user.username ?? 'U';
                      const userInitials = user.fullName
                        ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
                        : safeUsername.charAt(0).toUpperCase();
                      return (
                        <button key={user.id} onClick={() => handleSuggestionClick(user)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                          {user.avatar
                            ? <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full object-cover" />
                            : <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">{userInitials}</div>
                          }
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{user.fullName || safeUsername}</p>
                            <p className="text-xs text-gray-500 truncate">@{safeUsername}</p>
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
          <div className="flex items-stretch justify-center flex-1 max-w-xl gap-0">
            {[
              { to: '/home', icon: Home, requireAuth: false },
              { to: '/watch', icon: Video, requireAuth: true },
              { to: '/marketplace', icon: Store, requireAuth: true },
              { to: '/groups', icon: Users, requireAuth: true },
            ].map(({ to, icon: Icon, requireAuth }) => {
              const needsAuth = requireAuth && !currentUser;
              const active = isActive(to);
              const cls = `relative flex-1 max-w-[120px] min-h-12 flex items-center justify-center rounded-none transition-colors ${
                active
                  ? 'text-[#1877F2] dark:text-blue-400'
                  : 'text-[#65676b] hover:bg-[#f0f2f5] dark:text-[#9aa3bc] dark:hover:bg-[#1e2130]'
              }`;
              const inner = (
                <>
                  <span className="flex items-center justify-center px-3 py-2">
                    <Icon strokeWidth={active ? 2.5 : 2} className="w-[22px] h-[22px]" />
                  </span>
                  {active && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#1877F2] dark:bg-blue-500 rounded-t-sm" />
                  )}
                </>
              );

              if (needsAuth) {
                return <button key={to} type="button" onClick={requestLogin} className={cls}>{inner}</button>;
              }
              return <Link key={to} to={to} className={cls}>{inner}</Link>;
            })}
          </div>

          {/* RIGHT - Actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Language */}
            <div className="relative" ref={langMenuDesktopRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen((v) => !v)}
                aria-expanded={isLangOpen}
                aria-haspopup="listbox"
                aria-label={t('navbar.languageTitle')}
                title={t('navbar.languageTitle')}
                className="w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#1e2130] hover:bg-[#d8dadf] dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors text-[#050505] dark:text-gray-200"
              >
                <Globe className="w-[20px] h-[20px]" strokeWidth={2} />
              </button>
              {isLangOpen && (
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] shadow-lg z-90 py-1 overflow-hidden"
                >
                  <button
                    type="button"
                    role="option"
                    aria-selected={currentLang === 'vi'}
                    onClick={() => {
                      setAppLanguage('vi');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
                  >
                    <span>{t('navbar.vietnamese')}</span>
                    {currentLang === 'vi' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    role="option"
                    aria-selected={currentLang === 'en'}
                    onClick={() => {
                      setAppLanguage('en');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
                  >
                    <span>{t('navbar.english')}</span>
                    {currentLang === 'en' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
                  </button>
                  <button
                    type="button"
                    role="option"
                    aria-selected={currentLang === 'ja'}
                    onClick={() => {
                      setAppLanguage('ja');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-[15px] hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
                  >
                    <span>{t('navbar.japanese')}</span>
                    {currentLang === 'ja' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
                  </button>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => toggleTheme()}
              aria-label={isDark ? t('navbar.themeLight') : t('navbar.themeDark')}
              title={isDark ? t('navbar.themeLight') : t('navbar.themeDark')}
              className="relative w-14 h-8 rounded-full theme-toggle-track flex items-center px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <span className="absolute left-1.5 flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-600"
                  style={{ opacity: isDark ? 0.35 : 1, transform: isDark ? 'scale(0.7) rotate(-30deg)' : 'scale(1) rotate(0deg)', transition: 'opacity 350ms ease, transform 350ms ease' }}
                />
              </span>
              <span className="absolute right-1.5 flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-200"
                  style={{ opacity: isDark ? 1 : 0.35, transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.7) rotate(30deg)', transition: 'opacity 350ms ease, transform 350ms ease' }}
                />
              </span>
              <span className="relative z-10 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center"
                style={{ transform: isDark ? 'translateX(20px)' : 'translateX(0px)', transition: 'transform 350ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}
              />
            </button>

            <button
              type="button"
              onClick={handleMessengerClick}
              className="w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#1e2130] hover:bg-[#d8dadf] dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors relative"
              title={currentUser ? t('navbar.messenger') : t('navbar.messengerLogin')}
            >
              <MessageCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="relative">
              <button
                onClick={() => { if (!currentUser) { requestLogin(); return; } setIsNotificationOpen(!isNotificationOpen); }}
                className="w-10 h-10 rounded-full bg-[#e4e6eb] dark:bg-[#1e2130] hover:bg-[#d8dadf] dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors relative"
              >
                <Bell className="w-[22px] h-[22px] text-[#050505] dark:text-gray-300" />
                {(unreadNotificationCount + pendingJoinRequestCount) > 0 && (
                  <span className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-[#12151f]" />
                )}
              </button>
              <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} onNotificationRead={loadUnreadCount} />
            </div>

            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border border-[#e4e6eb] dark:border-[#2b2f45] hover:opacity-95 transition-opacity flex items-center justify-center p-0">
                {renderAvatar('md')}
              </button>
              <UserDropdown isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} user={currentUser} />
            </div>
          </div>
        </div>

        {/* ── MOBILE layout (< md) ── */}
        <div className="flex md:hidden h-full items-center justify-between px-3">

          {/* Logo + app name */}
          <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src={logo} alt="TTVV" className="w-9 h-9 rounded-full object-cover shadow-sm" />
            <span className="font-bold text-[15px] text-gray-900 dark:text-white tracking-tight">TTVV</span>
          </Link>

          {/* Right action icons */}
          <div className="flex items-center gap-1.5">

            {/* Language — mobile */}
            <div className="relative" ref={langMenuMobileRef}>
              <button
                type="button"
                onClick={() => setIsLangOpen((v) => !v)}
                aria-label={t('navbar.languageTitle')}
                title={t('navbar.languageTitle')}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1e2130] hover:bg-gray-200 dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors text-gray-800 dark:text-gray-200"
              >
                <Globe className="w-[18px] h-[18px]" strokeWidth={2} />
              </button>
              {isLangOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] shadow-lg z-90 py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAppLanguage('vi');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940]"
                  >
                    {t('navbar.vietnamese')}
                    {currentLang === 'vi' && <Check className="w-4 h-4 text-[#1877F2]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppLanguage('en');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940]"
                  >
                    {t('navbar.english')}
                    {currentLang === 'en' && <Check className="w-4 h-4 text-[#1877F2]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAppLanguage('ja');
                      setIsLangOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940]"
                  >
                    {t('navbar.japanese')}
                    {currentLang === 'ja' && <Check className="w-4 h-4 text-[#1877F2]" />}
                  </button>
                </div>
              )}
            </div>

            {/* Theme toggle — icon only on mobile */}
            <button onClick={() => toggleTheme()}
              aria-label={isDark ? t('navbar.themeLight') : t('navbar.themeDark')}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1e2130] hover:bg-gray-200 dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors">
              {isDark
                ? <Sun className="w-[18px] h-[18px] text-amber-400" />
                : <Moon className="w-[18px] h-[18px] text-gray-600" />
              }
            </button>

            {/* Search toggle */}
            <button onClick={() => setIsMobileSearchOpen(v => !v)}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1e2130] hover:bg-gray-200 dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors">
              {isMobileSearchOpen
                ? <X className="w-[18px] h-[18px] text-gray-700 dark:text-gray-300" />
                : <Search className="w-[18px] h-[18px] text-gray-700 dark:text-gray-300" />
              }
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { if (!currentUser) { requestLogin(); return; } setIsNotificationOpen(!isNotificationOpen); }}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-[#1e2130] hover:bg-gray-200 dark:hover:bg-[#252a3d] flex items-center justify-center transition-colors relative">
                <Bell className="w-[18px] h-[18px] text-gray-700 dark:text-gray-300" />
                {(unreadNotificationCount + pendingJoinRequestCount) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#12151f]" />
                )}
              </button>
              <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} onNotificationRead={loadUnreadCount} />
            </div>

            {/* Avatar */}
            <div className="relative">
              <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-300 shadow-sm flex items-center justify-center p-0">
                {renderAvatar('sm')}
              </button>
              <UserDropdown isOpen={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} user={currentUser} />
            </div>
          </div>
        </div>

        {/* Mobile search overlay — slides down from below the top bar */}
        {isMobileSearchOpen && (
          <div ref={mobileSearchRef}
            className="absolute top-full left-0 right-0 md:hidden bg-white dark:bg-[#12151f] border-b border-gray-200 dark:border-[#1e2130] shadow-lg px-4 py-3 z-70">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v);
                  if (!v.trim()) { setSuggestions([]); setShowSuggestions(false); }
                }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    navigate(`/find-people?q=${encodeURIComponent(searchQuery)}`);
                    setShowSuggestions(false);
                    setIsMobileSearchOpen(false);
                  }
                }}
                placeholder={t('navbar.searchMobilePlaceholder')}
                className="w-full h-10 pl-9 pr-4 rounded-full bg-gray-100 dark:bg-[#1e2130] text-sm border border-gray-200 dark:border-[#2b2f45] focus:outline-none focus:border-blue-500 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="mt-2 bg-white dark:bg-[#1a1d28] rounded-xl shadow-xl border border-gray-100 dark:border-[#2b2f45] max-h-64 overflow-y-auto">
                {suggestions.map((user) => {
                  const safeUsername = user.username ?? 'U';
                  const initials = user.fullName
                    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : safeUsername.charAt(0).toUpperCase();
                  return (
                    <button key={user.id}
                      onClick={() => { handleSuggestionClick(user); setIsMobileSearchOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#1e2130] text-left">
                      {user.avatar
                        ? <img src={user.avatar} alt={user.fullName} className="w-9 h-9 rounded-full object-cover" />
                        : <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">{initials}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user.fullName || safeUsername}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{safeUsername}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ═══════════════════════════════════════════════════════
          MOBILE BOTTOM NAVIGATION  (md:hidden, fixed bottom)
      ═══════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 md:hidden bg-white dark:bg-[#12151f] border-t border-gray-200 dark:border-[#1e2130] flex items-stretch z-50 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {[
          { to: '/home',        icon: Home,          labelKey: 'mobileNav.home' as const, requireAuth: false },
          { to: '/watch',       icon: Video,         labelKey: 'mobileNav.video' as const, requireAuth: true },
          { to: '/marketplace', icon: Store,         labelKey: 'mobileNav.marketplace' as const, requireAuth: true },
          { to: '/groups',      icon: Users,         labelKey: 'mobileNav.groups' as const, requireAuth: true },
          { to: '/messenger',   icon: MessageCircle, labelKey: 'mobileNav.messages' as const, requireAuth: true },
        ].map(({ to, icon: Icon, labelKey, requireAuth }) => {
          const needsAuth = requireAuth && !currentUser;
          const cls = `flex flex-col items-center justify-center gap-1 flex-1 transition-all ${
            isActive(to)
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`;
          const inner = (
            <>
              <span className={`flex items-center justify-center rounded-2xl px-3 py-1.5 transition-all ${isActive(to) ? 'bg-blue-50 dark:bg-blue-500/15' : ''}`}>
                <Icon strokeWidth={isActive(to) ? 2.25 : 2} className="w-[21px] h-[21px]" />
              </span>
              <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
            </>
          );

          if (to === '/messenger') {
            return <button key={to} type="button" onClick={handleMessengerClick} className={cls}>{inner}</button>;
          }
          if (needsAuth) {
            return <button key={to} type="button" onClick={requestLogin} className={cls}>{inner}</button>;
          }
          return <Link key={to} to={to} className={cls}>{inner}</Link>;
        })}
      </nav>

      {/* Messenger loading overlay */}
      {loadingMessenger && (
        <div className="fixed inset-0 z-9999 bg-white/80 dark:bg-[#0c0e14]/85 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-[3px] border-gray-200 dark:border-[#2b2f45]" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa]">{t('navbar.loadingMessenger')}</p>
              <p className="text-xs text-gray-400 dark:text-[#7e89a6] mt-1">{t('navbar.loadingMessengerSub')}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}