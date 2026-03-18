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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden pt-20">
        {/* LEFT SIDEBAR - Ẩn trên mobile/tablet, hiện từ lg trở lên */}
        {!isMessengerPage && (
          <aside className="hidden lg:block w-64 xl:w-72 h-full overflow-y-auto scrollbar-hide bg-white border-r border-gray-200">
            <LeftSidebar />
          </aside>
        )}
        
        {/* MAIN CONTENT - Scroll riêng */}
        <main className={`flex-1 h-full overflow-y-auto scrollbar-hide ${
          isMessengerPage 
            ? 'px-0 max-w-full' 
            : 'px-4 sm:px-8 lg:px-10 py-6 sm:py-10'
        }`}>
          <div className={isMessengerPage ? 'w-full' : 'mx-auto max-w-full sm:max-w-225 lg:max-w-250 xl:max-w-275'}>
            <Outlet />
          </div>
        </main>
        
        {/* RIGHT SIDEBAR - Ẩn trên mobile/tablet, hiện từ xl trở lên */}
        {!isMessengerPage && (
          <aside className="hidden xl:block w-80 h-full overflow-y-auto scrollbar-hide">
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