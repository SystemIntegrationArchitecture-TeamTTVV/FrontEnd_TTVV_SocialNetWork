import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../navbar/Navbar';
import LeftSidebar from '../sidebar/LeftSidebar';
import RightSidebar from '../sidebar/RightSidebar';
import ChatBoxManager from '../chatbox/ChatBoxManager';

export default function MainLayout() {
  const location = useLocation();
  
  // Chỉ ẩn sidebars khi đang ở trang messenger full page
  const isMessengerPage = location.pathname.startsWith('/messenger');

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Navbar />
      
      <div className="flex flex-1 overflow-hidden pt-20">
        {/* LEFT SIDEBAR - Scroll riêng */}
        {!isMessengerPage && (
          <aside className="w-64 xl:w-72 h-full overflow-y-auto scrollbar-hide bg-white border-r border-gray-200">
            <LeftSidebar />
          </aside>
        )}
        
        {/* MAIN CONTENT - Scroll riêng */}
        <main className={`flex-1 h-full overflow-y-auto scrollbar-hide ${
          isMessengerPage 
            ? 'px-0 max-w-full' 
            : 'px-8 lg:px-10 py-10'
        }`}>
          <div className={isMessengerPage ? 'w-full' : 'mx-auto max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px]'}>
            <Outlet />
          </div>
        </main>
        
        {/* RIGHT SIDEBAR - Scroll riêng */}
        {!isMessengerPage && (
          <aside className="w-64 xl:w-72 h-full overflow-y-auto scrollbar-hide bg-white border-l border-gray-200">
            <RightSidebar />
          </aside>
        )}
      </div>
      
      <ChatBoxManager />
      
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