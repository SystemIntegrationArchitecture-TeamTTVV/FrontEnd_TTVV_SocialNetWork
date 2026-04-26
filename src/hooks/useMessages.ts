import { useState, useEffect, useCallback, useRef } from 'react';
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
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<Record<string, Message[]>>({});
  const prevConnectedRef = useRef(false);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessageLists = (current: Message[], incoming: Message[]): Message[] => {
    const map = new Map<string, Message>();
    for (const msg of current) {
      map.set(msg.id, msg);
    }
    for (const msg of incoming) {
      const existing = map.get(msg.id);
      map.set(msg.id, existing ? { ...existing, ...msg } : msg);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

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

  useEffect(() => {
    const wasConnected = prevConnectedRef.current;

    if (!wasConnected && isConnected && user?.id) {
      loadConversations().catch(() => undefined);

      const activeConversationIds = Object.keys(messagesRef.current);
      if (activeConversationIds.length > 0) {
        Promise.all(
          activeConversationIds.map(async (conversationId) => {
            try {
              const page = await messagesApi.getMessagesByConversationCursor(conversationId, undefined, 50, user.id);
              const recent = page.messages || [];
              setMessages((prev) => ({
                ...prev,
                [conversationId]: mergeMessageLists(prev[conversationId] || [], recent),
              }));
            } catch {
              // ignore reconnect sync failure for one conversation; next reload will recover
            }
          })
        ).catch(() => undefined);
      }
    }

    prevConnectedRef.current = isConnected;
  }, [isConnected, user?.id, loadConversations]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!conversationId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await messagesApi.getMessagesByConversationId(conversationId, user?.id);
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
        [conversationId]: (prev[conversationId] || []).some((m) => m.id === newMessage.id)
          ? (prev[conversationId] || [])
          : [...(prev[conversationId] || []), newMessage],
      }));

      // Update conversation last message and keep list sorted by activity
      const preview =
        content.trim() ||
        (attachments?.length ? '📎' : '') ||
        (newMessage.replyTo ? `↩ ${newMessage.replyTo.contentPreview || ''}` : '');
      setConversations(prev => {
        const exists = prev.some(conv => conv.id === conversationId);
        const updated = exists
          ? prev.map(conv =>
              conv.id === conversationId
                ? { ...conv, lastMessagePreview: preview || ' ', lastMessageAt: newMessage.createdAt }
                : conv
            )
          : prev;

        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
      });

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

  const forwardMessage = useCallback(async (
    sourceMessageId: string,
    targetConversationId: string,
    note?: string
  ) => {
    if (!user?.id) return null;

    const forwarded = await messagesApi.forwardMessage(sourceMessageId, {
      requesterId: user.id,
      targetConversationId,
      note,
    });

    setMessages(prev => {
      const existing = prev[targetConversationId] || [];
      if (existing.some(m => m.id === forwarded.id)) {
        return prev;
      }
      return {
        ...prev,
        [targetConversationId]: [...existing, forwarded],
      };
    });

    setConversations(prev => {
      const exists = prev.some(conv => conv.id === targetConversationId);
      const updated = exists
        ? prev.map(conv =>
            conv.id === targetConversationId
              ? {
                  ...conv,
                  lastMessagePreview: forwarded.content,
                  lastMessageAt: forwarded.createdAt,
                }
              : conv
          )
        : prev;

      return updated.sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });
    });

    if (!conversationsRef.current.some(conv => conv.id === targetConversationId)) {
      conversationsApi
        .getConversationById(targetConversationId)
        .then((conv) => {
          setConversations((current) => {
            const filtered = current.filter((item) => item.id !== conv.id);
            return [conv, ...filtered];
          });
        })
        .catch(() => undefined);
    }

    return forwarded;
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

    const unsubscribeMessage = subscribe('MESSAGE_RECEIVED', (event) => {
      if (event.type === 'MESSAGE_RECEIVED' && event.data) {
        const message: Message = event.data;
        
        // 🔒 SECURITY: Only add message if current user is a participant.
        // Duplicate events (including same-user events from other devices) are deduped by message id below.
        // Check if current user is a participant of this conversation.
        // If conversation data is not loaded yet, trust server-side filtering.
        const conversation = conversationsRef.current.find(conv => conv.id === message.conversationId);
        const isParticipant =
          conversation?.participantIds?.length
            ? conversation.participantIds.includes(user.id)
            : true;

        if (!isParticipant) {
          return;
        }

        setMessages(prev => {
          const existing = prev[message.conversationId] || [];
          if (existing.find(m => m.id === message.id)) {
            return prev;
          }
          return {
            ...prev,
            [message.conversationId]: [...existing, message],
          };
        });

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

          return updated.sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
        });
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

    const unsubscribeEdited = subscribe('MESSAGE_EDITED', (event) => {
      if (event.type !== 'MESSAGE_EDITED' || !event.data) return;
      const payload = event.data as { conversationId?: string; message?: Message };
      if (!payload.conversationId || !payload.message) return;

      setMessages(prev => {
        const list = prev[payload.conversationId!];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId!]: list.map(m => (m.id === payload.message!.id ? payload.message! : m)),
        };
      });
    });

    const unsubscribePinned = subscribe('MESSAGE_PINNED', (event) => {
      if (event.type !== 'MESSAGE_PINNED' || !event.data) return;
      const payload = event.data as { conversationId?: string; messageId?: string; pinned?: boolean };
      if (!payload.conversationId || !payload.messageId) return;

      setMessages(prev => {
        const list = prev[payload.conversationId!];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId!]: list.map(m =>
            m.id === payload.messageId ? { ...m, pinned: !!payload.pinned } : m
          ),
        };
      });
    });

    const unsubscribeReacted = subscribe('MESSAGE_REACTED', (event) => {
      if (event.type !== 'MESSAGE_REACTED' || !event.data) return;
      const payload = event.data as { conversationId?: string; messageId?: string; emojis?: string[] };
      if (!payload.conversationId || !payload.messageId) return;

      setMessages(prev => {
        const list = prev[payload.conversationId!];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId!]: list.map(m =>
            m.id === payload.messageId ? { ...m, emojis: payload.emojis || [] } : m
          ),
        };
      });
    });

    const unsubscribePollUpdated = subscribe('POLL_UPDATED', (event) => {
      if (event.type !== 'POLL_UPDATED' || !event.data) return;
      const payload = event.data as { conversationId?: string; message?: Message };
      if (!payload.conversationId || !payload.message) return;

      setMessages(prev => {
        const list = prev[payload.conversationId!];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId!]: list.map(m => (m.id === payload.message!.id ? payload.message! : m)),
        };
      });
    });

    // ── MESSAGE_DELIVERED — update delivery status for sent messages ──
    const unsubscribeDelivered = subscribe('MESSAGE_DELIVERED', (event) => {
      if (event.type !== 'MESSAGE_DELIVERED' || !event.data) return;
      const payload = event.data as {
        conversationId?: string;
        userId?: string;
        lastDeliveredMessageId?: string;
      };
      if (!payload.conversationId || !payload.lastDeliveredMessageId || !payload.userId) return;
      // Skip own delivery events
      if (payload.userId === user?.id) return;

      setMessages(prev => {
        const list = prev[payload.conversationId!];
        if (!list) return prev;
        return {
          ...prev,
          [payload.conversationId!]: list.map(m => {
            if (!m.deliveredToUserIds) {
              return { ...m, deliveredToUserIds: [payload.userId!] };
            }
            if (m.deliveredToUserIds.includes(payload.userId!)) return m;
            return { ...m, deliveredToUserIds: [...m.deliveredToUserIds, payload.userId!] };
          }),
        };
      });
    });

    // ── Group management events — reload conversations to keep sidebar in sync ──
    const GROUP_EVENTS = [
      'GROUP_RENAMED',
      'MEMBERS_ADDED',
      'MEMBER_REMOVED',
      'MEMBER_LEFT',
      'OWNER_TRANSFERRED',
      'ADMINS_UPDATED',
    ] as const;
    const unsubscribeGroupEvents = GROUP_EVENTS.map(eventType =>
      subscribe(eventType, (event) => {
        if (event.type !== eventType || !event.data) return;
        const payload = event.data as { conversationId?: string };
        if (!payload.conversationId) return;
        // Reload full conversation list so sidebar reflects the change
        loadConversations();
      })
    );

    const unsubscribeNotification = subscribe('NOTIFICATION', (event) => {
      if (event.type === 'JOIN_REQUEST_CREATED' && event.data) {
        const { conversationId, requesterId } = event.data as { conversationId: string; requesterId: string };
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

    const unsubscribeConversationMetaUpdated = subscribe('CONVERSATION_META_UPDATED', (event) => {
      if (event.type !== 'CONVERSATION_META_UPDATED' || !event.data) return;
      const payload = event.data as {
        conversationId?: string;
        lastMessagePreview?: string;
        lastMessageAt?: string | null;
      };
      if (!payload.conversationId) return;

      setConversations((prev) => {
        const updated = prev.map((conv) =>
          conv.id === payload.conversationId
            ? {
                ...conv,
                lastMessagePreview: payload.lastMessagePreview ?? '',
                lastMessageAt: payload.lastMessageAt ?? undefined,
              }
            : conv
        );
        return updated.sort((a, b) => {
          const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return timeB - timeA;
        });
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeDeleted();
      unsubscribeDeletedForMe();
      unsubscribeEdited();
      unsubscribePinned();
      unsubscribeReacted();
      unsubscribePollUpdated();
      unsubscribeDelivered();
      unsubscribeGroupEvents.forEach(unsub => unsub());
      unsubscribeNotification();
      unsubscribeConversationCleared();
      unsubscribeConversationRestored();
      unsubscribeConversationMetaUpdated();
    };
  }, [isConnected, user?.id, subscribe]);

  // Format message for display (convert Message to display format)
  interface DisplayMessage {
    id: string;
    sender: string;
    senderId: string;
    content: string;
    time: string;
    isMe: boolean;
    status: 'read' | 'delivered' | null;
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
    const seenByOthers = (message.seenByUserIds || []).some(
      (uid) => uid !== message.senderId
    );
    const status: DisplayMessage['status'] = isMe
      ? (seenByOthers ? 'read' : 'delivered')
      : null;

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
      status,
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
    forwardMessage,
    getOrCreateDirectConversation,
    formatMessageForDisplay,
    subscribeToMessages: subscribe, // Export for ChatBoxContext
  };
}

