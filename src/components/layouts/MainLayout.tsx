import { Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../navbar/Navbar';
import LeftSidebar from '../sidebar/LeftSidebar';
import RightSidebar from '../sidebar/RightSidebar';
import ChatBoxManager from '../chatbox/ChatBoxManager';
import MiniMusicPlayer from '../music/MiniMusicPlayer';
import AIChatWidget from '../ai/AIChatWidget';
import AuthRequiredModal from '../common/AuthRequiredModal';
import { AUTH_REQUIRED_EVENT } from '../../utils/authPrompt';

export default function MainLayout() {
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [fromPath, setFromPath] = useState<string | undefined>(undefined);
  
  // Chỉ ẩn sidebars khi đang ở trang messenger full page
  const isMessengerPage = location.pathname.startsWith('/messenger');

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

  return (
    <div className="h-screen bg-[#E9EAEC] dark:bg-[#0c0e14] flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden pt-20">
        {/* LEFT SIDEBAR */}
        {!isMessengerPage && (
          <aside className="hidden lg:block w-64 xl:w-72 h-full overflow-y-auto scrollbar-hide bg-white dark:bg-[#13151f] border-r-2 border-gray-300 dark:border-[#22263a]">
            <LeftSidebar />
          </aside>
        )}
        
        {/* MAIN CONTENT */}
        <main className={`flex-1 h-full overflow-y-auto scrollbar-hide ${
          isMessengerPage 
            ? 'px-0 max-w-full' 
            : 'px-4 sm:px-8 lg:px-10 py-6 sm:py-10'
        }`}>
          <div className={isMessengerPage ? 'w-full' : 'mx-auto max-w-full sm:max-w-225 lg:max-w-250 xl:max-w-275'}>
            <Outlet />
          </div>
        </main>
        
        {/* RIGHT SIDEBAR */}
        {!isMessengerPage && (
          <aside className="hidden xl:block w-80 h-full overflow-y-auto scrollbar-hide border-l-2 border-gray-300 dark:border-[#22263a]">
            <RightSidebar />
          </aside>
        )}
      </div>
      
      <ChatBoxManager />
      <MiniMusicPlayer />
      <AIChatWidget />
      <AuthRequiredModal
        open={showAuthModal}
        fromPath={fromPath}
        onClose={() => setShowAuthModal(false)}
      />
      
      {/* CSS để ẩn scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}