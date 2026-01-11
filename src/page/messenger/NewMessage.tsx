import { useState } from 'react';
import { Search, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NewMessage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  const contacts = [
    { id: 'alex-chen', name: 'Alex Chen', avatar: 'AC', color: '#1877F2', online: true },
    { id: 'maria-garcia', name: 'Maria Garcia', avatar: 'MG', color: '#42B72A', online: true },
    { id: 'david-kim', name: 'David Kim', avatar: 'DK', color: '#FF6B6B', online: false },
    { id: 'lisa-wang', name: 'Lisa Wang', avatar: 'LW', color: '#4ECDC4', online: true },
    { id: 'tom-brown', name: 'Tom Brown', avatar: 'TB', color: '#FFD93D', online: false },
    { id: 'sarah-jones', name: 'Sarah Jones', avatar: 'SJ', color: '#9B59B6', online: true },
  ];

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const removeContact = (id: string) => {
    setSelectedContacts((prev) => prev.filter((c) => c !== id));
  };

  const handleStartConversation = () => {
    if (selectedContacts.length > 0) {
      // Navigate to conversation or create new
      navigate('/messenger');
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
            <X className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tin nhắn mới</h1>
            <p className="text-sm text-gray-600">Chọn người nhận</p>
          </div>
        </div>
      </div>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Đến:</span>
            {selectedContacts.map((id) => {
              const contact = contacts.find((c) => c.id === id);
              if (!contact) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full"
                >
                  <span className="text-sm font-semibold text-blue-700">{contact.name}</span>
                  <button
                    onClick={() => removeContact(id)}
                    className="w-5 h-5 rounded-full hover:bg-blue-200 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-blue-700" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-14 pr-5 rounded-xl bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-4">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
            Gợi ý
          </h2>
          <div className="space-y-2">
            {filteredContacts.map((contact) => {
              const isSelected = selectedContacts.includes(contact.id);
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: contact.color }}
                    >
                      {contact.avatar}
                    </div>
                    {contact.online && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg text-gray-900">{contact.name}</p>
                    {contact.online && (
                      <p className="text-sm text-green-600 font-medium">Đang hoạt động</p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Start Conversation Button */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleStartConversation}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
            Bắt đầu cuộc trò chuyện
          </button>
        </div>
      )}
    </div>
  );
}
