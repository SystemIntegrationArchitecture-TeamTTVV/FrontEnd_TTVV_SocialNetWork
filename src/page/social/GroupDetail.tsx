import { useParams, useNavigate } from 'react-router-dom';
import { Search, Check, Bell, Share2, MoreVertical, Image as ImageIcon, Smile } from 'lucide-react';
import { useState } from 'react';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discussion');

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Cover Photo */}
      <div className="h-[280px] bg-gradient-to-br from-[#1877F2] to-[#42B72A] relative">
        <div className="absolute inset-0 flex items-center justify-center text-6xl">
          🎮
        </div>
      </div>

      {/* Group Info Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-20 relative z-10">
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center text-4xl">
                🎮
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#050505] mb-2">Gaming Việt Nam</h1>
                <p className="text-[#65676B]">Nhóm công khai · 45.2K thành viên</p>
              </div>
            </div>
            <button className="w-10 h-10 rounded-full bg-[#E4E6EB] flex items-center justify-center hover:bg-[#D8DADF] transition-colors">
              <MoreVertical className="w-5 h-5 text-[#050505]" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="h-10 px-4 bg-[#1877F2] text-white font-bold rounded-md hover:bg-[#166FE5] transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Đã tham gia</span>
            </button>
            <button className="h-10 px-4 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span>Thông báo</span>
            </button>
            <button className="h-10 px-4 bg-[#E4E6EB] text-[#050505] font-semibold rounded-md hover:bg-[#D8DADF] transition-colors flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>Chia sẻ</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-4">
          <div className="flex items-center gap-2 p-2">
            {['discussion', 'featured', 'members', 'events', 'photos', 'videos', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-[#E7F3FF] text-[#1877F2]'
                    : 'text-[#65676B] hover:bg-[#F0F2F5]'
                }`}
              >
                {tab === 'discussion' ? 'Thảo luận' : 
                 tab === 'featured' ? 'Nổi bật' :
                 tab === 'members' ? 'Thành viên' :
                 tab === 'events' ? 'Sự kiện' :
                 tab === 'photos' ? 'Ảnh' :
                 tab === 'videos' ? 'Video' : 'Giới thiệu'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Create Post */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[#42B72A] flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <input
                  type="text"
                  placeholder="Bạn viết gì đi..."
                  className="flex-1 h-10 px-4 rounded-full bg-[#F0F2F5] border-none focus:outline-none focus:ring-2 focus:ring-[#1877F2]"
                />
              </div>
              <div className="flex items-center justify-around pt-3 border-t border-[#E4E6EB]">
                <button className="flex items-center gap-2 text-sm text-[#65676B] hover:text-[#050505] transition-colors">
                  <ImageIcon className="w-5 h-5 text-[#42B72A]" />
                  <span>Ảnh/Video</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-[#65676B] hover:text-[#050505] transition-colors">
                  <Smile className="w-5 h-5 text-[#F7B928]" />
                  <span>Cảm xúc</span>
                </button>
              </div>
            </div>

            {/* Posts will go here */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-[#65676B]">
              No posts yet. Be the first to post!
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* About */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-[#050505] mb-4">Giới thiệu</h3>
              <p className="text-sm text-[#050505] mb-2">Cộng đồng game thủ Việt Nam</p>
              <p className="text-sm text-[#65676B] mb-4">
                Nơi chia sẻ đam mê và kết nối game thủ khắp mọi miền
              </p>
              <div className="space-y-2 text-sm text-[#65676B] border-t border-[#E4E6EB] pt-4">
                <p>🌍 Nhóm công khai</p>
                <p>👁️ Hiển thị</p>
                <p>📍 Việt Nam</p>
              </div>
              <div className="border-t border-[#E4E6EB] mt-4 pt-4">
                <h4 className="font-semibold text-[#050505] mb-2">Hoạt động</h4>
                <p className="text-sm text-[#65676B]">120 bài viết hôm nay</p>
                <p className="text-sm text-[#65676B]">850 bài viết tháng này</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

