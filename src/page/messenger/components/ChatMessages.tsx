// ─── ChatMessages — message list wrapper with empty state ──────────────
import { type RefObject } from 'react';
import { Users } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { canRecallByCreatedAt } from '../../../constants/chatPolicy';
import type { DisplayMessage } from '../../../hooks/useMessages';
import type { Message } from '../../../apis/messages';

interface ChatMessagesProps {
  activeConversation: { id: string; name: string } | null;
  filteredMessages: DisplayMessage[];
  isGroupChat: boolean;
  selectedMessage: string | null;
  menuPosition: { top: number; left?: number; right?: number } | null;
  onSelectMessage: (id: string | null) => void;
  onSetMenuPosition: (pos: { top: number; left?: number; right?: number } | null) => void;
  onMessageAction: (action: string, messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
  onVote: (msg: Message, optionId: string) => void;
  voting?: string | null;
  onJoinAppointment?: (messageId: string) => void;
  joiningAppointment?: string | null;
  onViewProfile?: (userId: string, userName: string, userAvatar?: string) => void;
  userId: string;
  participantNames?: string[];
  participantIds?: string[];
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  loadingMore?: boolean;
  messagesLoading?: boolean;
  backgroundUrl?: string;
  searchKeyword?: string;
  avatarsByUserId?: Record<string, string>;
}

export default function ChatMessages({
  activeConversation,
  filteredMessages,
  isGroupChat,
  selectedMessage,
  menuPosition,
  onSelectMessage,
  onSetMenuPosition,
  onMessageAction,
  onReaction,
  messagesEndRef,
  scrollContainerRef,
  onVote,
  voting,
  onJoinAppointment,
  joiningAppointment,
  onViewProfile,
  userId,
  participantNames = [],
  participantIds = [],
  onScroll,
  loadingMore = false,
  messagesLoading = false,
  backgroundUrl,
  searchKeyword = '',
  avatarsByUserId = {},
}: ChatMessagesProps) {
  if (!activeConversation) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Chua chon doan chat</h3>
          <p className="mt-1 text-sm text-gray-500">Hay chon 1 cuoc tro chuyen ben trai de bat dau nhan tin.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 relative ${backgroundUrl ? '' : 'bg-gray-50'}`}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      ref={scrollContainerRef}
      onScroll={onScroll}
    >
      {/* Loading spinner when switching conversations */}
      {messagesLoading && filteredMessages.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <div className="w-10 h-10 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-400 font-medium animate-pulse">Đang tải tin nhắn...</p>
        </div>
      )}
      {loadingMore && (
        <div className="flex justify-center py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {filteredMessages.map((msg) => {
        // System / group-event messages → centered notification banner
        if (msg.messageType === 'SYSTEM') {
          return (
            <div key={msg.id} className="flex items-center justify-center py-1">
              <span className="px-3 py-1 rounded-full bg-gray-200/70 text-gray-500 text-[11px] font-medium text-center max-w-[85%] leading-snug">
                {(() => {
                  let resolved = msg.content;
                  participantIds.forEach((id, idx) => {
                    if (!id) return;
                    resolved = resolved.replace(new RegExp(`\\b${id}\\b`, 'g'), participantNames[idx] || id);
                  });
                  return resolved;
                })()}
              </span>
            </div>
          );
        }

        const isSelected = selectedMessage === msg.id;
        const canRecall = msg.isMe && canRecallByCreatedAt(msg.createdAt);
        return (
          <MessageBubble
            key={msg.id}
            msg={msg}
            isSelected={isSelected}
            isGroupChat={isGroupChat}
            canRecall={canRecall}
            selectedMessage={selectedMessage}
            menuPosition={menuPosition}
            onSelectMessage={onSelectMessage}
            onSetMenuPosition={onSetMenuPosition}
            onMessageAction={onMessageAction}
            onReaction={onReaction}
            onVote={onVote}
            voting={voting}
            onJoinAppointment={onJoinAppointment}
            joiningAppointment={joiningAppointment}
            onViewProfile={onViewProfile}
            userId={userId}
            participantNames={participantNames}
            participantIds={participantIds}
            searchKeyword={searchKeyword}
            avatarsByUserId={avatarsByUserId}
          />
        );
      })}
      {/* Invisible anchor at the bottom for auto-scroll */}
      <div ref={messagesEndRef} />
    </div>
  );
}
