import { useState } from 'react';
import { Search, Filter, Eye, Trash2, Ban, MessageSquare } from 'lucide-react';

type MessageTab = 'all' | 'reported' | 'spam' | 'blocked';

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState<MessageTab>('all');

  const tabs: { id: MessageTab; label: string; badge?: number }[] = [
    { id: 'all', label: 'Tất cả', badge: 128 },
    { id: 'reported', label: 'Bị báo cáo', badge: 7 },
    { id: 'spam', label: 'Spam', badge: 3 },
    { id: 'blocked', label: 'Bị chặn', badge: 2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tin nhắn</h1>
          <p className="text-lg text-gray-600">
            Theo dõi hội thoại, xử lý spam và báo cáo tin nhắn trong hệ thống.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-wrap gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && (
                  <span
                    className={`min-w-[28px] h-6 px-2 rounded-full text-xs flex items-center justify-center
                      ${isActive ? 'bg-white/15 text-white' : 'bg-gray-200 text-gray-700'}`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo người gửi, nội dung, ID hội thoại..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm md:text-base transition-all"
            />
          </div>
          <button
            type="button"
            className="h-12 px-5 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-sm md:text-base"
          >
            <Filter className="w-5 h-5" />
            Bộ lọc nâng cao
          </button>
        </div>
      </div>

      {/* Messages list placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách hội thoại ({tabs.find((t) => t.id === activeTab)?.label.toLowerCase()})
            </h2>
            <p className="text-sm text-gray-500">
              Tính năng thống kê & lọc chi tiết đang được phát triển. Hiện tại đây là giao diện mẫu để phù hợp với
              các trang admin khác.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
            <Eye className="w-4 h-4" />
            <span>Xem chi tiết</span>
            <Trash2 className="w-4 h-4 ml-3" />
            <span>Xóa hội thoại</span>
            <Ban className="w-4 h-4 ml-3" />
            <span>Chặn người dùng</span>
          </div>
        </div>

        <div className="mt-6 border border-gray-100 rounded-xl bg-gray-50/80 p-8 text-center">
          <MessageSquare className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-1">
            Khu vực quản lý tin nhắn sẽ sớm hoàn thiện
          </h3>
          <p className="text-sm text-gray-600 max-w-xl mx-auto">
            Bạn sẽ xem được danh sách hội thoại, lọc theo báo cáo, spam và thao tác chặn / xóa trực tiếp từ đây.
          </p>
        </div>
      </div>
    </div>
  );
}
