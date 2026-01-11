import { useState } from 'react';
import { Send, Image as ImageIcon, Smile, MoreVertical, Users, Settings, Search } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  // Mock group data
  const group = {
    id: id,
    name: 'Nhóm dự án',
    avatar: 'ND',
    color: '#42B72A',
    members: [
      { id: 1, name: 'Alex Chen', avatar: 'AC', color: '#1877F2', online: true },
      { id: 2, name: 'Maria Garcia', avatar: 'MG', color: '#FF6B6B', online: true },
      { id: 3, name: 'David Kim', avatar: 'DK', color: '#4ECDC4', online: false },
      { id: 4, name: 'You', avatar: 'ME', color: '#9B59B6', online: true },
    ],
  };

  const messages = [
    {
      id: 1,
      sender: { name: 'Alex Chen', avatar: 'AC', color: '#1877F2' },
      content: 'Chào mọi người! Meeting sáng mai lúc 9h nhé',
      time: '10:30',
      isMe: false,
    },
    {
      id: 2,
      sender: { name: 'Maria Garcia', avatar: 'MG', color: '#FF6B6B' },
      content: 'Ok, tôi sẽ có mặt đầy đủ',
      time: '10:32',
      isMe: false,
    },
    {
      id: 3,
      sender: { name: 'You', avatar: 'ME', color: '#9B59B6' },
      content: 'Tôi cũng sẽ tham gia',
      time: '10:35',
      isMe: true,
    },
    {
      id: 4,
      sender: { name: 'David Kim', avatar: 'DK', color: '#4ECDC4' },
      content: 'Cảm ơn mọi người!',
      time: '10:40',
      isMe: false,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('Send message:', message);
      setMessage('');
    }
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
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: group.color }}
          >
            {group.avatar}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{group.members.length} thành viên</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Search className="w-5 h-5 text-gray-700" />
          </button>
          <button className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
            <Users className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => navigate(`/messenger/${id}/settings`)}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.isMe ? 'flex-row-reverse' : ''}`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: msg.sender.color }}
            >
              {msg.sender.avatar}
            </div>
            <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
              {!msg.isMe && (
                <p className="text-sm font-semibold text-gray-700 mb-1">{msg.sender.name}</p>
              )}
              <div
                className={`px-4 py-3 rounded-2xl ${
                  msg.isMe
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-base">{msg.content}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-gray-700" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập tin nhắn..."
              className="w-full h-14 px-5 pr-14 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
              <Smile className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!message.trim()}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
              message.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
