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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex pt-20">
        {!isMessengerPage && <LeftSidebar />}
        <main className={`flex-1 mx-auto min-w-0 w-full transition-all duration-300 ${
          isMessengerPage 
            ? 'px-0 max-w-full' 
            : 'px-8 lg:px-10 py-10 max-w-[900px] lg:max-w-[1000px] xl:max-w-[1100px]'
        }`}>
          <Outlet />
        </main>
        {!isMessengerPage && <RightSidebar />}
      </div>
      <ChatBoxManager />
    </div>
  );
}
