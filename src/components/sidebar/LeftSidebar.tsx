import { Link, useLocation } from 'react-router-dom';
import { User, Users, Store, Video, Clock, Bookmark, ChevronDown } from 'lucide-react';

export default function LeftSidebar() {
  const location = useLocation();
  
  const menuItems = [
    { icon: User, label: 'John Doe', path: '/profile/1', isUser: true },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: Users, label: 'Groups', path: '/groups' },
    { icon: Store, label: 'Marketplace', path: '/marketplace' },
    { icon: Video, label: 'Watch', path: '/watch' },
    { icon: Clock, label: 'Memories', path: '/memories' },
    { icon: Bookmark, label: 'Saved', path: '/saved' },
  ];

  return (
    <aside className="hidden lg:block w-80 px-5 py-8">
      <div className="space-y-3">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-5 px-5 py-4 rounded-2xl transition-all group ${
                isActive
                  ? 'bg-blue-50 text-blue-600 shadow-sm'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {item.isUser ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-base">JD</span>
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
              )}
              <span className={`text-lg font-semibold ${
                isActive ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        <button className="flex items-center gap-5 px-5 py-4 rounded-2xl hover:bg-gray-50 transition-all w-full text-gray-600 hover:text-gray-900">
          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <ChevronDown className="w-6 h-6" />
          </div>
          <span className="text-lg font-semibold">See more</span>
        </button>
      </div>
    </aside>
  );
}
