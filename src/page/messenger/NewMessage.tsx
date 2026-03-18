import { useEffect, useMemo, useState } from 'react';
import { Search, X, Send } from 'lucide-react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { usersApi, type User } from '../../apis/users';
import { conversationsApi } from '../../apis/conversations';
import { useAuth } from '../../contexts/AuthContext';

interface NewMessageLocationState {
  createGroup?: boolean;
}

export default function NewMessage() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: NewMessageLocationState };
  const { user } = useAuth();
  const createGroup = location.state?.createGroup ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch users by search query (debounced)
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setSearching(true);
        const results = await usersApi.searchUsers(trimmed);
        const filtered = results.filter((u) => u.id !== user?.id);
        setSearchResults(filtered);
      } catch (err) {
        console.error('Failed to search users', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [searchQuery, user?.id]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const removeContact = (id: string) => {
    setSelectedContacts((prev) => prev.filter((c) => c !== id));
  };

  const isGroup = selectedContacts.length >= 2;
  const minimumReached = useMemo(() => {
    // Need at least 1 for direct, 2 (plus self) for group => total >=3
    return selectedContacts.length > 0 && (!isGroup || selectedContacts.length >= 2);
  }, [selectedContacts.length, isGroup]);

  const handleStartConversation = async () => {
    if (!user?.id) {
      setError('Bạn cần đăng nhập để bắt đầu trò chuyện');
      return;
    }
    if (!minimumReached) {
      setError('Chọn ít nhất 1 người (hoặc ≥2 để tạo nhóm ≥3 thành viên)');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      if (!isGroup) {
        // Direct chat with exactly 1 other user
        const otherUserId = selectedContacts[0];
        const conversation = await conversationsApi.getOrCreateDirectConversation(user.id, otherUserId);
        navigate('/messenger', { state: { openConversationId: conversation.id } });
      } else {
        // Group chat: current user + selected contacts => total >= 3
        const participantIds = Array.from(new Set([...selectedContacts, user.id]));
        if (participantIds.length < 3) {
          setError('Nhóm cần tối thiểu 3 thành viên (bao gồm bạn)');
          setCreating(false);
          return;
        }

        const conversation = await conversationsApi.createGroupConversation({
          participantIds,
          ownerId: user.id,
          adminIds: [user.id],
          groupName: groupName.trim() || 'Nhóm mới',
          isGroup: true,
        });

        navigate('/messenger', { state: { openConversationId: conversation.id } });
      }
    } catch (err: any) {
      console.error('Failed to start conversation', err);
      const message = err?.message || 'Không thể tạo cuộc trò chuyện';
      setError(message);
    } finally {
      setCreating(false);
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
            <h1 className="text-2xl font-bold text-gray-900">
              {createGroup ? 'Tạo nhóm chat' : 'Tin nhắn mới'}
            </h1>
            <p className="text-sm text-gray-600">
              {createGroup ? 'Chọn ít nhất 2 người để tạo nhóm (≥3 thành viên)' : 'Chọn người nhận'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Contacts */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">Đến:</span>
            {selectedContacts.map((id) => {
              const contact = searchResults.find((c) => c.id === id);
              const name = contact?.fullName || contact?.username || id;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full"
                >
                  <span className="text-sm font-semibold text-blue-700">{name}</span>
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
            placeholder={createGroup ? "Tìm kiếm thành viên..." : "Tìm kiếm người dùng..."}
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
            {searching && <div className="text-sm text-gray-500">Đang tìm kiếm...</div>}

            {!searching && searchResults.length === 0 && (
              <div className="text-sm text-gray-500">
                {createGroup ? 'Nhập để tìm thành viên (cần ít nhất 2 người)' : 'Nhập để tìm người dùng'}
              </div>
            )}
            
            {createGroup && selectedContacts.length === 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 font-medium">
                  💡 Chọn ít nhất 2 người để tạo nhóm chat (tổng cộng ≥3 thành viên bao gồm bạn)
                </p>
              </div>
            )}

            {searchResults.map((contact) => {
              if (!contact.id) return null;
              const isSelected = selectedContacts.includes(contact.id);
              const color = '#42B72A';
              const initials =
                contact.fullName?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ||
                contact.username?.slice(0, 2).toUpperCase() ||
                'US';
              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id!)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                    isSelected
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-lg text-gray-900">{contact.fullName || contact.username}</p>
                    <p className="text-sm text-gray-500">{contact.email}</p>
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

      {isGroup && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Tên nhóm (tùy chọn, tối thiểu 3 thành viên)
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Nhập tên nhóm..."
            className="w-full h-12 px-4 rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {error && (
        <div className="px-6 py-3 text-sm text-red-600 bg-red-50 border-t border-red-100">
          {error}
        </div>
      )}

      {/* Start Conversation Button */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={handleStartConversation}
            disabled={creating}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            {creating ? 'Đang tạo...' : isGroup ? 'Tạo nhóm (≥3 người)' : 'Bắt đầu trò chuyện'}
          </button>
        </div>
      )}
    </div>
  );
}
