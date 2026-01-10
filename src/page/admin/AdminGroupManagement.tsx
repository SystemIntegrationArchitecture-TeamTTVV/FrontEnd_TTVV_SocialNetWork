import { Search, Filter, Eye, Edit, Trash2, Users, Settings, FileText } from 'lucide-react';
import { useState } from 'react';

export default function AdminGroupManagement() {
  const [searchQuery, setSearchQuery] = useState('');

  const groups = [
    {
      id: 1,
      name: 'Nhóm bạn thân',
      description: 'Nhóm để chia sẻ khoảnh khắc với bạn bè',
      avatar: 'NB',
      color: '#9B59B6',
      members: 1250,
      posts: 345,
      createdAt: '01/01/2024',
      privacy: 'public',
    },
    {
      id: 2,
      name: 'Công nghệ thông tin',
      description: 'Thảo luận về công nghệ và lập trình',
      avatar: 'CT',
      color: '#1877F2',
      members: 850,
      posts: 567,
      createdAt: '15/02/2024',
      privacy: 'public',
    },
    {
      id: 3,
      name: 'Nhóm kín - Nội bộ',
      description: 'Nhóm riêng tư cho thành viên nội bộ',
      avatar: 'NK',
      color: '#42B72A',
      members: 45,
      posts: 23,
      createdAt: '10/03/2024',
      privacy: 'private',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý nhóm</h1>
          <p className="text-lg text-gray-600">Quản lý tất cả các nhóm trong hệ thống</p>
        </div>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm">
          + Tạo nhóm
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhóm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
          <button className="h-14 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center gap-2 transition-colors font-semibold text-lg">
            <Filter className="w-6 h-6" />
            Bộ lọc
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
                style={{ backgroundColor: group.color }}
              >
                {group.avatar}
              </div>
              <span
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  group.privacy === 'public' ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'
                }`}
              >
                {group.privacy === 'public' ? 'Công khai' : 'Riêng tư'}
              </span>
            </div>

            <h3 className="font-bold text-xl text-gray-900 mb-2">{group.name}</h3>
            <p className="text-base text-gray-600 mb-4 line-clamp-2">{group.description}</p>

            <div className="flex items-center gap-4 mb-4 text-base text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{group.members.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span className="font-semibold">{group.posts}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
              <button className="flex-1 w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                <Eye className="w-5 h-5" />
              </button>
              <button className="flex-1 w-11 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Edit className="w-5 h-5" />
              </button>
              <button className="flex-1 w-11 h-11 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="flex-1 w-11 h-11 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
