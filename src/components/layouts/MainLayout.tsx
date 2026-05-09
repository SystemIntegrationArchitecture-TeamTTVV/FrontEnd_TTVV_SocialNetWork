import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../navbar/Navbar';
import LeftSidebar from '../sidebar/LeftSidebar';
import RightSidebar from '../sidebar/RightSidebar';
import ChatBoxManager from '../chatbox/ChatBoxManager';
import MiniMusicPlayer from '../music/MiniMusicPlayer';
import AIChatWidget from '../ai/AIChatWidget';
import FeatureGuideBot from '../guide/FeatureGuideBot';
import AuthRequiredModal from '../common/AuthRequiredModal';
import { AUTH_REQUIRED_EVENT } from '../../utils/authPrompt';

export default function MainLayout() {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fromPath, setFromPath] = useState<string | undefined>(undefined);
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('left-sidebar-collapsed') === '1';
  });
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('right-sidebar-collapsed') === '1';
  });
  
  // Chỉ ẩn sidebars khi đang ở trang messenger full page
  const isMessengerPage = location.pathname.startsWith('/messenger');
  /** Flappy fullscreen: không Navbar / sidebar / widget để khỏi chồng UI (mobile + desktop) */
  const isFlappyFullscreen = location.pathname.startsWith('/games/flappy');

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ from?: string }>;
      const nextFrom = custom.detail?.from || location.pathname;
      setFromPath(nextFrom);
      setShowAuthModal(true);
    };

    window.addEventListener(AUTH_REQUIRED_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(AUTH_REQUIRED_EVENT, handler as EventListener);
    };
  }, [location.pathname]);

  useEffect(() => {
    window.localStorage.setItem('left-sidebar-collapsed', isLeftSidebarCollapsed ? '1' : '0');
  }, [isLeftSidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem('right-sidebar-collapsed', isRightSidebarCollapsed ? '1' : '0');
  }, [isRightSidebarCollapsed]);

  return (
    <div className="app-shell h-screen flex flex-col overflow-hidden">
      {!isFlappyFullscreen && <Navbar />}
      
      <div className={`flex flex-1 overflow-hidden ${isFlappyFullscreen ? '' : 'pt-14'}`}>
        {/* LEFT SIDEBAR — cùng nền feed, viền tinh như Facebook */}
        {!isMessengerPage && !isFlappyFullscreen && (
          <aside
            className={`hidden lg:block h-full overflow-y-auto scrollbar-hide ui-surface border-r transition-all duration-200 ${
              isLeftSidebarCollapsed ? 'w-24' : 'w-64 xl:w-72'
            }`}
          >
            <LeftSidebar
              collapsed={isLeftSidebarCollapsed}
              onToggleCollapse={() => setIsLeftSidebarCollapsed((prev) => !prev)}
            />
          </aside>
        )}

        
        {/* MAIN CONTENT */}
        <main className={`flex-1 h-full overflow-y-auto scrollbar-hide ${
          isFlappyFullscreen
            ? 'px-0 pt-0 pb-0 max-w-full overflow-hidden'
            : isMessengerPage
            ? 'px-0 max-w-full pb-16 md:pb-0'
            : 'px-3 sm:px-5 lg:px-7 pt-4 sm:pt-5 pb-20 md:pb-8'
        }`}>
          <div className={
            isFlappyFullscreen
              ? 'h-full min-h-0 w-full max-w-none'
              : isMessengerPage
              ? 'w-full'
                : 'mx-auto max-w-full sm:max-w-225 lg:max-w-260 xl:max-w-275'
          }>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10, scale: 0.992 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              >
                {isMessengerPage || isFlappyFullscreen ? (
                  <Outlet />
                ) : (
                  <div className="route-surface ui-surface animate-soft-float">
                    <div className="route-frame bg-white/96 dark:bg-[#171b27]/96">
                      <Outlet />
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        
        {/* RIGHT SIDEBAR */}
        {!isMessengerPage && !isFlappyFullscreen && (
          <aside
            className={`hidden xl:block h-full overflow-y-auto scrollbar-hide ui-surface border-l transition-all duration-200 ${
              isRightSidebarCollapsed ? 'w-24' : 'w-80'
            }`}
          >
            <RightSidebar
              collapsed={isRightSidebarCollapsed}
              onToggleCollapse={() => setIsRightSidebarCollapsed((prev) => !prev)}
            />
          </aside>
        )}

      </div>
      
      {!isFlappyFullscreen && <ChatBoxManager />}
      {!isFlappyFullscreen && <MiniMusicPlayer />}
      {!isFlappyFullscreen && !isMessengerPage && <AIChatWidget />}
      {!isFlappyFullscreen && !isMessengerPage && <FeatureGuideBot />}
      <AuthRequiredModal
        open={showAuthModal}
        fromPath={fromPath}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}