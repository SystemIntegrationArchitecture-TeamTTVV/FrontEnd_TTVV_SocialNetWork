import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Bell, Share2 } from 'lucide-react';
import { useState } from 'react';
import { PlaneIcon, CameraIcon, GamepadIcon, BookIcon, ChefHatIcon } from '../../common/icons/IconComponents';

export default function Groups() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('your');

  const groupsManaged = [
    { id: 1, name: 'Travel Enthusiasts', members: '2.5k', avatar: 'plane', color: '#1877F2', hasNotification: true },
    { id: 2, name: 'Photography Club', members: '1.8k', avatar: 'camera', color: '#42B72A', hasNotification: false },
  ];

  const groupsJoined = [
    { id: 3, name: 'Gaming Việt Nam', members: '45.2k', avatar: 'gamepad', color: '#FF6B6B' },
    { id: 4, name: 'Book Lovers', members: '3.2k', avatar: 'book', color: '#4ECDC4' },
    { id: 5, name: 'Food & Cooking', members: '8.9k', avatar: 'chef', color: '#FFD93D' },
  ];

  const getAvatarIcon = (avatarType: string) => {
    switch (avatarType) {
      case 'plane': return <PlaneIcon className="w-6 h-6" />;
      case 'camera': return <CameraIcon className="w-6 h-6" />;
      case 'gamepad': return <GamepadIcon className="w-6 h-6" />;
      case 'book': return <BookIcon className="w-6 h-6" />;
      case 'chef': return <ChefHatIcon className="w-6 h-6" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl p-1.5 mb-6 flex gap-1.5 border border-gray-200">
        <button
          onClick={() => setActiveTab('your')}
          className={`flex-1 h-12 rounded-xl font-medium text-base transition-all duration-200 ${
            activeTab === 'your'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Your Groups
        </button>
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex-1 h-12 rounded-xl font-medium text-base transition-all duration-200 ${
            activeTab === 'discover'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          Discover
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
          />
        </div>
      </div>

      {/* Create Group Button */}
      <button className="w-full mb-6 h-12 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
        <Plus className="w-5 h-5" />
        <span>Create new group</span>
      </button>

      {/* Groups Managed */}
      {activeTab === 'your' && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">GROUPS YOU MANAGE</h2>
          <div className="space-y-3">
            {groupsManaged.map((group) => (
              <Link
                key={group.id}
                to={`/groups/${group.id}`}
                className="bg-white rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-all border border-gray-100 group"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${group.color}20`, color: group.color }}
                >
                  {getAvatarIcon(group.avatar)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 mb-1">{group.name}</p>
                  <p className="text-sm text-gray-600">{group.members} members</p>
                </div>
                {group.hasNotification && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Groups Joined */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
          {activeTab === 'your' ? "GROUPS YOU'VE JOINED" : 'SUGGESTED GROUPS'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupsJoined.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-gray-100 group"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${group.color}20`, color: group.color }}
              >
                {getAvatarIcon(group.avatar)}
              </div>
              <h3 className="font-semibold text-gray-900 text-center mb-1">{group.name}</h3>
              <p className="text-sm text-gray-600 text-center">{group.members} members</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
