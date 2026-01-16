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
    <aside className="hidden lg:block w-72 px-4 py-6">
      <div className="space-y-2.5">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={index}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.isUser ? (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isActive 
                    ? 'bg-blue-500' 
                    : 'bg-blue-500'
                }`}>
                  <span className="text-white font-semibold text-sm">JD</span>
                </div>
              ) : (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <span className={`text-sm font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        
        <button className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 w-full text-gray-600 hover:text-gray-900 group">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors flex-shrink-0">
            <ChevronDown className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">See more</span>
        </button>
      </div>
    </aside>
  );
}
