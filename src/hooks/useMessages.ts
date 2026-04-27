import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesApi, type Message, type CreateMessageDTO } from '../apis/messages';
import { conversationsApi, type Conversation } from '../apis/conversations';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { authApi } from '../apis/auth';
import { getLocaleTag } from '../i18n';
import { buildConversationPreview } from '../utils/messagePreview';

// Exported so components (MessageBubble, ChatMessages, etc.) can type their props
export interface DisplayMessage {
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
  // System / group-event messages
  messageType?: string;
  systemAction?: string;
  // Legacy UI fields (for backward compatibility with Messenger.tsx)
  image?: string;
  pinned?: boolean;
  starred?: boolean;
  replyTo?: { id: string; content: string; sender: string };
  // Poll fields
  pollHideVoters?: boolean;
  // Appointment fields
  appointmentTitle?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  appointmentParticipants?: string[];
}


export function useMessages() {
  const { user } = useAuth();
  const { subscribe, isConnected } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursors, setCursors] = useState<Record<string, string | null>>({});
  const [hasMoreMap, setHasMoreMap] = useState<Record<string, boolean>>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const conversationsRef = useRef<Conversation[]>([]);
  const messagesRef = useRef<Record<string, Message[]>>({});
  const prevConnectedRef = useRef(false);
  const latestLoadRequestRef = useRef<Record<string, number>>({});

  const sortConversationsByActivity = (list: Conversation[]): Conversation[] => {
    return [...list].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });
  };

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
      setConversationsLoading(true);
      setError(null);
      const data = await conversationsApi.getConversationsByUserId(user.id);
      setConversations(sortConversationsByActivity(Array.isArray(data) ? data : []));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load conversations';
      console.error('Failed to load conversations:', err);
      setError(errorMessage);
    } finally {
      setConversationsLoading(false);
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
    if (!conversationId || !user?.id) return;

    const requestId = Date.now() + Math.random();
    latestLoadRequestRef.current[conversationId] = requestId;

    try {
      setLoading(true);
      setError(null);

      // Ensure conversation exists in local state, but do not block message loading on it.
      if (!conversationsRef.current.some((conv) => conv.id === conversationId)) {
        conversationsApi
          .getConversationById(conversationId)
          .then((conv) => {
            setConversations((current) => {
              if (current.some((item) => item.id === conv.id)) {
                return current;
              }
              return sortConversationsByActivity([conv, ...current]);
            });
          })
          .catch(() => undefined);
      }

      // Load latest page first (fast) instead of pulling full conversation history.
      // This keeps chat opening responsive when users switch in/out quickly.
      const page = await messagesApi.getMessagesByConversationCursor(
        conversationId,
        undefined,
        30,
        user.id
      );
      
      if (latestLoadRequestRef.current[conversationId] !== requestId) return;

      const initialMessages = page.messages || [];
      setMessages((prev) => ({
        ...prev,
        [conversationId]: initialMessages,
      }));
      
      setCursors(prev => ({ ...prev, [conversationId]: page.nextCursor || null }));
      setHasMoreMap(prev => ({ ...prev, [conversationId]: !!page.hasMore }));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load messages';
      console.error('Failed to load messages:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadMoreMessages = useCallback(async (conversationId: string) => {
    const cursor = cursors[conversationId];
    const hasMore = hasMoreMap[conversationId];
    if (!conversationId || !user?.id || !cursor || !hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      const page = await messagesApi.getMessagesByConversationCursor(conversationId, cursor, 20, user.id);
      
      const olderMessages = page.messages || [];
      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...olderMessages, ...(prev[conversationId] || [])],
      }));
      
      setCursors(prev => ({ ...prev, [conversationId]: page.nextCursor || null }));
      setHasMoreMap(prev => ({ ...prev, [conversationId]: !!page.hasMore }));
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [user?.id, cursors, hasMoreMap, loadingMore]);

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
      const preview = buildConversationPreview(newMessage);
      setConversations(prev => {
        const exists = prev.some(conv => conv.id === conversationId);
        const updated = exists
          ? prev.map(conv =>
              conv.id === conversationId
                ? { 
                    ...conv, 
                    lastMessagePreview: preview || ' ', 
                    lastMessageType: newMessage.messageType,
                    lastMessageSenderId: newMessage.senderId,
                    lastMessageSenderName: newMessage.senderName,
                    lastMessageAt: newMessage.createdAt 
                  }
                : conv
            )
          : prev;

        return sortConversationsByActivity(updated);
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
                      lastMessagePreview: buildConversationPreview(forwarded),
                      lastMessageType: forwarded.messageType,
                      lastMessageSenderId: forwarded.senderId,
                      lastMessageSenderName: forwarded.senderName,
                      lastMessageAt: forwarded.createdAt,
                    }
              : conv
          )
        : prev;

        return sortConversationsByActivity(updated);
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

  const toggleReaction = useCallback(async (
    conversationId: string,
    messageId: string,
    emoji: string
  ) => {
    if (!conversationId) return null;
    const updated = await messagesApi.toggleReaction(messageId, emoji);
    setMessages((prev) => {
      const list = prev[conversationId];
      if (!list) return prev;
      return {
        ...prev,
        [conversationId]: list.map((m) => (m.id === messageId ? { ...m, ...updated } : m)),
      };
    });
    return updated;
  }, []);

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

    const SYSTEM_GROUP_ACTIONS = new Set([
      'GROUP_RENAMED',
      'MEMBERS_ADDED',
      'MEMBER_REMOVED',
      'MEMBER_LEFT',
      'OWNER_TRANSFERRED',
      'ADMINS_UPDATED',
      'JOIN_REQUEST_CREATED',
      'JOIN_REQUEST_UPDATED',
      'JOIN_REQUEST_APPROVED',
      'JOIN_APPROVALS_UPDATED',
      'SEND_PERMISSION_UPDATED',
      'ADD_MEMBER_PERMISSION_UPDATED',
      'CONVERSATION_META_UPDATED',
    ]);

    const unsubscribeMessage = subscribe('MESSAGE_RECEIVED', (event) => {
      if (event.type === 'MESSAGE_RECEIVED' && event.data) {
        const message: Message = event.data;
        
        // Duplicate events (including same-user events from other devices) are deduped by message id below.
        // Do not hard-drop realtime events using local participant cache because stale conversation state
        // can incorrectly filter valid messages and break realtime delivery.
        const conversation = conversationsRef.current.find(conv => conv.id === message.conversationId);
        if (conversation?.participantIds?.length && !conversation.participantIds.includes(user.id)) {
          console.warn(
            '[useMessages] Conversation participant cache mismatch, accepting socket event anyway',
            {
              conversationId: message.conversationId,
              currentUserId: user.id,
            }
          );
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
                  return sortConversationsByActivity([conv, ...current]);
                });
              })
              .catch(() => undefined);
            return prev;
          }

          const updated = prev.map(conv =>
            conv.id === message.conversationId
                  ? {
                      ...conv,
                      lastMessagePreview: buildConversationPreview(message),
                      lastMessageType: message.messageType,
                      lastMessageSenderId: message.senderId,
                      lastMessageSenderName: message.senderName,
                      // Guard against backend sending LocalDateTime as an array instead of ISO string
                      lastMessageAt: typeof message.createdAt === 'string' && message.createdAt
                        ? message.createdAt
                        : new Date().toISOString(),
                    }
              : conv
          );

            return sortConversationsByActivity(updated);
        });

        // Backend emits group changes as SYSTEM messages via MESSAGE_RECEIVED.
        // Reload conversations so group name/owner/admin updates are reflected for other members.
        if (message.messageType === 'SYSTEM' && SYSTEM_GROUP_ACTIONS.has(message.systemAction || '')) {
          loadConversations().catch(() => undefined);
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
      const { conversationId, message: updatedMessage } = event.data as { conversationId?: string, message?: Message };
      if (conversationId && updatedMessage) {
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          const next = list.map((m) => (m.id === updatedMessage.id ? updatedMessage : m));
          return { ...prev, [conversationId]: next };
        });
      }
    });

    const unsubscribeAppointmentCreated = subscribe('APPOINTMENT_CREATED', (event) => {
      if (event.type !== 'APPOINTMENT_CREATED' || !event.data) return;
      // APPOINTMENT_CREATED is usually a SYSTEM message announcement
    });

    const unsubscribeAppointmentUpdated = subscribe('APPOINTMENT_UPDATED', (event) => {
      if (event.type !== 'APPOINTMENT_UPDATED' || !event.data) return;
      const { conversationId, message: updatedMessage } = event.data as { conversationId?: string, message?: Message };
      if (conversationId && updatedMessage) {
        setMessages((prev) => {
          const list = prev[conversationId] || [];
          const next = list.map((m) => (m.id === updatedMessage.id ? updatedMessage : m));
          return { ...prev, [conversationId]: next };
        });
      }
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
      'JOIN_REQUEST_UPDATED',
      'JOIN_APPROVALS_UPDATED',
      'SEND_PERMISSION_UPDATED',
      'ADD_MEMBER_PERMISSION_UPDATED',
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
        const { conversationId, requesterId, pendingIds } = event.data as {
          conversationId: string;
          requesterId: string;
          pendingIds?: string[];
        };
        // pendingIds is present when a member invites friends (multiple invitees).
        // requesterId is used for the classic self-join-request flow.
        const idsToAdd: string[] = pendingIds && pendingIds.length > 0 ? pendingIds : [requesterId];
        setConversations(prev =>
          prev.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  pendingJoinIds: Array.from(
                    new Set([...(conv.pendingJoinIds ?? []), ...idsToAdd])
                  ),
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
        ownerId?: string;
        adminIds?: string[];
        participantIds?: string[];
        participantNames?: string[];
        participantAvatars?: string[];
        groupName?: string;
        groupAvatar?: string;
        description?: string;
        approvalsRequired?: boolean;
        onlyAdminsCanSend?: boolean;
        onlyAdminsCanAddMembers?: boolean;
        pendingJoinIds?: string[];
        hiddenForCurrentUser?: boolean;
        hiddenRequiresPin?: boolean;
        clearBeforeAt?: string;
        updatedAt?: string;
        lastMessagePreview?: string;
        lastMessageType?: string;
        lastMessageSenderId?: string;
        lastMessageSenderName?: string;
        lastMessageAt?: string | null;
        isDisbanded?: boolean;
      };
      if (!payload.conversationId) return;

      setConversations((prev) => {
        const exists = prev.some((conv) => conv.id === payload.conversationId);
        if (!exists) {
          conversationsApi
            .getConversationById(payload.conversationId!)
            .then((conv) => {
              setConversations((current) => {
                const filtered = current.filter((item) => item.id !== conv.id);
                return sortConversationsByActivity([conv, ...filtered]);
              });
            })
            .catch(() => undefined);
          return prev;
        }

        const updated = prev.map((conv) =>
          conv.id === payload.conversationId
            ? {
                ...conv,
                ownerId: payload.ownerId ?? conv.ownerId,
                adminIds: payload.adminIds ?? conv.adminIds,
                participantIds: payload.participantIds ?? conv.participantIds,
                participantNames: payload.participantNames ?? conv.participantNames,
                participantAvatars: payload.participantAvatars ?? conv.participantAvatars,
                groupName: payload.groupName ?? conv.groupName,
                groupAvatar: payload.groupAvatar ?? conv.groupAvatar,
                description: payload.description ?? conv.description,
                approvalsRequired: payload.approvalsRequired ?? conv.approvalsRequired,
                onlyAdminsCanSend: payload.onlyAdminsCanSend ?? conv.onlyAdminsCanSend,
                onlyAdminsCanAddMembers: payload.onlyAdminsCanAddMembers ?? conv.onlyAdminsCanAddMembers,
                pendingJoinIds: payload.pendingJoinIds ?? conv.pendingJoinIds,
                hiddenForCurrentUser: payload.hiddenForCurrentUser ?? conv.hiddenForCurrentUser,
                hiddenRequiresPin: payload.hiddenRequiresPin ?? conv.hiddenRequiresPin,
                clearBeforeAt: payload.clearBeforeAt ?? conv.clearBeforeAt,
                updatedAt: payload.updatedAt ?? conv.updatedAt,
                lastMessagePreview: payload.lastMessagePreview ?? conv.lastMessagePreview,
                lastMessageType: payload.lastMessageType ?? conv.lastMessageType,
                lastMessageSenderId: payload.lastMessageSenderId ?? conv.lastMessageSenderId,
                lastMessageSenderName: payload.lastMessageSenderName ?? conv.lastMessageSenderName,
                lastMessageAt: payload.lastMessageAt ?? conv.lastMessageAt,
                isDisbanded: payload.isDisbanded ?? conv.isDisbanded,
              }
            : conv
        );

        return sortConversationsByActivity(updated);
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
      unsubscribeAppointmentCreated();
      unsubscribeAppointmentUpdated();
      unsubscribeDelivered();
      unsubscribeGroupEvents.forEach(unsub => unsub());
      unsubscribeNotification();
      unsubscribeConversationCleared();
      unsubscribeConversationRestored();
      unsubscribeConversationMetaUpdated();
    };
  }, [isConnected, user?.id, subscribe, loadConversations]);

  // Format message for display (convert Message to display format)

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

    const createdAtDate = new Date(message.createdAt);
    const time = Number.isNaN(createdAtDate.getTime())
      ? ''
      : createdAtDate.toLocaleTimeString(getLocaleTag(), {
          hour: '2-digit',
          minute: '2-digit',
        });

    const reactionCounts = (message.emojis || []).reduce<Record<string, number>>((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});

    return {
      id: message.id,
      sender: message.senderName,
      senderId: message.senderId,
      content: message.content,
      time,
      isMe,
      status,
      reactions: Object.entries(reactionCounts).map(([emoji, count]) => ({
        emoji,
        users: Array.from({ length: count }, (_, idx) => `${emoji}-${idx}`),
      })),
      attachments: message.attachments,
      isEdited: message.isEdited,
      createdAt: message.createdAt,
      messageType: message.messageType,
      systemAction: message.systemAction,
      pinned: message.pinned,
      starred,
      // Poll
      pollQuestion: message.pollQuestion,
      pollOptions: message.pollOptions,
      pollMultipleChoice: message.pollMultipleChoice,
      pollClosed: message.pollClosed,
      pollDeadline: message.pollDeadline,
      pollCanAddOptions: message.pollCanAddOptions,
      pollHideResultsBeforeVote: message.pollHideResultsBeforeVote,
      pollHideVoters: message.pollHideVoters,
      // Appointment
      appointmentTitle: message.appointmentTitle,
      appointmentTime: message.appointmentTime,
      appointmentLocation: message.appointmentLocation,
      appointmentParticipants: message.appointmentParticipants,
    };
  }, [user?.id]);

  const handleToggleStar = useCallback(async (messageId: string) => {
    if (!user?.id) return;
    try {
      const updated = await messagesApi.toggleStar(messageId, user.id);
      setMessages((prev) => {
        const next = { ...prev };
        for (const cid in next) {
          if (next[cid].some((m) => m.id === messageId)) {
            next[cid] = next[cid].map((m) => (m.id === messageId ? updated : m));
          }
        }
        return next;
      });
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  }, [user?.id]);

  return {
    conversations,
    messages,
    loading,
    conversationsLoading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    removeMessage,
    removeMessageForMe,
    forwardMessage,
    toggleReaction,
    getOrCreateDirectConversation,
    formatMessageForDisplay,
    subscribeToMessages: subscribe,
    handleToggleStar,
    loadMoreMessages,
    loadingMore,
    hasMoreMap,
  };
}
