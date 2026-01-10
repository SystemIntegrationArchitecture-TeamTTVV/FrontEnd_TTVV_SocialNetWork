import { Link } from 'react-router-dom';
import { Image, Smile, Activity, MessageCircle, Share2, Heart, MoreHorizontal, Plus } from 'lucide-react';
import { useState } from 'react';

export default function Newsfeed() {
  const [posts] = useState([
    {
      id: 1,
      author: { name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A' },
      time: '2h',
      location: '🌍',
      content: 'Just finished an amazing hike! The view was breathtaking 🏔️',
      image: '🏔️',
      likes: 124,
      comments: 28,
      shares: 12,
      reactions: ['❤️', '👍', '😊'],
    },
    {
      id: 2,
      author: { name: 'Mike Chen', avatar: 'MC', color: '#FF6B6B' },
      time: '5h',
      location: '',
      content: 'Working on a new project. Excited to share it soon! 💻',
      image: '',
      likes: 89,
      comments: 15,
      shares: 5,
      reactions: ['👍', '😊'],
    },
  ]);

  const stories = [
    { name: 'Sarah', gradient: 'from-pink-500 to-cyan-400', avatar: 'SJ' },
    { name: 'Mike', gradient: 'from-green-400 to-yellow-300', avatar: 'MC' },
    { name: 'Emma', gradient: 'from-purple-400 to-pink-300', avatar: 'ED' },
    { name: 'Alex', gradient: 'from-blue-400 to-indigo-500', avatar: 'AP' },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Stories Section - Simplified */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
        <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
          {/* Your Story */}
          <div className="shrink-0 w-32">
            <div className="w-32 h-48 rounded-3xl bg-gray-100 flex flex-col items-center justify-center cursor-pointer hover:opacity-95 transition-all group">
              <div className="w-16 h-16 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">JD</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-green-500 border-4 border-white flex items-center justify-center -mt-3">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-base text-gray-600 text-center mt-4 font-semibold">Your story</p>
          </div>

          {/* Friends Stories */}
          {stories.map((story, index) => (
            <div key={index} className="shrink-0 w-32 cursor-pointer group">
              <div className={`w-32 h-48 rounded-3xl bg-gradient-to-b ${story.gradient} p-0.5 group-hover:scale-105 transition-transform`}>
                <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500 border-4 border-white flex items-center justify-center">
                    <span className="text-white text-base font-bold">{story.avatar}</span>
                  </div>
                </div>
              </div>
              <p className="text-base text-gray-600 text-center mt-4 font-semibold truncate">{story.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Post - Cleaner */}
      <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-lg">JD</span>
          </div>
          <Link
            to="/post/create"
            className="flex-1 h-16 px-6 rounded-full bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all text-left flex items-center text-gray-500 hover:text-gray-700 cursor-pointer text-lg font-medium"
          >
            What's on your mind, John?
          </Link>
        </div>
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-gray-100">
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <Image className="w-7 h-7 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg text-gray-600 font-semibold">Photo</span>
          </Link>
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <Smile className="w-7 h-7 text-yellow-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg text-gray-600 font-semibold">Feeling</span>
          </Link>
          <Link
            to="/post/create"
            className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <Activity className="w-7 h-7 text-red-500 group-hover:scale-110 transition-transform" />
            <span className="text-lg text-gray-600 font-semibold">Activity</span>
          </Link>
        </div>
      </div>

      {/* Posts Feed - Modern */}
      <div className="space-y-8">
        {posts.map((post) => (
          <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200">
            {/* Post Header */}
            <div className="p-6 lg:p-8 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                  style={{ backgroundColor: post.author.color }}
                >
                  {post.author.avatar}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">{post.author.name}</p>
                  <div className="flex items-center gap-3 text-base text-gray-500">
                    <span>{post.time}</span>
                    {post.location && (
                      <>
                        <span>·</span>
                        <span>{post.location}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button className="w-12 h-12 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <MoreHorizontal className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-6 lg:px-8 pb-6">
              <p className="text-gray-900 mb-5 leading-relaxed text-lg">{post.content}</p>
              {post.image && (
                <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-5 overflow-hidden">
                  <span className="text-9xl">{post.image}</span>
                </div>
              )}

              {/* Post Stats - Simplified */}
              <div className="flex items-center justify-between text-base text-gray-500 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center -space-x-1">
                    {post.reactions.slice(0, 3).map((reaction, idx) => (
                      <span key={idx} className="text-2xl">{reaction}</span>
                    ))}
                  </div>
                  <span className="font-semibold text-lg">{post.likes}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{post.comments} comments</span>
                  <span>·</span>
                  <span className="font-medium">{post.shares} shares</span>
                </div>
              </div>

              {/* Post Actions - Cleaner */}
              <div className="border-t border-gray-100 pt-4 mt-4 flex items-center">
                <button className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group">
                  <Heart className="w-7 h-7 text-gray-500 group-hover:text-red-500 group-hover:fill-red-500 transition-all" />
                  <span className="text-lg text-gray-600 font-semibold group-hover:text-red-500">Like</span>
                </button>
                <Link
                  to={`/post/${post.id}/comments`}
                  className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <MessageCircle className="w-7 h-7 text-gray-500 group-hover:text-blue-500 transition-all" />
                  <span className="text-lg text-gray-600 font-semibold group-hover:text-blue-500">Comment</span>
                </Link>
                <Link
                  to={`/post/${post.id}/share`}
                  className="flex-1 flex items-center justify-center gap-4 py-4 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <Share2 className="w-7 h-7 text-gray-500 group-hover:text-green-500 transition-all" />
                  <span className="text-lg text-gray-600 font-semibold group-hover:text-green-500">Share</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
