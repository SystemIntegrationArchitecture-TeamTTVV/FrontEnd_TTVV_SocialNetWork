import { Link, useParams } from 'react-router-dom';
import { Camera, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Profile() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('posts');

  return (
    <div className="space-y-4 pb-6">
      {/* Cover Photo */}
      <div className="relative h-[320px] bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden shadow-lg">
        <button className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-white transition-all shadow-md hover:shadow-lg">
          <Camera className="w-4 h-4 text-gray-700" />
          <span className="text-sm font-semibold text-gray-700">Edit Cover</span>
        </button>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl shadow-sm p-6 -mt-20 relative border border-gray-100">
        <div className="flex items-end justify-between mb-6 pt-16">
          <div className="flex items-end gap-5">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white flex items-center justify-center shadow-xl">
                <span className="text-white font-bold text-4xl">JD</span>
              </div>
              <button className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white border-2 border-gray-200 hover:border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-all">
                <Camera className="w-4 h-4 text-gray-700" />
              </button>
            </div>
            <div className="pb-2">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">John Doe</h1>
              <p className="text-gray-600 mb-1">1,234 friends</p>
            </div>
          </div>
          <div className="flex gap-3 pb-2">
            <button className="h-10 px-5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Add Story</span>
            </button>
            <Link
              to="/profile/edit"
              className="h-10 px-5 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              <span>Edit Profile</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-100">
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
              className={`px-5 py-3 font-semibold relative transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-xl"></div>
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
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <p className="text-gray-600 text-center py-8">No posts to show</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Intro Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Intro</h3>
            <p className="text-sm text-gray-600 mb-4">No introduction yet</p>
            <button className="w-full h-9 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors">
              Edit Details
            </button>
          </div>

          {/* Photos Card */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl hover:opacity-80 transition-opacity cursor-pointer"
                ></div>
              ))}
            </div>
            <Link
              to={`/profile/${id}/photos`}
              className="block text-center text-blue-600 text-sm font-semibold hover:underline"
            >
              See All Photos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
