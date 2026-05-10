import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useChatBox } from '../../contexts/ChatBoxContext';
import { useAuth } from '../../contexts/AuthContext';
import { useMessages } from '../../hooks/useMessages';
import type { ChatContact } from '../../types/chat';
import { getLocaleTag } from '../../i18n';
import { resolveMediaUrl } from '../../utils/mediaUrl';

type ContactWithLastMessage = ChatContact & {
  lastMessage?: string;
  lastMessageTime?: string;
};

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

type RightSidebarProps = {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export default function RightSidebar({
  collapsed = false,
  onToggleCollapse,
}: RightSidebarProps) {
  const { t } = useTranslation();
  const formatMessageTime = useCallback(
    (time?: string) => {
      if (!time) return '';

      const date = new Date(time);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHour = Math.floor(diffMin / 60);

      if (diffMin < 1) return t('messenger.time.justNow');
      if (diffMin < 60) return `${diffMin}m`;
      if (diffHour < 24) return t('messenger.time.hoursAgo', { count: diffHour });

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return t('messenger.time.yesterday');
      }

      return date.toLocaleDateString(getLocaleTag());
    },
    [t],
  );
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
        const avatars = conv.participantAvatars ?? [];
        const rawAvatar = avatars[otherIndex] || '';

        return {
          id: conv.id,
          userId: ids[otherIndex],
          name: otherName,
          avatar: getInitials(otherName),
          avatarUrl: rawAvatar ? resolveMediaUrl(rawAvatar) : undefined,
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

  const collapseBtn = (
    <button
      type="button"
      onClick={onToggleCollapse}
      className="h-8 w-8 shrink-0 rounded-full bg-[#e4e6eb] text-[#7a7d82] hover:bg-[#d8dadf] dark:bg-[#22263a] dark:text-[#9aa3bc] dark:hover:bg-[#2b2f45] transition-colors flex items-center justify-center shadow-sm"
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      title={collapsed ? t('rightSidebar.expandPanel') : t('rightSidebar.collapsePanel')}
    >
      {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
    </button>
  );

  if (collapsed) {
    return (
      <div className="flex flex-col h-full w-full bg-transparent relative z-40">
        <div className="flex flex-col items-center pt-3 pb-2 border-b border-[#e4e6eb] dark:border-[#22263a]">
          {onToggleCollapse ? collapseBtn : null}
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide py-2 flex flex-col items-center gap-2 px-1">
          {filteredContacts.length === 0 ? (
            <p className="text-[11px] text-center text-[#65676b] dark:text-[#5a6278] px-1 leading-snug">
              {searchQuery ? t('rightSidebar.noResults') : t('rightSidebar.noConversations')}
            </p>
          ) : (
            filteredContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => openChatBox(contact)}
                title={contact.name}
                className="relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#13151f]"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-xs select-none shadow-sm overflow-hidden"
                  style={{ backgroundColor: contact.avatarUrl ? undefined : contact.color }}
                >
                  {contact.avatarUrl
                    ? <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                    : getInitials(contact.name)}
                </div>
                {contact.online && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#13151f]" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-transparent relative z-40">

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#e4e6eb] dark:border-[#22263a]">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-[17px] font-bold text-[#050505] dark:text-[#edf0fa] truncate min-w-0">
            {t('rightSidebar.contacts')}
          </h2>
          {onToggleCollapse ? collapseBtn : null}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#65676b] dark:text-[#5a6278]"
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
            placeholder={t('rightSidebar.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 h-9 rounded-full text-[15px] transition-all
                       bg-[#f0f2f5] border-none placeholder-[#65676b] text-[#050505]
                       focus:outline-none focus:bg-[#e4e6eb]
                       dark:bg-[#1e2133] dark:text-[#edf0fa] dark:placeholder-[#5a6278]
                       dark:focus:bg-[#22263a]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#6a7494]
                         hover:text-gray-600 dark:hover:text-[#9aa3bc] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto bg-transparent">
        {filteredContacts.length === 0 ? (
          <div className="flex items-start justify-center px-5 pt-8 pb-10">
            {searchQuery ? (
              <div className="w-full rounded-[24px] bg-gray-50 dark:bg-[#1a1d28] p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-[#22263a] flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-gray-300 dark:text-[#4e5870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa] mb-1">
                  {t('rightSidebar.noResults')}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#5a6278] leading-relaxed">
                  {t('rightSidebar.noResultsHint')}
                </p>
              </div>
            ) : (
              <div className="w-full rounded-[24px] bg-gray-50 dark:bg-[#1a1d28] p-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 dark:bg-[#22263a] flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-gray-300 dark:text-[#4e5870]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa] mb-1">
                  {t('rightSidebar.noConversations')}
                </p>
                <p className="text-xs text-gray-400 dark:text-[#5a6278] leading-relaxed">
                  {t('rightSidebar.noConversationsHint')}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2 bg-transparent">
            {filteredContacts.map((contact, index) => (
              <div
                key={contact.id}
                onClick={() => openChatBox(contact)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors
                           border border-transparent
                           hover:bg-gray-50 dark:hover:bg-[#1e2133]
                           hover:border-gray-100 dark:hover:border-[#2b2f45]
                           active:bg-gray-100 dark:active:bg-[#22263a]"
                style={{
                  animation: searchQuery ? `fadeIn 0.3s ease-out ${index * 0.05}s both` : 'none'
                }}
              >
                {/* Avatar with online indicator */}
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-full flex items-center 
                               justify-center text-white font-semibold 
                               text-sm select-none shadow-sm overflow-hidden"
                    style={{ backgroundColor: contact.avatarUrl ? undefined : contact.color }}
                  >
                    {contact.avatarUrl
                      ? <img src={contact.avatarUrl} alt={contact.name} className="w-full h-full object-cover" />
                      : getInitials(contact.name)}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 
                                    bg-green-500 rounded-full border-2 border-white dark:border-[#13151f]" />
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-900 dark:text-[#edf0fa] truncate">
                      {contact.name}
                    </p>
                    {contact.lastMessageTime && (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-[#6a7494] whitespace-nowrap">
                        {formatMessageTime(contact.lastMessageTime)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-[#7e89a6] truncate leading-relaxed">
                    {contact.lastMessage || t('rightSidebar.noLastMessage')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredContacts.length > 0 && (
        <div className="px-4 py-2 border-t border-[#e4e6eb] dark:border-[#22263a]">
          <p className="text-xs text-gray-500 dark:text-[#7e89a6] text-center">
            {searchQuery
              ? t('rightSidebar.footerResults', { count: filteredContacts.length })
              : t('rightSidebar.footerContacts', { count: filteredContacts.length })}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}