import { Link, useParams } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="space-y-4 pb-8">
      {/* Cover Photo */}
      <div className="relative h-[280px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden">
        <button className="absolute bottom-3 right-3 bg-white/95 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-white transition-colors text-sm font-medium text-gray-700">
          <Camera className="w-4 h-4" />
          <span>Edit Cover</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl p-4 -mt-16 relative border border-gray-200">
        <div className="flex items-end justify-between mb-4 pt-12">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                <span className="text-white font-semibold text-2xl">JD</span>
              </div>
              <button className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center shadow-sm transition-colors">
                <Camera className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">John Doe</h1>
              <p className="text-sm text-gray-600">1,234 friends</p>
            </div>
          </div>
          <div className="flex gap-2 pb-1">
            <button className="h-10 px-4 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              <span>Add Story</span>
            </button>
            <Link
              to="/profile/edit"
              className="h-10 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
            >
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-t border-gray-200 pt-3 overflow-x-auto scrollbar-hide">
          {[
            { id: 'posts', label: 'Posts' },
            { id: 'about', label: 'About' },
            { id: 'friends', label: 'Friends' },
            { id: 'photos', label: 'Photos' },
            { id: 'videos', label: 'Videos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 font-medium text-base relative transition-all duration-200 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Post Card Example */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500 text-center py-6">No posts to show</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Intro</h3>
            <p className="text-xs text-gray-600 mb-3">No introduction yet</p>
            <button className="w-full h-9 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm">
              Edit Details
            </button>
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Photos</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                ></div>
              ))}
            </div>
            <Link
              to={`/profile/${id}/photos`}
              className="block text-center text-blue-600 text-xs font-medium hover:underline"
            >
              See All Photos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
