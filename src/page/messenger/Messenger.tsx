import { Link, useNavigate } from 'react-router-dom';
import { Settings, Edit, Search, Phone, Video, Info, Plus, Smile, Paperclip, Send } from 'lucide-react';
import { useState } from 'react';

export default function Messenger() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState(1);

  const conversations = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      color: '#42B72A',
      online: true,
      lastMessage: 'Bạn: Hẹn gặp lại sau nhé!',
      time: '2h',
      unread: 0,
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: 'MC',
      color: '#FF6B6B',
      online: true,
      lastMessage: 'Được rồi, cảm ơn!',
      time: '5h',
      unread: 0,
    },
    {
      id: 3,
      name: 'Emma Davis',
      avatar: 'ED',
      color: '#4ECDC4',
      online: false,
      lastMessage: 'Emma: Xem này này!',
      time: 'Hôm qua',
      unread: 2,
    },
    {
      id: 4,
      name: 'Alex Park',
      avatar: 'AP',
      color: '#FFD93D',
      online: false,
      lastMessage: 'Alex: Haha 😂',
      time: '2 ngày',
      unread: 0,
    },
    {
      id: 5,
      name: 'Lisa Nguyen',
      avatar: 'LN',
      color: '#9B59B6',
      online: false,
      lastMessage: 'Lisa: Ok bạn nhé!',
      time: '3 ngày',
      unread: 0,
    },
    {
      id: 6,
      name: 'Nhóm bạn thân 🎉',
      avatar: 'GC',
      color: '#E4E6EB',
      online: false,
      lastMessage: 'Sarah: Đi chơi cuối tuần',
      time: '4 ngày',
      unread: 0,
      isGroup: true,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Chào bạn! Hôm nay thế nào?\n😊',
      time: '9:30 SA',
      isMe: false,
    },
    {
      id: 2,
      sender: 'Me',
      senderId: 0,
      content: 'Mình rất tốt, cảm ơn bạn!\nCòn bạn thì sao?',
      time: '9:32 SA',
      isMe: true,
    },
    {
      id: 3,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Tuyệt vời! Cuối tuần này có kế hoạch gì chưa? 🎉',
      time: '9:35 SA',
      isMe: false,
    },
    {
      id: 4,
      sender: 'Me',
      senderId: 0,
      content: 'Chưa có kế hoạch cụ thể!\nMình đang nghĩ đi chơi đâu đó thư giãn 😎',
      time: '9:40 SA',
      isMe: true,
    },
    {
      id: 5,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: '',
      time: '9:45 SA',
      isMe: false,
      image: '🏖️',
    },
    {
      id: 6,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Đi biển nhé! Bạn nghĩ sao? 🌊',
      time: '9:48 SA',
      isMe: false,
    },
  ];

  const activeConversation = conversations.find((c) => c.id === activeChat);

  return (
    <div className="h-[calc(100vh-5rem)] bg-gray-50 flex">
      {/* Left Sidebar - Conversations */}
      <div className="w-[400px] border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <div className="flex gap-3">
            <button className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
              <Edit className="w-6 h-6 text-gray-700" />
            </button>
            <Link
              to="/messenger/settings"
              className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <Settings className="w-6 h-6 text-gray-700" />
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="p-5 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full h-14 pl-14 pr-5 rounded-full bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`p-5 cursor-pointer hover:bg-gray-50 transition-colors ${
                activeChat === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {conv.isGroup ? (
                    <div className="relative w-16 h-16">
                      <div className="absolute top-0 left-0 w-12 h-12 rounded-xl bg-green-500 border-4 border-white flex items-center justify-center shadow-sm">
                        <span className="text-white text-base font-bold">S</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-12 h-12 rounded-xl bg-red-500 border-4 border-white flex items-center justify-center shadow-sm">
                        <span className="text-white text-base font-bold">M</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                        style={{ backgroundColor: conv.color }}
                      >
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                      )}
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900 text-lg truncate">{conv.name}</p>
                    <span className="text-base text-gray-500 shrink-0">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-base text-gray-600 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="w-7 h-7 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center shrink-0">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        {activeConversation && (
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-5">
              {activeConversation.isGroup ? (
                <div className="relative w-16 h-16 shrink-0">
                  <div className="absolute top-0 left-0 w-12 h-12 rounded-xl bg-green-500 border-4 border-white flex items-center justify-center shadow-sm">
                    <span className="text-white text-base font-bold">S</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 rounded-xl bg-red-500 border-4 border-white flex items-center justify-center shadow-sm">
                    <span className="text-white text-base font-bold">M</span>
                  </div>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{ backgroundColor: activeConversation.color }}
                  >
                    {activeConversation.avatar}
                  </div>
                  {activeConversation.online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-4 border-white"></div>
                  )}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-xl">{activeConversation.name}</p>
                {activeConversation.online && (
                  <p className="text-base text-green-500 font-medium">● Active now</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Phone className="w-6 h-6 text-gray-700" />
              </button>
              <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Video className="w-6 h-6 text-gray-700" />
              </button>
              <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Info className="w-6 h-6 text-gray-700" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}`}
            >
              {!msg.isMe && (
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm"
                  style={{ backgroundColor: '#42B72A' }}
                >
                  {msg.sender.charAt(0)}
                </div>
              )}
              <div className={`max-w-[70%] ${msg.isMe ? 'text-right' : ''}`}>
                {msg.image ? (
                  <div className="w-[320px] h-[240px] bg-gray-200 rounded-3xl flex items-center justify-center mb-2 overflow-hidden shadow-sm">
                    <span className="text-7xl">{msg.image}</span>
                  </div>
                ) : (
                  <div
                    className={`rounded-3xl px-6 py-4 mb-2 shadow-sm ${
                      msg.isMe
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900 border border-gray-100'
                    }`}
                  >
                    <p className="whitespace-pre-line text-lg leading-relaxed">{msg.content}</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 px-2">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
              <Plus className="w-7 h-7 text-gray-600" />
            </button>
            <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
              <Paperclip className="w-7 h-7 text-gray-600" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-14 px-6 rounded-full bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg transition-all"
            />
            <button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0">
              <Smile className="w-7 h-7 text-gray-600" />
            </button>
            <button
              disabled={!message.trim()}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
                message.trim()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Conversation Info */}
      {activeConversation && (
        <div className="hidden xl:block w-[360px] border-l border-gray-200 bg-white p-6 overflow-y-auto">
          {/* Profile Section */}
          <div className="text-center mb-8">
            <div
              className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-white text-3xl font-bold shadow-md"
              style={{ backgroundColor: activeConversation.color }}
            >
              {activeConversation.avatar}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{activeConversation.name}</h3>
            {activeConversation.online && (
              <p className="text-base text-green-500 font-medium">● Active now</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <span className="text-3xl">👤</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">Profile</span>
            </button>
            <button className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <span className="text-3xl">🔔</span>
              </div>
              <span className="text-sm text-gray-600 font-medium">Mute</span>
            </button>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Customize Chat */}
          <div className="mb-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">Customize Chat</h4>
            <div className="space-y-3">
              {['🎨 Change Theme', '😊 Change Emoji', '✏️ Change Name'].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left text-base text-gray-700 font-semibold"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Media */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Photos & Videos</h4>
              <button className="text-base text-blue-600 hover:underline font-semibold">See all</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {['🏖️', '🌅', '🎉'].map((emoji, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-3xl cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Privacy & Support */}
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-4">Privacy & Support</h4>
            <div className="space-y-3">
              {['🔒 Disappearing Messages', '🔍 Search in Conversation'].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left text-base text-gray-700 font-semibold"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
