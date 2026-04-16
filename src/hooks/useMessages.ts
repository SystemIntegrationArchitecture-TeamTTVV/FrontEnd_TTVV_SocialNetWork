import { useState, useEffect, useCallback } from 'react';
import { messagesApi, type Message, type CreateMessageDTO } from '../apis/messages';
import { conversationsApi, type Conversation } from '../apis/conversations';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { authApi } from '../apis/auth';
import { getLocaleTag } from '../i18n';

export function useMessages() {
  const { user } = useAuth();
  const { subscribe, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations for current user
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await conversationsApi.getConversationsByUserId(user.id);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      console.error('Failed to load conversations:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      console.log('📥 Loading messages for conversation:', conversationId);
      const data = await messagesApi.getMessagesByConversationId(conversationId, user?.id);
      console.log('✅ Loaded', data.length, 'messages for conversation:', conversationId);
      setMessages(prev => ({
        ...prev,
        [conversationId]: data,
      }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      console.error('Failed to load messages:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Send a message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments?: Message['attachments'],
    replyToMessageId?: string
  ) => {
    if (!user?.id) return null;
    // Allow empty content if there are attachments
    if (!content.trim() && (!attachments || attachments.length === 0)) return null;

    try {
      const messageData: CreateMessageDTO = {
        conversationId,
        senderId: user.id,
        senderName: user.fullName,
        senderAvatar: user.avatar,
        content: content.trim(),
        attachments,
        ...(replyToMessageId ? { replyToMessageId } : {}),
      };

      const newMessage = await messagesApi.createMessage(messageData);
      
      // Optimistically update UI
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      // Update conversation last message
      const preview =
        content.trim() ||
        (attachments?.length ? '📎' : '') ||
        (newMessage.replyTo ? `↩ ${newMessage.replyTo.contentPreview || ''}` : '');
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessagePreview: preview || ' ', lastMessageAt: newMessage.createdAt }
            : conv
        )
      );

      return newMessage;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('Failed to send message:', err);
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const removeMessage = useCallback(async (conversationId: string, messageId: string) => {
    if (!user?.id) return;
    await messagesApi.deleteMessage(messageId, user.id);
    setMessages(prev => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.filter(m => m.id !== messageId),
      };
    });
  }, [user?.id]);

  const removeMessageForMe = useCallback(async (conversationId: string, messageId: string) => {
    if (!user?.id) return;
    await messagesApi.deleteMessageForMe(messageId, user.id);
    setMessages(prev => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.filter(m => m.id !== messageId),
      };
    });
  }, [user?.id]);

  // Get or create a direct conversation between current user and another user
  const getOrCreateDirectConversation = useCallback(async (otherUserId: string): Promise<Conversation | null> => {
    if (!user?.id) return null;

    try {
      const conversation = await conversationsApi.getOrCreateDirectConversation(user.id, otherUserId);
      
      // Add to conversations list if not exists
      setConversations(prev => {
        if (prev.find(c => c.id === conversation.id)) {
          return prev;
        }
        return [conversation, ...prev];
      });

      return conversation;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get/create conversation';
      console.error('Failed to get/create conversation:', err);
      setError(errorMessage);
      return null;
    }
  }, [user?.id]);

  // Listen to socket events for real-time messages
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    console.log('🔔 Subscribing to MESSAGE_RECEIVED events');

    const unsubscribeMessage = subscribe('MESSAGE_RECEIVED', (event) => {
      console.log('📨 Received MESSAGE_RECEIVED via socket:', event);
      
      if (event.type === 'MESSAGE_RECEIVED' && event.data) {
        const message: Message = event.data;
        console.log('📬 Processing message:', {
          messageId: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          currentUserId: user.id,
          content: message.content,
        });
        
        // 🔒 SECURITY: Only add message if:
        // 1. It's not from current user (to avoid duplicates)
        // 2. Current user is a participant of this conversation
        if (message.senderId !== user.id) {
          // Check if current user is a participant of this conversation
          const conversation = conversations.find(conv => conv.id === message.conversationId);
          // If `conversations` isn't loaded yet (or doesn't have participantIds populated),
          // don't drop the message; the backend should already ensure only participants receive events.
          const isParticipant =
            conversation?.participantIds?.length
              ? conversation.participantIds.includes(user.id)
              : true;

          if (!isParticipant) {
            console.warn('🚫 SECURITY: Ignoring message - current user is not a participant of this conversation:', {
              conversationId: message.conversationId,
              currentUserId: user.id,
              senderId: message.senderId
            });
            return;
          }
          
          console.log('✅ Message is from another user and user is participant, adding to state');
          setMessages(prev => {
            const existing = prev[message.conversationId] || [];
            // Check if message already exists
            if (existing.find(m => m.id === message.id)) {
              console.log('⚠️ Message already exists, skipping');
              return prev;
            }
            console.log('➕ Adding new message to conversation:', message.conversationId);
            return {
              ...prev,
              [message.conversationId]: [...existing, message],
            };
          });

          // Update conversation last message and move to top
          console.log('🔄 Updating conversation list with new message preview');
          setConversations(prev => {
            const exists = prev.some((conv) => conv.id === message.conversationId);
            if (!exists) {
              conversationsApi
                .getConversationById(message.conversationId)
                .then((conv) => {
                  setConversations((current) => {
                    if (current.some((item) => item.id === conv.id)) {
                      return current;
                    }
                    return [conv, ...current];
                  });
                })
                .catch(() => undefined);
              return prev;
            }

            const updated = prev.map(conv =>
              conv.id === message.conversationId
                ? {
                    ...conv,
                    lastMessagePreview: message.content,
                    lastMessageAt: message.createdAt,
                  }
                : conv
            );
            // Sort by lastMessageAt (newest first)
            const sorted = updated.sort((a, b) => {
              const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return timeB - timeA;
            });
            console.log('📋 Updated conversations (sorted):', sorted);
            return sorted;
          });
        } else {
          console.log('⏭️ Message is from current user, skipping (to avoid duplicates)');
        }
      }
    });

    const unsubscribeDeleted = subscribe('MESSAGE_DELETED', (event) => {
      if (event.type !== 'MESSAGE_DELETED' || !event.data) return;
      const { conversationId, messageId } = event.data as { conversationId: string; messageId: string };
      if (!conversationId || !messageId) return;
      setMessages(prev => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.filter(m => m.id !== messageId),
        };
      });
    });

    const unsubscribeDeletedForMe = subscribe('MESSAGE_DELETED_FOR_ME', (event) => {
      if (event.type !== 'MESSAGE_DELETED_FOR_ME' || !event.data) return;
      const { conversationId, messageId } = event.data as { conversationId: string; messageId: string };
      if (!conversationId || !messageId) return;
      setMessages(prev => {
        const list = prev[conversationId];
        if (!list) return prev;
        return {
          ...prev,
          [conversationId]: list.filter(m => m.id !== messageId),
        };
      });
    });

    const unsubscribeNotification = subscribe('NOTIFICATION', (event) => {
      console.log('🔔 Received NOTIFICATION via socket:', event);

      if (event.type === 'JOIN_REQUEST_CREATED' && event.data) {
        const { conversationId, requesterId } = event.data as { conversationId: string; requesterId: string };
        console.log('👥 JOIN_REQUEST_CREATED for conversation:', conversationId, 'from:', requesterId);
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  pendingJoinIds: conv.pendingJoinIds
                    ? conv.pendingJoinIds.includes(requesterId)
                      ? conv.pendingJoinIds
                      : [...conv.pendingJoinIds, requesterId]
                    : [requesterId],
                }
              : conv
          )
        );
      }
    });

    const unsubscribeConversationCleared = subscribe('CONVERSATION_CLEARED', (event) => {
      if (event.type !== 'CONVERSATION_CLEARED' || !event.data) return;
      const payload = event.data as { conversationId?: string };
      const conversationId = payload.conversationId;
      if (!conversationId) return;

      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      setMessages(prev => {
        if (!(conversationId in prev)) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    });

    const unsubscribeConversationRestored = subscribe('CONVERSATION_RESTORED', (event) => {
      if (event.type !== 'CONVERSATION_RESTORED' || !event.data) return;
      const payload = event.data as { conversationId?: string };
      const conversationId = payload.conversationId;
      if (!conversationId) return;

      conversationsApi
        .getConversationById(conversationId)
        .then((conv) => {
          setConversations((current) => {
            const filtered = current.filter((item) => item.id !== conv.id);
            return [conv, ...filtered];
          });
        })
        .catch(() => undefined);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeDeleted();
      unsubscribeDeletedForMe();
      unsubscribeNotification();
      unsubscribeConversationCleared();
      unsubscribeConversationRestored();
    };
  }, [isConnected, user?.id, subscribe, conversations]);

  // Format message for display (convert Message to display format)
  interface DisplayMessage {
    id: string;
    sender: string;
    senderId: string;
    content: string;
    time: string;
    isMe: boolean;
    status: 'read' | null;
    reactions?: { emoji: string; users: string[] }[];
    attachments?: Message['attachments'];
    isEdited?: boolean;
    createdAt: string;
    // Legacy UI fields (for backward compatibility with Messenger.tsx)
    image?: string;
    pinned?: boolean;
    starred?: boolean;
    replyTo?: { id: string; content: string; sender: string };
  }

  const formatMessageForDisplay = useCallback((message: Message): DisplayMessage => {
    const currentUser = authApi.getCurrentUser();
    const isMe = message.senderId === currentUser?.id;

    const starred = !!message.starredByUserIds?.includes(currentUser?.id || '');

    return {
      id: message.id,
      sender: message.senderName,
      senderId: message.senderId,
      content: message.content,
      time: new Date(message.createdAt).toLocaleTimeString(getLocaleTag(), {
        hour: '2-digit',
        minute: '2-digit',
      }),
      isMe,
      status: isMe ? ('read' as const) : null,
      reactions: message.emojis?.map(emoji => ({ emoji, users: [] })),
      attachments: message.attachments,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      pinned: message.pinned,
      starred,
    };
  }, []);

  return {
    conversations,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    removeMessage,
    removeMessageForMe,
    getOrCreateDirectConversation,
    formatMessageForDisplay,
    subscribeToMessages: subscribe, // Export for ChatBoxContext
  };
}

