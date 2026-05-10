import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ChatContact, ChatMessage } from '../types/chat';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { conversationsApi } from '../apis/conversations';
import { showAuthRequiredPrompt } from '../utils/authPrompt';
import { IncomingMessageEventTypes } from '../services/socketEvents';

// Deterministic color from any string id so the bubble color stays stable across re-opens
const idToColor = (id: string): string => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  const palette = ['#1a6cf5','#7c3aed','#0e9f6e','#d97706','#e11d48','#0891b2','#7e22ce','#b45309'];
  return palette[hash % palette.length];
};

// Re-export types for convenience
export type { ChatContact, ChatMessage };

interface ChatBoxContextType {
  openChatBoxes: ChatContact[];
  openChatBox: (contact: ChatContact) => void;
  openChatBoxByUserId: (userId: string, userName?: string, userAvatar?: string) => Promise<void>;
  openChatBoxByConversationId: (conversationId: string) => Promise<void>;
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
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const storageKey = useCallback(
    (suffix: string) => `chatbox:${suffix}:${user?.id || 'anonymous'}`,
    [user?.id]
  );

  // Restore open chatboxes/minimized state after refresh
  useEffect(() => {
    if (!user?.id) return;
    try {
      const rawBoxes = localStorage.getItem(storageKey('openChatBoxes'));
      const rawMin = localStorage.getItem(storageKey('minimizedBoxes'));
      const parsedBoxes: unknown = rawBoxes ? JSON.parse(rawBoxes) : [];
      const parsedMin: unknown = rawMin ? JSON.parse(rawMin) : [];

      const boxes = Array.isArray(parsedBoxes)
        ? (parsedBoxes as Array<Partial<ChatContact>>)
            .filter((b) => b && typeof b.id === 'string' && typeof b.name === 'string')
            .slice(0, 5)
            .map((b) => ({
              id: String(b.id),
              userId: b.userId ? String(b.userId) : undefined,
              name: String(b.name),
              avatar: typeof b.avatar === 'string' ? b.avatar : String(b.name).slice(0, 2).toUpperCase(),
              color: typeof b.color === 'string' ? b.color : '#1877F2',
              online: typeof b.online === 'boolean' ? b.online : false,
              isGroup: typeof b.isGroup === 'boolean' ? b.isGroup : false,
            }))
        : [];

      const mins = Array.isArray(parsedMin) ? (parsedMin as string[]).map((n: string) => String(n)) : [];

      // Use functional updates to avoid cascading renders warning
      setOpenChatBoxes(() => boxes);
      setMinimizedBoxes(() => new Set(mins));

      // Load messages for restored boxes
      for (const c of boxes) {
        loadMessages(c.id);
      }
    } catch (e) {
      console.warn('Failed to restore chatbox state:', e);
      setOpenChatBoxes([]);
      setMinimizedBoxes(new Set());
    }
  }, [user?.id, storageKey, loadMessages]);

  // Persist chatboxes/minimized state so refresh doesn't lose them
  useEffect(() => {
    if (!user?.id) return;
    try {
      localStorage.setItem(storageKey('openChatBoxes'), JSON.stringify(openChatBoxes));
      localStorage.setItem(storageKey('minimizedBoxes'), JSON.stringify(Array.from(minimizedBoxes)));
    } catch (e) {
      console.warn('Failed to persist chatbox state:', e);
    }
  }, [user?.id, openChatBoxes, minimizedBoxes, storageKey]);

  // Ensure isGroup flag on contacts stays in sync with conversations (handles old localStorage entries)
  useEffect(() => {
    if (!conversations.length) return;
    setOpenChatBoxes((prev) =>
      prev.map((c) => {
        const conv = conversations.find((cv) => cv.id === c.id);
        if (!conv) return c;
        const isGroup = conv.isGroup;
        if (c.isGroup === isGroup) return c;
        return { ...c, isGroup };
      })
    );
  }, [conversations]);

  // Convert API messages to ChatMessage format
  const messages: Record<string, ChatMessage[]> = Object.keys(apiMessages).reduce((acc, conversationId) => {
    const apiMsgs = apiMessages[conversationId] || [];
    acc[conversationId] = apiMsgs.map(msg => {
      const displayMsg = formatMessageForDisplay(msg);
      return {
        id: displayMsg.id,
        sender: displayMsg.sender,
        senderId: displayMsg.senderId,
        senderAvatar: (msg as any).senderAvatar,
        content: displayMsg.content,
        isMe: displayMsg.isMe,
        time: displayMsg.time,
        attachments: displayMsg.attachments,
      };
    });
    return acc;
  }, {} as Record<string, ChatMessage[]>);

  const openChatBox = useCallback((contact: ChatContact) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }

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
  }, [loadMessages, user?.id]);

  // Open chatbox by userId (creates conversation if needed)
  const openChatBoxByUserId = useCallback(async (userId: string, userName?: string, userAvatar?: string) => {
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }
    if (userId === user.id) return;

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
        avatarUrl: userAvatar || undefined,
        color: idToColor(conversation.id),
        online: true,
        isGroup: false,
      };

      // Open chatbox
      openChatBox(contact);

      // Load messages for this conversation
      await loadMessages(conversation.id);
    } catch (error) {
      console.error('Failed to open chatbox:', error);
    }
  }, [user, getOrCreateDirectConversation, loadMessages, openChatBox]);

  // Open chatbox by conversationId (supports group + direct)
  const openChatBoxByConversationId = useCallback(
    async (conversationId: string) => {
      if (!user?.id) {
        showAuthRequiredPrompt(window.location.pathname);
        return;
      }
      if (!conversationId) return;
      try {
        const conv = await conversationsApi.getConversationById(conversationId);
        const name = conv.isGroup
          ? conv.groupName || 'Group Chat'
          : (() => {
              const idx = conv.participantIds.findIndex((id) => id !== user.id);
              return conv.participantNames?.[idx] || 'Unknown User';
            })();

        const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
        const otherUserId = conv.isGroup ? undefined : conv.participantIds.find((id) => id !== user.id);

        const contact: ChatContact = {
          id: conv.id,
          userId: otherUserId,
          name,
          avatar: initials,
          color: idToColor(conv.id),
          online: true,
          isGroup: conv.isGroup,
        };

        openChatBox(contact);
        await loadMessages(conv.id);
      } catch (e) {
        console.error('Failed to open chatbox by conversationId:', e);
      }
    },
    [user?.id, openChatBox, loadMessages]
  );

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
    if (!user?.id) {
      showAuthRequiredPrompt(window.location.pathname);
      return;
    }
    if (!content.trim()) return;
    await sendMessageAPI(contactId, content);
     window.dispatchEvent(new Event('refresh-conversations'));
  }, [sendMessageAPI, user?.id]);

  // 🔥 Auto-open chatbox when receiving new message
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    console.log('🔔 ChatBox: Subscribing incoming message events for auto-open');

    const unsubscribers = IncomingMessageEventTypes.map((eventType) =>
      subscribe(eventType, async (event) => {
        console.log(`📬 ChatBox received ${event.type} event:`, event);
        
        if (event.data) {
        const message = event.data as any;
        
        console.log('📋 Message details:', {
          senderId: message.senderId,
          currentUserId: user.id,
          conversationId: message.conversationId,
          senderName: message.senderName,
        });
        
        // 🔒 SECURITY: Only auto-open if message is from another user
        // Backend already verified user is participant before emitting event to /user/{username}/queue/notifications
        if (message.senderId !== user.id && message.conversationId) {
          // Optional: Verify participant if conversation is already loaded
          const conversation = conversationsRef.current.find(conv => conv.id === message.conversationId);
          if (conversation) {
            const isParticipant = conversation.participantIds?.includes(user.id);
            if (!isParticipant) {
              console.warn('🚫 SECURITY: Ignoring message - current user is not a participant of this conversation:', {
                conversationId: message.conversationId,
                currentUserId: user.id,
                senderId: message.senderId
              });
              return;
            }
          } else {
            // Conversation not in state yet, but backend already verified we're a participant
            console.log('📋 Conversation not in state yet, but backend verified participant - proceeding to open chatbox');
          }
          
          console.log('✅ Message is from another user, auto-opening chatbox');
          
          // Determine group vs direct so the floating chatbox has correct title (groupName)
          let contactName = '';
          let userIdForCall: string | undefined = message.senderId;
          let contactAvatarUrl: string | undefined = message.senderAvatar || undefined;
          let isGroupConversation = false;

          const inState = conversationsRef.current.find((c) => c.id === message.conversationId);
          if (inState?.isGroup) {
            contactName = inState.groupName || 'Group Chat';
            userIdForCall = undefined;
            contactAvatarUrl = undefined;
            isGroupConversation = true;
          } else if (inState) {
            // Direct conversation already in state — use sender info
            contactName = message.senderName || 'Unknown User';
          } else {
            // Not in state: fetch minimal conversation to detect group
            try {
              const conv = await conversationsApi.getConversationById(message.conversationId);
              if (conv.isGroup) {
                contactName = conv.groupName || 'Group Chat';
                userIdForCall = undefined;
                contactAvatarUrl = undefined;
                isGroupConversation = true;
              } else {
                contactName = message.senderName || 'Unknown User';
              }
            } catch (e) {
              // ignore network/parse errors here
              contactName = message.senderName || 'Unknown User';
              console.warn('Failed to fetch conversation for chatbox title:', e);
            }
          }

          const initials = contactName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

          const contact: ChatContact = {
            id: message.conversationId,
            userId: userIdForCall,
            name: contactName,
            avatar: initials,
            avatarUrl: contactAvatarUrl,
            color: idToColor(message.conversationId),
            online: true,
            isGroup: isGroupConversation,
          };

          console.log('📦 Opening chatbox with contact:', contact);
          openChatBox(contact);
        } else {
          console.log('⏭️ Skipping auto-open (message from current user or no conversationId)');
        }
        }
      })
    );

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [isConnected, user?.id, subscribe, openChatBox]);

  return (
    <ChatBoxContext.Provider
      value={{
        openChatBoxes,
        openChatBox,
        openChatBoxByUserId,
        openChatBoxByConversationId,
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
