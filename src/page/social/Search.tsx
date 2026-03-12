import { useState } from 'react';
import { Search as SearchIcon, User, FileText, Image, Video, Users, File } from 'lucide-react';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('travel photos');
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'posts', label: 'Posts' },
    { id: 'people', label: 'People' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'groups', label: 'Groups' },
    { id: 'pages', label: 'Pages' },
  ];

  const people = [
    { id: 1, name: 'Sarah Johnson', avatar: 'SJ', color: '#42B72A', role: 'Travel photographer', mutual: 234 },
    { id: 2, name: 'Mike Travel', avatar: 'MT', color: '#FF6B6B', role: 'World traveler', mutual: 89 },
  ];

  const posts = [
    { id: 1, author: 'Emma Davis', avatar: 'ED', color: '#4ECDC4', content: 'Amazing travel photos from my trip to Bali! 🌴\nThe sunsets were absolutely breathtaking...', time: 'March 15 at 2:30 PM', likes: 128, comments: 24 },
    { id: 2, author: 'Travel Enthusiasts', avatar: 'TE', color: '#FFD93D', content: 'Share your best travel photos from 2026!\nWe\'d love to see where you\'ve been...', time: 'Group · March 10', members: '2.5k', posts: 145 },
  ];

  const photos = [
    { id: 1, emoji: '🏖️', title: 'Beach sunset' },
    { id: 2, emoji: '🏔️', title: 'Mountain view' },
    { id: 3, emoji: '🌴', title: 'Tropical paradise' },
    { id: 4, emoji: '🗼', title: 'City landmarks' },
  ];

  const groups = [
    { id: 1, name: 'Travel Photography Club', members: '5.2k', avatar: 'TPC', color: '#1877F2' },
    { id: 2, name: 'Adventure Travel', members: '3.8k', avatar: 'AT', color: '#42B72A' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl">
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
            <SearchIcon className="w-5 h-5 text-[#1877F2]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-12 pl-12 pr-4 rounded-full border-2 border-[#1877F2] bg-white focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#F0F2F5] rounded-lg p-2 mb-6 flex gap-2 flex-wrap">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${
              activeFilter === filter.id
                ? 'bg-[#E7F3FF] text-[#1877F2]'
                : 'text-[#65676B] hover:bg-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - People & Posts */}
        <div className="lg:col-span-2 space-y-6">
          {/* People Section */}
          {(activeFilter === 'all' || activeFilter === 'people') && (
            <div>
              <h2 className="text-base font-semibold text-[#65676B] mb-3">People</h2>
              <div className="space-y-3">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="bg-[#F0F2F5] rounded-lg p-4 flex items-center gap-4 hover:bg-[#E4E6EB] transition-colors"
                  >
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
                      style={{ backgroundColor: person.color }}
                    >
                      {person.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#050505] mb-1">{person.name}</p>
                      <p className="text-sm text-[#65676B]">
                        {person.role} · {person.mutual} mutual friends
                      </p>
                    </div>
                    <button className="h-8 px-4 bg-[#1877F2] text-white text-sm font-semibold rounded-md hover:bg-[#166FE5] transition-colors shrink-0">
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeFilter === 'all' || activeFilter === 'posts') && (
            <div>
              <h2 className="text-base font-semibold text-[#65676B] mb-3">Posts</h2>
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: post.color }}
                      >
                        {post.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-[#050505] text-sm">{post.author}</p>
                        <p className="text-xs text-[#65676B]">{post.time}</p>
                      </div>
                    </div>
                    <p className="text-[#050505] mb-3 whitespace-pre-line">{post.content}</p>
                    <div className="flex items-center gap-2 text-sm text-[#65676B]">
                      {post.likes && (
                        <>
                          <span>❤️ 👍 {post.likes} likes</span>
                          <span>·</span>
                          <span>{post.comments} comments</span>
                        </>
                      )}
                      {post.members && (
                        <>
                          <span>👥 {post.members} members</span>
                          <span>·</span>
                          <span>{post.posts} posts this week</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Photos & Groups */}
        <div className="space-y-6">
          {/* Photos Section */}
          {(activeFilter === 'all' || activeFilter === 'photos') && (
            <div>
              <h2 className="text-base font-semibold text-[#65676B] mb-3">Photos</h2>
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-[#E4E6EB] rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                    <span className="text-5xl mb-2">{photo.emoji}</span>
                    <p className="text-xs text-[#65676B]">{photo.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups Section */}
          {(activeFilter === 'all' || activeFilter === 'groups') && (
            <div>
              <h2 className="text-base font-semibold text-[#65676B] mb-3">Groups</h2>
              <div className="space-y-3">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-[#F0F2F5] rounded-lg p-4 hover:bg-[#E4E6EB] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: group.color }}
                      >
                        {group.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-[#050505]">{group.name}</p>
                        <p className="text-xs text-[#65676B]">Public group · {group.members} members</p>
                      </div>
                    </div>
                    <button className="w-full h-8 bg-[#1877F2] text-white text-sm font-semibold rounded-md hover:bg-[#166FE5] transition-colors">
                      Join Group
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
