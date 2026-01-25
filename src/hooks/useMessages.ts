import { useState, useEffect, useCallback } from 'react';
import { messagesApi, type Message, type CreateMessageDTO } from '../apis/messages';
import { conversationsApi, type Conversation } from '../apis/conversations';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { authApi } from '../apis/auth';

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
      setConversations(data);
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
      const data = await messagesApi.getMessagesByConversationId(conversationId);
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
  }, []);

  // Send a message
  const sendMessage = useCallback(async (
    conversationId: string,
    content: string,
    attachments?: Message['attachments']
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
      };

      const newMessage = await messagesApi.createMessage(messageData);
      
      // Optimistically update UI
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, lastMessagePreview: content || '📎 Attachment', lastMessageAt: newMessage.createdAt }
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
          const isParticipant = conversation && conversation.participantIds?.includes(user.id);
          
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

    return () => {
      unsubscribeMessage();
      unsubscribeNotification();
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
    replyTo?: { id: number; content: string; sender: string };
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
      time: new Date(message.createdAt).toLocaleTimeString('vi-VN', {
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
    getOrCreateDirectConversation,
    formatMessageForDisplay,
    subscribeToMessages: subscribe, // Export for ChatBoxContext
  };
}

