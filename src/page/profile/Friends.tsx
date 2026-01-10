import { useState } from 'react';
import { Home, UserPlus, Lightbulb, Users, Calendar, MapPin, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Friends() {
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'requests', icon: UserPlus, label: 'Friend Requests', badge: 8 },
    { id: 'suggestions', icon: Lightbulb, label: 'Suggestions' },
    { id: 'all', icon: Users, label: 'All Friends' },
    { id: 'birthdays', icon: Calendar, label: 'Birthdays' },
    { id: 'custom', icon: MapPin, label: 'Custom Lists' },
  ];

  const requests = [
    { id: 1, name: 'Sarah Mitchell', avatar: 'SM', color: '#42B72A', mutual: 12 },
    { id: 2, name: 'Michael Chen', avatar: 'MC', color: '#FF6B6B', mutual: 8 },
    { id: 3, name: 'Emma Rodriguez', avatar: 'ER', color: '#4ECDC4', mutual: 25 },
  ];

  const suggestions = [
    { id: 4, name: 'Alex Thompson', avatar: 'AT', color: '#FFD93D', mutual: 5 },
    { id: 5, name: 'Lisa Anderson', avatar: 'LA', color: '#A8E6CF', mutual: 3 },
    { id: 6, name: 'David Park', avatar: 'DP', color: '#FFB6B9', mutual: 15 },
  ];

  return (
    <div className="min-h-screen bg-[#F0F2F5] flex">
      {/* Left Sidebar */}
      <aside className="w-80 bg-white shadow-sm p-4 shrink-0">
        <h1 className="text-2xl font-bold text-[#050505] mb-6">Friends</h1>

        {/* Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors relative ${
                  activeTab === tab.id
                    ? 'bg-[#E7F3FF] text-[#1877F2]'
                    : 'hover:bg-[#F0F2F5] text-[#050505]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="w-6 h-6 rounded-full bg-[#FF4444] text-white text-xs font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {/* Friend Requests Section */}
        {(activeTab === 'home' || activeTab === 'requests') && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#050505]">Friend Requests</h2>
              <Link to="/friends/requests" className="text-sm text-[#1877F2] hover:underline font-semibold">
                See all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-[#E4E6EB] flex items-center justify-center">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                      style={{ backgroundColor: request.color }}
                    >
                      {request.avatar}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-[#050505] mb-1">{request.name}</h3>
                    <p className="text-sm text-[#65676B] mb-4">{request.mutual} mutual friends</p>
                    <div className="space-y-2">
                      <button className="w-full h-10 bg-[#1877F2] text-white font-semibold rounded-md hover:bg-[#166FE5] transition-colors flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        <span>Confirm</span>
                      </button>
                      <button className="w-full h-10 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors flex items-center justify-center gap-2">
                        <X className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* People You May Know */}
        {(activeTab === 'home' || activeTab === 'suggestions') && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#050505]">People You May Know</h2>
              <button className="text-sm text-[#1877F2] hover:underline font-semibold">See all</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-[#E4E6EB] flex items-center justify-center">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-white font-semibold text-xl"
                      style={{ backgroundColor: suggestion.color }}
                    >
                      {suggestion.avatar}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-[#050505] mb-1">{suggestion.name}</h3>
                    <p className="text-sm text-[#65676B] mb-4">{suggestion.mutual} mutual friends</p>
                    <button className="w-full h-10 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors">
                      Add Friend
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
