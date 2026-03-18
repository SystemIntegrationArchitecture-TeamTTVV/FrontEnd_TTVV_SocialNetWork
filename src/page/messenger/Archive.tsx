import { useState } from 'react';
import { Search, Archive as ArchiveIcon, RotateCcw, Trash2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Archive() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const archivedConversations = [
    {
      id: 1,
      name: 'Alex Chen',
      avatar: 'AC',
      color: '#1877F2',
      lastMessage: 'Cảm ơn bạn đã giúp đỡ!',
      time: '2 tuần trước',
      type: 'user',
      unread: 0,
    },
    {
      id: 2,
      name: 'Nhóm dự án',
      avatar: 'ND',
      color: '#42B72A',
      lastMessage: 'Meeting sáng mai lúc 9h',
      time: '1 tháng trước',
      type: 'group',
      members: 5,
      unread: 0,
    },
    {
      id: 3,
      name: 'Maria Garcia',
      avatar: 'MG',
      color: '#FF6B6B',
      lastMessage: 'Hẹn gặp lại nhé!',
      time: '3 tháng trước',
      type: 'user',
      unread: 0,
    },
  ];

  const filteredConversations = archivedConversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUnarchive = (id: number) => {
    console.log('Unarchive:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Delete:', id);
  };

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/messenger')}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lưu trữ</h1>
            <p className="text-sm text-gray-600">{archivedConversations.length} cuộc trò chuyện đã lưu trữ</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/messenger/${conv.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: conv.color }}
                    >
                      {conv.avatar}
                    </div>
                    {conv.type === 'group' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Users className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-lg text-gray-900 truncate">{conv.name}</p>
                      <span className="text-sm text-gray-500 flex-shrink-0 ml-2">{conv.time}</span>
                    </div>
                    <p className="text-base text-gray-600 truncate">{conv.lastMessage}</p>
                    {conv.type === 'group' && (
                      <p className="text-sm text-gray-500 mt-1">{conv.members} thành viên</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnarchive(conv.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Bỏ lưu trữ"
                    >
                      <RotateCcw className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(conv.id);
                      }}
                      className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                      title="Xóa"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <ArchiveIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Không có cuộc trò chuyện nào</h3>
            <p className="text-base text-gray-600 mb-6">
              {searchQuery
                ? 'Không tìm thấy cuộc trò chuyện nào phù hợp'
                : 'Các cuộc trò chuyện đã lưu trữ sẽ xuất hiện ở đây'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/messenger')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Quay lại Messenger
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
