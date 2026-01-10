import { Search, Filter, Eye, Trash2, Ban } from 'lucide-react';

export default function AdminMessages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý tin nhắn</h1>
          <p className="text-lg text-gray-600">Theo dõi và quản lý tin nhắn trong hệ thống</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <button className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
            <Filter className="w-6 h-6" />
            Bộ lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Chức năng đang phát triển</h3>
        <p className="text-base text-gray-600">Quản lý tin nhắn sẽ sớm có mặt</p>
      </div>
    </div>
  );
}
