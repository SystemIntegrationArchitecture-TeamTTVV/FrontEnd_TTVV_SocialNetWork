import { useEffect, useMemo, useState } from 'react';
import { useChatBox } from '../../contexts/ChatBoxContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import type { ChatContact } from '../../types/chat';

type ContactWithLastMessage = ChatContact & {
  lastMessage?: string;
  lastMessageTime?: string;
};

/**
 * 👉 format last message time
 */
function formatMessageTime(time?: string) {
  if (!time) return '';

  const date = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);

  if (diffMin < 1) return 'Now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('vi-VN');
}

/**
 * 👉 get initials from name
 * Nguyễn Văn A -> NA
 * Minh -> M
 */
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/**
 * 👉 generate avatar color based on name
 */
function getAvatarColor(name: string) {
  const colors = [
    '#1877F2', // Facebook blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ];
  
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
}

export default function RightSidebar() {
  const { openChatBox } = useChatBox();
  const { user } = useAuth();
  const { conversations, loadConversations } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * 🔥 LOAD CONVERSATIONS
   */
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  useEffect(() => {
    const handler = () => {
      loadConversations();
    };

    window.addEventListener('refresh-conversations', handler);

    return () => {
      window.removeEventListener('refresh-conversations', handler);
    };
  }, [loadConversations]);

  /**
   * 🔥 BUILD CONTACT LIST
   */
  const allContacts = useMemo<ContactWithLastMessage[]>(() => {
    if (!user?.id || !Array.isArray(conversations)) return [];

    return conversations
      .filter(conv => !conv.isGroup)
      .map((conv): ContactWithLastMessage | null => {
        const ids = conv.participantIds ?? [];
        const names = conv.participantNames ?? [];

        const otherIndex = ids.findIndex(id => id !== user.id);
        if (otherIndex === -1) return null;

        const otherName = names[otherIndex] || 'Unknown';

        return {
          id: conv.id,
          userId: ids[otherIndex],
          name: otherName,
          avatar: getInitials(otherName),
          color: getAvatarColor(otherName),
          online: false,
          lastMessage: conv.lastMessagePreview || '',
          lastMessageTime: conv.lastMessageAt,
        };
      })
      .filter((c): c is ContactWithLastMessage => c !== null)
      .sort((a, b) => {
        const t1 = a.lastMessageTime
          ? new Date(a.lastMessageTime).getTime()
          : 0;
        const t2 = b.lastMessageTime
          ? new Date(b.lastMessageTime).getTime()
          : 0;
        return t2 - t1;
      });
  }, [conversations, user?.id]);

  /**
   * 🔥 FILTER CONTACTS BY SEARCH QUERY
   */
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return allContacts;
    
    const query = searchQuery.toLowerCase().trim();
    return allContacts.filter(contact =>
      contact.name.toLowerCase().includes(query)
    );
  }, [allContacts, searchQuery]);

  return (
    <aside className="hidden xl:flex xl:flex-col w-80 bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contacts
        </h2>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 
                       rounded-lg text-sm placeholder-gray-400 text-gray-900
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 
                         hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            {searchQuery ? (
              <>
                <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Không tìm thấy kết quả
                </p>
                <p className="text-xs text-gray-500">
                  Thử tìm kiếm với từ khóa khác
                </p>
              </>
            ) : (
              <>
                <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Chưa có cuộc trò chuyện
                </p>
                <p className="text-xs text-gray-500">
                  Bắt đầu trò chuyện với bạn bè của bạn
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="py-2">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                onClick={() => openChatBox(contact)}
                className="flex items-center gap-3 px-5 py-3 
                           hover:bg-gray-50 cursor-pointer transition-colors
                           border-b border-gray-50 last:border-b-0
                           active:bg-gray-100"
                style={{
                  animation: searchQuery ? `fadeIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                }}
              >
                {/* Avatar with online indicator */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center 
                               justify-center text-white font-semibold 
                               text-sm select-none shadow-sm"
                    style={{ backgroundColor: contact.color }}
                  >
                    {getInitials(contact.name)}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 
                                    bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {contact.name}
                    </p>
                    {contact.lastMessageTime && (
                      <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                        {formatMessageTime(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 truncate leading-relaxed">
                    {contact.lastMessage || 'Chưa có tin nhắn'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredContacts.length > 0 && (
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            {searchQuery 
              ? `${filteredContacts.length} kết quả`
              : `${filteredContacts.length} liên hệ`
            }
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </aside>
  );
}