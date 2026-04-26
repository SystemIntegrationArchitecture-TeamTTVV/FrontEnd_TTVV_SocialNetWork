// ─── ChatMessages — message list wrapper with empty state ──────────────
import { type RefObject } from 'react';
import { Users } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { canRecallByCreatedAt } from '../../../constants/chatPolicy';
import type { DisplayMessage } from '../../../hooks/useMessages';
import type { Conversation } from '../../../apis/conversations';

interface ChatMessagesProps {
  activeConversation: Conversation | null;
  filteredMessages: DisplayMessage[];
  isGroupChat: boolean;
  selectedMessage: string | null;
  menuPosition: { x: number; y: number } | null;
  onSelectMessage: (id: string | null) => void;
  onSetMenuPosition: (pos: { x: number; y: number } | null) => void;
  onMessageAction: (action: string, msg: DisplayMessage) => void;
  onReaction: (messageId: string, emoji: string) => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
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
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 bg-gray-50" ref={messagesEndRef}>
      {filteredMessages.map((msg) => {
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
          />
        );
      })}
    </div>
  );
}
