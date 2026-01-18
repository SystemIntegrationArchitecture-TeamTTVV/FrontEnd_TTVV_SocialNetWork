import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ChatContact, ChatMessage } from '../types/chat';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

// Re-export types for convenience
export type { ChatContact, ChatMessage };

interface ChatBoxContextType {
  openChatBoxes: ChatContact[];
  openChatBox: (contact: ChatContact) => void;
  openChatBoxByUserId: (userId: string, userName?: string, userAvatar?: string) => Promise<void>;
  closeChatBox: (contactId: string) => void;
  toggleMinimize: (contactId: string) => void;
  minimizedBoxes: Set<string>;
  messages: Record<string, ChatMessage[]>;
  addMessage: (contactId: string, message: ChatMessage) => void;
  sendMessage: (contactId: string, content: string) => Promise<void>;
}

const ChatBoxContext = createContext<ChatBoxContextType | undefined>(undefined);

export function ChatBoxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { isConnected, subscribe } = useSocket();
  const {
    messages: apiMessages,
    loadMessages,
    sendMessage: sendMessageAPI,
    getOrCreateDirectConversation,
    formatMessageForDisplay,
    conversations,
  } = useMessages();

  const [openChatBoxes, setOpenChatBoxes] = useState<ChatContact[]>([]);
  const [minimizedBoxes, setMinimizedBoxes] = useState<Set<string>>(new Set());

  // Convert API messages to ChatMessage format
  const messages: Record<string, ChatMessage[]> = Object.keys(apiMessages).reduce((acc, conversationId) => {
    const apiMsgs = apiMessages[conversationId] || [];
    acc[conversationId] = apiMsgs.map(msg => {
      const displayMsg = formatMessageForDisplay(msg);
      return {
        id: displayMsg.id,
        content: displayMsg.content,
        isMe: displayMsg.isMe,
        time: displayMsg.time,
        attachments: displayMsg.attachments,
      };
    });
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const openChatBox = useCallback((contact: ChatContact) => {
    setOpenChatBoxes((prev) => {
      // Nếu đã mở rồi thì không mở lại
      if (prev.some((c) => c.id === contact.id)) {
        // Nếu đang minimized thì maximize lại
        setMinimizedBoxes((prevMin) => {
          const newMin = new Set(prevMin);
          newMin.delete(contact.id);
          return newMin;
        });
        return prev;
      }
      // Thêm chat box mới vào đầu danh sách
      return [contact, ...prev].slice(0, 5); // Giới hạn tối đa 5 chat boxes
    });

    // Load messages for this conversation
    loadMessages(contact.id);
  }, [loadMessages]);

  // Open chatbox by userId (creates conversation if needed)
  const openChatBoxByUserId = useCallback(async (userId: string, userName?: string) => {
    if (!user?.id || userId === user.id) return;

    try {
      // Get or create conversation
      const conversation = await getOrCreateDirectConversation(userId);
      if (!conversation) return;

      // Find other participant info
      const otherParticipantIndex = conversation.participantIds.findIndex(id => id !== user.id);
      const contactName = userName || conversation.participantNames?.[otherParticipantIndex] || 'Unknown User';
      const initials = contactName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      const contact: ChatContact = {
        id: conversation.id, // Use conversationId as chatbox id for message routing
        userId: userId, // Store actual userId for calls
        name: contactName,
        avatar: initials,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
        online: true, // Assume online when manually opening chat
      };

      // Open chatbox
      openChatBox(contact);

      // Load messages for this conversation
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Failed to open chatbox:', error);
    }
  }, [user, getOrCreateDirectConversation, loadMessages, openChatBox]);

  const closeChatBox = (contactId: string) => {
    setOpenChatBoxes((prev) => prev.filter((c) => c.id !== contactId));
    setMinimizedBoxes((prev) => {
      const newMin = new Set(prev);
      newMin.delete(contactId);
      return newMin;
    });
  };

  const toggleMinimize = (contactId: string) => {
    setMinimizedBoxes((prev) => {
      const newMin = new Set(prev);
      if (newMin.has(contactId)) {
        newMin.delete(contactId);
      } else {
        newMin.add(contactId);
      }
      return newMin;
    });
  };

  const addMessage = (_contactId: string, _message: ChatMessage) => {
    // Messages are managed by useMessages hook now
    // This is kept for backward compatibility but won't persist
    console.log('addMessage called but messages are now managed by useMessages hook');
  };

  const sendMessage = useCallback(async (contactId: string, content: string) => {
    if (!content.trim()) return;
    await sendMessageAPI(contactId, content);
  }, [sendMessageAPI]);

  // 🔥 Auto-open chatbox when receiving new message
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    console.log('🔔 ChatBox: Subscribing to MESSAGE_RECEIVED for auto-open');

    const unsubscribe = subscribe('MESSAGE_RECEIVED', (event) => {
      console.log('📬 ChatBox received MESSAGE_RECEIVED event:', event);
      
      if (event.type === 'MESSAGE_RECEIVED' && event.data) {
        const message = event.data as any;
        
        console.log('📋 Message details:', {
          senderId: message.senderId,
          currentUserId: user.id,
          conversationId: message.conversationId,
          senderName: message.senderName,
        });
        
        // Only auto-open if message is from another user
        if (message.senderId !== user.id && message.conversationId) {
          console.log('✅ Message is from another user, auto-opening chatbox');
          
          // Use sender info from message (already available)
          const contactName = message.senderName || 'Unknown User';
          const initials = contactName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

          const contact: ChatContact = {
            id: message.conversationId,
            name: contactName,
            avatar: initials,
            color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            online: true, // User is online since they just sent a message
          };

          console.log('📦 Opening chatbox with contact:', contact);
          openChatBox(contact);
        } else {
          console.log('⏭️ Skipping auto-open (message from current user or no conversationId)');
        }
      }
    });

    return unsubscribe;
  }, [isConnected, user?.id, subscribe, openChatBox]);

  return (
    <ChatBoxContext.Provider
      value={{
        openChatBoxes,
        openChatBox,
        openChatBoxByUserId,
        closeChatBox,
        toggleMinimize,
        minimizedBoxes,
        messages,
        addMessage,
        sendMessage,
      }}
    >
      {children}
    </ChatBoxContext.Provider>
  );
}

export function useChatBox() {
  const context = useContext(ChatBoxContext);
  if (context === undefined) {
    throw new Error('useChatBox must be used within a ChatBoxProvider');
  }
  return context;
}
