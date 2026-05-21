import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Send,
  Settings,
  Users,
  ChevronLeft,
  Plus,
  Shield,
  Lock,
  Pin,
  Images,
  MessageSquare,
  AtSign,
  BarChart3,
  Check,
  Smile,
  Pencil,
  Forward,
  Star,
  Copy,
  Link2,
  VolumeX,
  Volume2,
  Ban,
  ShieldOff,
  X,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { messagesApi, type Message } from '../../apis/messages';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { usersApi, type PresenceStatus, type User } from '../../apis/users';
import { canRecallByCreatedAt } from '../../constants/chatPolicy';
import { REACTIONS, ReactionIcon } from '../../components/chat/ReactionIcons';
import GroupHeader from './group/GroupHeader';
import GroupForwardModal from './group/GroupForwardModal';
import GroupSettings from './group/GroupSettings';
import GroupInput from './group/GroupInput';
import CreatePollModal from './components/CreatePollModal';
import CreateAppointmentModal from './components/CreateAppointmentModal';
import PollMessageCard from './components/PollMessageCard';
import AppointmentMessageCard from './components/AppointmentMessageCard';
import { useGroupPolls } from './hooks/useGroupPolls';
import { useGroupAppointments } from './hooks/useGroupAppointments';
import { useGroupMessages } from './hooks/useGroupMessages';
import ViewProfileModal from './components/ViewProfileModal';

export default function GroupChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isConnected, subscribe, subscribeConversationRoom } = useSocket();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [approvalsRequired, setApprovalsRequired] = useState(false);
  const [onlyAdminsCanSend, setOnlyAdminsCanSend] = useState(false);
  const [onlyAdminsCanAddMembers, setOnlyAdminsCanAddMembers] = useState(true);

  const [memberQuery, setMemberQuery] = useState('');
  const [memberCandidates, setMemberCandidates] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [pin, setPin] = useState('');

  const [activeTab, setActiveTab] = useState<'chat' | 'pinned' | 'media'>('chat');
  const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  const [mediaType, setMediaType] = useState<string>('');
  const [loadingPinned, setLoadingPinned] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [seenByMessageId, setSeenByMessageId] = useState<Record<string, string[]>>({});
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceStatus>>({});

  const typingStopTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const lastSeenSentMessageIdRef = useRef<string | null>(null);
  const prevConnectedRef = useRef<boolean>(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Ã¢â€ â‚¬Ã¢â€ â‚¬ New feature state Ã¢â€ â‚¬Ã¢â€ â‚¬
  const [forwardConversations, setForwardConversations] = useState<any[]>([]);
  const [contextMenuMsgId, setContextMenuMsgId] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [viewProfileTarget, setViewProfileTarget] = useState<{ userId: string, userName: string } | null>(null);

  const conversationId = id || '';

  const isOwner = !!(user?.id && conversation?.ownerId === user.id);

  const {
    isCreatePollOpen,
    setIsCreatePollOpen,
    creatingPoll,
    votingPollMessageId,
    handleCreatePoll,
    handleVotePoll,
  } = useGroupPolls({
    conversationId: id || '',
    userId: user?.id,
    userName: user?.fullName
  });

  const {
    isCreateAppointmentOpen,
    setIsCreateAppointmentOpen,
    creatingAppointment,
    joiningAppointmentId,
    handleCreateAppointment,
    handleJoinAppointment,
  } = useGroupAppointments({
    conversationId: conversationId || '',
    userId: user?.id,
    userName: user?.fullName,
    loadMessages: resyncRecentMessages,
  });

  const {
    editingMessageId,
    editContent,
    setEditContent,
    forwardingMessageId,
    setForwardingMessageId,
    forwardTargetId,
    setForwardTargetId,
    togglePinMessage,
    recallMessage,
    deleteMessageForMe,
    startEdit,
    cancelEdit,
    submitEdit,
    handleToggleStar,
  } = useGroupMessages({
    conversationId: id || '',
    userId: user?.id,
    messages,
    setMessages,
  });
  const isAdmin = !!(user?.id && conversation?.adminIds?.includes(user.id));
  const canManage = isOwner || isAdmin;
  const canSend = !conversation?.onlyAdminsCanSend || canManage;

  const memberRows = useMemo(() => {
    const ids = conversation?.participantIds || [];
    const names = conversation?.participantNames || [];
    return ids.map((participantId, idx) => ({
      participantId,
      name: names[idx] || participantId,
      isOwner: conversation?.ownerId === participantId,
      isAdmin: conversation?.adminIds?.includes(participantId) || false,
    }));
  }, [conversation]);

  const typingNames = useMemo(() => {
    const idSet = new Set(typingUserIds);
    return memberRows
      .filter((m) => idSet.has(m.participantId))
      .map((m) => m.name)
      .slice(0, 3);
  }, [typingUserIds, memberRows]);

  const onlineCount = useMemo(() => {
    return memberRows.filter((m) => presenceByUserId[m.participantId]?.online).length;
  }, [memberRows, presenceByUserId]);

  const mentionCandidates = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    if (!mentionOpen) return [];
    return memberRows
      .filter((m) => m.participantId !== user?.id)
      .filter((m) => !q || m.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [mentionOpen, mentionQuery, memberRows, user?.id]);

  const loadConversation = async () => {
    if (!conversationId) return;
    const data = await conversationsApi.getConversationById(conversationId);
    setConversation(data);
    setGroupName(data.groupName || 'Group Chat');
    setDescription(data.description || '');
    setApprovalsRequired(!!data.approvalsRequired);
    setOnlyAdminsCanSend(!!data.onlyAdminsCanSend);
    setOnlyAdminsCanAddMembers(data.onlyAdminsCanAddMembers ?? true);
    refreshPresence(data.participantIds || []).catch(() => undefined);
  };

  const syncSeenMapFromMessages = (source: Message[]) => {
    const next: Record<string, string[]> = {};
    for (const m of source) {
      if (m.seenByUserIds && m.seenByUserIds.length > 0) {
        next[m.id] = Array.from(new Set(m.seenByUserIds));
      }
    }
    setSeenByMessageId(next);
  };

  const loadInitialMessages = async () => {
    if (!conversationId) return;
    const page = await messagesApi.getMessagesByConversationCursor(conversationId, undefined, 20, user?.id);
    const initial = page.messages || [];
    setMessages(initial);
    setNextCursor(page.nextCursor || null);
    setHasMore(!!page.hasMore);
    syncSeenMapFromMessages(initial);
    isInitialLoadRef.current = true;
  };

  const refreshPresence = async (participantIds?: string[]) => {
    const ids = participantIds || conversation?.participantIds || [];
    if (!ids.length) {
      setPresenceByUserId({});
      return;
    }
    try {
      const status = await usersApi.getPresenceByUserIds(ids);
      setPresenceByUserId(status || {});
    } catch {
      // keep old state when presence API is temporarily unavailable
    }
  };

  const mergeMessages = (current: Message[], incoming: Message[]): Message[] => {
    const map = new Map<string, Message>();
    for (const m of current) {
      map.set(m.id, m);
    }
    for (const m of incoming) {
      const existing = map.get(m.id);
      map.set(m.id, existing ? { ...existing, ...m } : m);
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  };

  const resyncRecentMessages = async () => {
    if (!conversationId) return;
    try {
      const page = await messagesApi.getMessagesByConversationCursor(conversationId, undefined, 50, user?.id);
      const recent = page.messages || [];
      setMessages((prev) => mergeMessages(prev, recent));
      setSeenByMessageId((prev) => {
        const next = { ...prev };
        for (const m of recent) {
          if (m.seenByUserIds?.length) {
            next[m.id] = Array.from(new Set(m.seenByUserIds));
          }
        }
        return next;
      });
    } catch {
      // ignore reconnect sync errors; next reload will recover
    }
  };

  // Smart auto-scroll and scroll-position maintenance
  useEffect(() => {
    const container = scrollContainerRef.current;
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    prevMessageCountRef.current = currentCount;

    if (currentCount <= prevCount) return;

    if (isInitialLoadRef.current) {
      if (container) container.scrollTop = container.scrollHeight;
      isInitialLoadRef.current = false;
      prevScrollHeightRef.current = 0;
      return;
    }

    if (prevScrollHeightRef.current > 0 && container) {
      const newHeight = container.scrollHeight;
      const diff = newHeight - prevScrollHeightRef.current;
      container.scrollTop = diff;
      prevScrollHeightRef.current = 0;
      return;
    }

    const newestMessage = messages[messages.length - 1];
    const isSentByMe = newestMessage?.senderId === user?.id;
    const isNearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight < 200
      : true;

    if (isSentByMe || isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [messages, user?.id]);

  const loadMore = async () => {
    if (!conversationId || !nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const page = await messagesApi.getMessagesByConversationCursor(conversationId, nextCursor, 20, user?.id);
      const older = page.messages || [];
      setMessages((prev) => [...older, ...prev]);
      setNextCursor(page.nextCursor || null);
      setHasMore(!!page.hasMore);
      setSeenByMessageId((prev) => {
        const merged = { ...prev };
        for (const m of older) {
          if (m.seenByUserIds && m.seenByUserIds.length > 0) {
            merged[m.id] = Array.from(new Set(m.seenByUserIds));
          }
        }
        return merged;
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !loadingMore && hasMore && nextCursor) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMore();
    }
  };

  const refreshPinned = async () => {
    if (!conversationId || !user?.id) return;
    try {
      setLoadingPinned(true);
      const data = await messagesApi.getPinnedMessages(conversationId, user.id);
      setPinnedMessages(data);
    } catch {
      setPinnedMessages([]);
    } finally {
      setLoadingPinned(false);
    }
  };

  const refreshMedia = async () => {
    if (!conversationId || !user?.id) return;
    try {
      setLoadingMedia(true);
      const data = await messagesApi.getMediaMessages(conversationId, user.id, mediaType || undefined);
      setMediaMessages(data);
    } catch {
      setMediaMessages([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    setError(null);
    Promise.all([loadConversation(), loadInitialMessages()])
      .catch((err: any) => setError(err?.message || 'Cannot load group chat'))
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (activeTab === 'pinned') {
      refreshPinned().catch(() => undefined);
    }
    if (activeTab === 'media') {
      refreshMedia().catch(() => undefined);
    }
  }, [activeTab, mediaType, conversationId, user?.id]);

  useEffect(() => {
    const wasConnected = prevConnectedRef.current;
    if (!wasConnected && isConnected) {
      resyncRecentMessages().catch(() => undefined);
      refreshPresence().catch(() => undefined);
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected, conversationId]);

  useEffect(() => {
    if (!conversation?.participantIds?.length) return;
    refreshPresence(conversation.participantIds).catch(() => undefined);
  }, [conversation?.participantIds?.join(',')]);

  useEffect(() => {
    if (!isConnected || !conversationId || !user?.id) return;

    const unsubscribeRoom = subscribeConversationRoom(conversationId);

    const unsubMessage = subscribe('MESSAGE_RECEIVED', (event) => {
      const incoming = event.data as Message;
      if (!incoming || incoming.conversationId !== conversationId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return mergeMessages(prev, [incoming]);
      });
      if (incoming.seenByUserIds) {
        setSeenByMessageId((prev) => ({
          ...prev,
          [incoming.id]: Array.from(new Set(incoming.seenByUserIds || [])),
        }));
      }
      if (activeTab === 'pinned' && incoming.pinned) {
        refreshPinned().catch(() => undefined);
      }
      if (activeTab === 'media' && incoming.attachments && incoming.attachments.length > 0) {
        refreshMedia().catch(() => undefined);
      }
    });

    const unsubDeleted = subscribe('MESSAGE_DELETED', (event) => {
      const payload = event.data as { conversationId: string; messageId: string };
      if (!payload || payload.conversationId !== conversationId) return;
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      setMediaMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    });

    const unsubDeletedForMe = subscribe('MESSAGE_DELETED_FOR_ME', (event) => {
      const payload = event.data as { conversationId: string; messageId: string };
      if (!payload || payload.conversationId !== conversationId) return;
      setMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
      setMediaMessages((prev) => prev.filter((m) => m.id !== payload.messageId));
    });

    const unsubPin = subscribe('MESSAGE_PINNED', (event) => {
      const payload = event.data as { conversationId: string; messageId: string; pinned: boolean };
      if (!payload || payload.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, pinned: payload.pinned } : m)));
      if (activeTab === 'pinned') {
        refreshPinned().catch(() => undefined);
      }
    });

    const unsubEdited = subscribe('MESSAGE_EDITED', (event) => {
      const payload = event.data as { conversationId: string; message: Message };
      if (!payload || payload.conversationId !== conversationId || !payload.message) return;
      setMessages((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
    });

    const unsubReacted = subscribe('MESSAGE_REACTED', (event) => {
      const payload = event.data as { conversationId: string; messageId: string; emojis: string[] };
      if (!payload || payload.conversationId !== conversationId) return;
      setMessages((prev) => prev.map((m) => (m.id === payload.messageId ? { ...m, emojis: payload.emojis } : m)));
    });

    const unsubPollUpdated = subscribe('POLL_UPDATED', (event) => {
      const payload = event.data as { conversationId: string; message: Message };
      if (!payload || payload.conversationId !== conversationId || !payload.message) return;
      setMessages((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
    });

    const unsubAppointmentUpdated = subscribe('APPOINTMENT_UPDATED', (event) => {
      const payload = event.data as { conversationId: string; message: Message };
      if (!payload || payload.conversationId !== conversationId || !payload.message) return;
      setMessages((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
    });

    const unsubAppointmentCreated = subscribe('APPOINTMENT_CREATED', (event) => {
      if (event.type !== 'APPOINTMENT_CREATED' || !event.data) return;
      // SYSTEM message announcement
    });

    const unsubTyping = subscribe('TYPING', (event) => {
      const payload = event.data as { conversationId: string; userId: string; typing: boolean };
      if (!payload || payload.conversationId !== conversationId || payload.userId === user.id) return;
      setTypingUserIds((prev) => {
        if (payload.typing) {
          if (prev.includes(payload.userId)) return prev;
          return [...prev, payload.userId];
        }
        return prev.filter((id) => id !== payload.userId);
      });
    });

    const unsubSeen = subscribe('MESSAGE_SEEN', (event) => {
      const payload = event.data as { conversationId: string; userId: string; lastSeenMessageId: string };
      if (!payload || payload.conversationId !== conversationId) return;
      if (!payload.lastSeenMessageId || !payload.userId) return;
      setSeenByMessageId((prev) => {
        const existing = prev[payload.lastSeenMessageId] || [];
        if (existing.includes(payload.userId)) return prev;
        return {
          ...prev,
          [payload.lastSeenMessageId]: [...existing, payload.userId],
        };
      });
    });

    const unsubPresence = subscribe('USER_PRESENCE_CHANGED', (event) => {
      const payload = event.data as { userId?: string; username?: string; online?: boolean; lastSeenAt?: string };
      if (!payload?.userId) return;
      if (!(conversation?.participantIds || []).includes(payload.userId)) return;
      setPresenceByUserId((prev) => ({
        ...prev,
        [payload.userId!]: {
          userId: payload.userId!,
          username: payload.username,
          online: !!payload.online,
          lastSeenAt: payload.lastSeenAt || null,
        },
      }));
    });

    const unsubJoin = subscribe('JOIN_REQUEST_UPDATED', (event) => {
      const payload = event.data as { conversationId: string };
      if (!payload || payload.conversationId !== conversationId) return;
      loadConversation().catch(() => undefined);
    });

    const unsubHistoryCleared = subscribe('MESSAGE_HISTORY_CLEARED', (event) => {
      const payload = event.data as { conversationId: string };
      if (!payload || payload.conversationId !== conversationId) return;
      setMessages([]);
      setPinnedMessages([]);
      setMediaMessages([]);
      setNextCursor(null);
      setHasMore(false);
      setSeenByMessageId({});
    });

    return () => {
      unsubMessage();
      unsubDeleted();
      unsubDeletedForMe();
      unsubPin();
      unsubEdited();
      unsubReacted();
      unsubPollUpdated();
      unsubAppointmentUpdated();
      unsubAppointmentCreated();
      unsubTyping();
      unsubSeen();
      unsubPresence();
      unsubJoin();
      unsubHistoryCleared();
      unsubscribeRoom();
    };
  }, [conversationId, isConnected, subscribe, subscribeConversationRoom, user?.id, activeTab, conversation?.participantIds]);

  useEffect(() => {
    const q = memberQuery.trim();
    if (!q || !showSettings) {
      setMemberCandidates([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const found = await usersApi.searchUsers(q);
        const participantSet = new Set(conversation?.participantIds || []);
        setMemberCandidates(found.filter((u) => !!u.id && !participantSet.has(u.id!)));
      } catch {
        setMemberCandidates([]);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [memberQuery, showSettings, conversation?.participantIds]);

  useEffect(() => {
    if (!conversationId || !user?.id || messages.length === 0) return;
    const lastIncoming = [...messages]
      .reverse()
      .find((m) => !m.isDeleted && m.senderId !== user.id);

    if (!lastIncoming) return;
    if (lastSeenSentMessageIdRef.current === lastIncoming.id) return;

    lastSeenSentMessageIdRef.current = lastIncoming.id;
    messagesApi
      .markSeen(conversationId, { userId: user.id, lastSeenMessageId: lastIncoming.id })
      .catch(() => undefined);
  }, [messages, conversationId, user?.id]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (isTypingRef.current && conversationId && user?.id) {
        messagesApi.sendTypingEvent(conversationId, { userId: user.id, typing: false }).catch(() => undefined);
      }
    };
  }, [conversationId, user?.id]);

  const sendTyping = async (typing: boolean) => {
    if (!conversationId || !user?.id) return;
    try {
      await messagesApi.sendTypingEvent(conversationId, { userId: user.id, typing });
    } catch {
      // ignore typing send errors
    }
  };

  const scheduleTypingStop = () => {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }
    typingStopTimerRef.current = window.setTimeout(() => {
      if (!isTypingRef.current) return;
      isTypingRef.current = false;
      sendTyping(false).catch(() => undefined);
    }, 1200);
  };

  const updateMentionSuggestionState = (raw: string) => {
    const cursor = raw.length;
    const beforeCursor = raw.slice(0, cursor);
    const match = beforeCursor.match(/@\[?([^\]\s]*)$/);
    if (!match) {
      setMentionOpen(false);
      setMentionQuery('');
      return;
    }
    setMentionOpen(true);
    setMentionQuery(match[1] || '');
  };

  const handleMessageInput = (raw: string) => {
    setMessage(raw);
    updateMentionSuggestionState(raw);

    if (!conversationId || !user?.id || !canSend) return;

    const hasContent = raw.trim().length > 0;
    if (hasContent && !isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true).catch(() => undefined);
    }

    if (!hasContent && isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false).catch(() => undefined);
    }

    if (hasContent) {
      scheduleTypingStop();
    }
  };

  const applyMention = (name: string) => {
    const next = message.replace(/@\[?([^\]\s]*)$/, `@[${name}] `);
    setMessage(next);
    setMentionOpen(false);
    setMentionQuery('');
  };

  const extractMentionUserIds = (content: string): string[] => {
    const nameToId = new Map(memberRows.map((m) => [m.name.toLowerCase(), m.participantId]));
    const ids = new Set<string>();
    const matcher = content.matchAll(/@\[([^\]]+)]/g);
    for (const item of matcher) {
      const name = (item[1] || '').trim().toLowerCase();
      const id = nameToId.get(name);
      if (id) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(@\[[^\]]+])/g);
    return parts.map((part, idx) => {
      const mentionMatch = part.match(/^@\[([^\]]+)]$/);
      if (mentionMatch) {
        return (
          <span key={`mention-${idx}`} className="text-blue-300 font-medium">
            @{mentionMatch[1]}
          </span>
        );
      }
      return <span key={`text-${idx}`}>{part}</span>;
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user?.id || !conversationId || sending) return;
    if (!canSend) {
      setError('Nhom nay chi admin/chu nhom moi duoc gui tin nhan.');
      return;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false).catch(() => undefined);
    }

    const payload = message.trim();
    const mentionUserIds = extractMentionUserIds(payload);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      conversationId,
      senderId: user.id,
      senderName: user.fullName || user.username || 'You',
      senderAvatar: user.avatar,
      content: payload,
      mentionUserIds,
      seenByUserIds: [user.id],
      isDeleted: false,
      isEdited: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setSeenByMessageId((prev) => ({ ...prev, [tempId]: [user.id] }));
    setMessage('');
    setSending(true);

    try {
      const created = await messagesApi.createMessage({
        conversationId,
        senderId: user.id,
        senderName: user.fullName || user.username || 'You',
        senderAvatar: user.avatar,
        content: payload,
        mentionUserIds,
      });
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId);
        if (withoutTemp.some((m) => m.id === created.id)) {
          return withoutTemp;
        }
        return mergeMessages(withoutTemp, [created]);
      });
      setSeenByMessageId((prev) => {
        const next = { ...prev };
        delete next[tempId];
        next[created.id] = created.seenByUserIds || [user.id];
        return next;
      });
      if (activeTab === 'pinned' && created.pinned) {
        refreshPinned().catch(() => undefined);
      }
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const msg = err?.message || '';
      if (err?.status === 403 || msg.includes('friends') || msg.includes('FRIENDS_ONLY')) {
        setError('KhÃƒÂ´ng thÃ¡Â»Æ’ gÃ¡Â»Â­i tin nhÃ¡ÂºÂ¯n: ngÃ†Â°Ã¡Â»Â i nhÃ¡ÂºÂ­n chÃ¡Â»â€° chÃ¡ÂºÂ¥p nhÃ¡ÂºÂ­n tin nhÃ¡ÂºÂ¯n tÃ¡Â»Â« bÃ¡ÂºÂ¡n bÃƒÂ¨.');
      } else {
        setError(msg || 'GÃ¡Â»Â­i tin nhÃ¡ÂºÂ¯n thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
      }
    } finally {
      setSending(false);
    }
  };

  const saveSettings = async () => {
    if (!conversationId || !user?.id) return;
    try {
      const updated = await conversationsApi.updateConversationMeta(conversationId, {
        requesterId: user.id,
        groupName,
        description,
        approvalsRequired,
        onlyAdminsCanSend,
        onlyAdminsCanAddMembers,
      });
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'Cap nhat cai dat that bai');
    }
  };

  const addMembers = async () => {
    if (!conversationId || !user?.id || selectedMemberIds.length === 0) return;
    try {
      const updated = await conversationsApi.addGroupMembers(conversationId, {
        requesterId: user.id,
        participantIds: selectedMemberIds,
      });
      setConversation(updated);
      setSelectedMemberIds([]);
      setMemberQuery('');
      setMemberCandidates([]);
    } catch (err: any) {
      setError(err?.message || 'Them thanh vien that bai');
    }
  };

  const removeMember = async (participantId: string) => {
    if (!conversationId || !user?.id) return;
    try {
      const updated = await conversationsApi.removeGroupMember(conversationId, {
        requesterId: user.id,
        participantId,
      });
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'Xoa thanh vien that bai');
    }
  };

  const hideConversation = async () => {
    if (!conversationId || !user?.id || !pin.trim()) {
      setError('Nhap PIN de an nhom');
      return;
    }
    try {
      await conversationsApi.hideConversation(conversationId, { userId: user.id, pin: pin.trim() });
      navigate('/messenger');
    } catch (err: any) {
      setError(err?.message || 'An nhom that bai');
    }
  };

  const leaveGroup = async () => {
    if (!conversationId || !user?.id) return;
    try {
      await conversationsApi.leaveGroup(conversationId, { requesterId: user.id });
      navigate('/messenger');
    } catch (err: any) {
      setError(err?.message || 'Roi nhom that bai');
    }
  };

  const clearConversationForMe = async () => {
    if (!conversationId || !user?.id) return;
    try {
      await conversationsApi.clearConversationForUser(conversationId, { userId: user.id });
      navigate('/messenger');
    } catch (err: any) {
      setError(err?.message || 'Xoa cuoc tro chuyen that bai');
    }
  };

  const startForward = async (msgId: string) => {
    setForwardingMessageId(msgId);
    setContextMenuMsgId(null);
    try {
      const convs = await conversationsApi.getConversationsByUserId(user?.id || '');
      setForwardConversations(convs.filter((c: any) => c.id !== conversationId));
    } catch { /* ignore */ }
  };
  const submitForward = async () => {
    if (!forwardingMessageId || !user?.id || !forwardTargetId) return;
    try {
      await messagesApi.forwardMessage(forwardingMessageId, {
        requesterId: user.id,
        targetConversationId: forwardTargetId,
      });
      setForwardingMessageId(null);
      setForwardTargetId('');
    } catch (err: any) {
      setError(err?.message || 'ChuyÃ¡Â»Æ’n tiÃ¡ÂºÂ¿p thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
    }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    try {
      const updated = await messagesApi.toggleReaction(msgId, emoji);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      setError(err?.message || 'Reaction thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
    }
    setContextMenuMsgId(null);
  };

  const handleToggleBlock = async () => {
    if (!conversationId || !user?.id) return;
    try {
      const updated = await conversationsApi.toggleBlockConversation(conversationId, user.id);
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'ChÃ¡ÂºÂ·n/bÃ¡Â»Â  chÃ¡ÂºÂ·n thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
    }
  };

  const handleToggleBan = async (targetUserId: string) => {
    if (!conversationId || !user?.id) return;
    try {
      const updated = await conversationsApi.toggleBanMember(conversationId, {
        requesterId: user.id,
        targetUserId,
      });
      setConversation(updated);
    } catch (err: any) {
      setError(err?.message || 'CÃ¡ÂºÂ¥m/bÃ¡Â»Â  cÃ¡ÂºÂ¥m thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
    }
  };

  const handleGetInviteLink = async () => {
    if (!conversationId || !user?.id) return;
    try {
      const link = await conversationsApi.getInviteLink(conversationId, user.id);
      setInviteLink(link);
      navigator.clipboard.writeText(link).catch(() => undefined);
    } catch (err: any) {
      setError(err?.message || 'LÃ¡ÂºÂ¥y link mÃ¡Â»Â i thÃ¡ÂºÂ¥t bÃ¡ÂºÂ¡i');
    }
  };
  const renderAttachments = (msg: Message) => {
    if (!msg.attachments || msg.attachments.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        {msg.attachments.map((att, idx) => {
          const kind = (att.type || '').toLowerCase();
          if (kind === 'image') {
            return (
              <a key={`${msg.id}-att-${idx}`} href={att.url} target="_blank" rel="noreferrer" className="block">
                <img src={att.url} alt={att.fileName || 'image'} className="max-w-64 rounded-lg border border-gray-200" />
              </a>
            );
          }
          return (
            <a
              key={`${msg.id}-att-${idx}`}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline text-blue-500 break-all"
            >
              {att.fileName || att.url}
            </a>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="h-screen bg-white flex items-center justify-center text-gray-500">Dang tai nhom chat...</div>;
  }

  return (
    <div className="h-screen bg-white flex flex-col relative">
      <GroupHeader
        groupName={conversation?.groupName || 'Group Chat'}
        memberCount={conversation?.participantIds?.length || 0}
        onlineCount={onlineCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleSettings={() => setShowSettings((v) => !v)}
      />

      {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>}

      {showSettings && (
        <GroupSettings
          conversation={conversation}
          groupName={groupName}
          onGroupNameChange={setGroupName}
          description={description}
          onDescriptionChange={setDescription}
          approvalsRequired={approvalsRequired}
          onApprovalsRequiredChange={setApprovalsRequired}
          onlyAdminsCanSend={onlyAdminsCanSend}
          onOnlyAdminsCanSendChange={setOnlyAdminsCanSend}
          onlyAdminsCanAddMembers={onlyAdminsCanAddMembers}
          onOnlyAdminsCanAddMembersChange={setOnlyAdminsCanAddMembers}
          canManage={canManage}
          isOwner={isOwner}
          onSaveSettings={saveSettings}
          memberQuery={memberQuery}
          onMemberQueryChange={setMemberQuery}
          memberCandidates={memberCandidates}
          selectedMemberIds={selectedMemberIds}
          onToggleMemberSelection={(id) => {
            setSelectedMemberIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
          }}
          onAddMembers={addMembers}
          memberRows={memberRows}
          presenceByUserId={presenceByUserId}
          onRemoveMember={removeMember}
          onToggleBan={handleToggleBan}
          pin={pin}
          onPinChange={setPin}
          onHideConversation={hideConversation}
          onClearConversationForMe={clearConversationForMe}
          onLeaveGroup={leaveGroup}
          onToggleBlock={handleToggleBlock}
          onGetInviteLink={handleGetInviteLink}
          inviteLink={inviteLink}
          userId={user?.id}
        />
      )}

      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-white"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {activeTab === 'chat' && (
          <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const canRecall = isMe && canRecallByCreatedAt(msg.createdAt);
              const seenList = (seenByMessageId[msg.id] || msg.seenByUserIds || [])
                .filter((uid) => uid !== msg.senderId)
                .map((uid) => memberRows.find((m) => m.participantId === uid)?.name || uid);

              if (msg.messageType === 'SYSTEM') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      {(() => {
                        let resolved = msg.content;
                        const ids = conversation?.participantIds || [];
                        const names = conversation?.participantNames || [];
                        ids.forEach((id, idx) => {
                          if (!id) return;
                          resolved = resolved.replace(new RegExp(`\\b${id}\\b`, 'g'), names[idx] || id);
                        });
                        return resolved;
                      })()}
                    </div>
                  </div>
                );
              }

              if (msg.messageType === 'POLL') {
                return (
                  <PollMessageCard
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    userId={user?.id || ''}
                    onVote={handleVotePoll}
                    voting={votingPollMessageId === msg.id}
                    participantNames={conversation?.participantNames}
                    participantIds={conversation?.participantIds}
                  />
                );
              }

              if (msg.messageType === 'APPOINTMENT') {
                return (
                  <AppointmentMessageCard
                    key={msg.id}
                    msg={msg}
                    isMe={isMe}
                    userId={user?.id || ''}
                    onJoin={handleJoinAppointment}
                    joining={joiningAppointmentId === msg.id}
                    participantNames={conversation?.participantNames}
                    participantIds={conversation?.participantIds}
                  />
                );
              }

              return (
                <div key={msg.id} className={`group flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && (
                      <div 
                        className="text-xs text-gray-500 mb-1 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => setViewProfileTarget({ userId: msg.senderId, userName: msg.senderName })}
                      >
                        {msg.senderName}
                      </div>
                    )}

                    {/* Edit mode */}
                    {editingMessageId === msg.id ? (
                      <div className="w-full space-y-2">
                        <input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
                          className="w-full h-10 px-3 rounded-lg border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button onClick={submitEdit} className="h-8 px-3 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">LÃ†Â°u</button>
                          <button onClick={cancelEdit} className="h-8 px-3 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200">HÃ¡Â»Â§y</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Message bubble + hover actions */}
                        <div className="relative">
                          <div 
                            className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'} cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all`}
                            onClick={() => setViewProfileTarget({ userId: msg.senderId, userName: msg.senderName })}
                          >
                            <div className="whitespace-pre-wrap wrap-break-word">{renderMessageContent(msg.content || '')}</div>
                            {msg.isEdited && <span className="text-[10px] opacity-60 ml-1">(Ã„â€˜ÃƒÂ£ sÃ¡Â»Â­a)</span>}
                            {renderAttachments(msg)}
                          </div>

                          {/* Hover action bar */}
                          <div className={`absolute top-0 ${isMe ? 'right-full mr-1' : 'left-full ml-1'} hidden group-hover:flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5`}>
                            <button onClick={() => setContextMenuMsgId(contextMenuMsgId === msg.id ? null : msg.id)} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center" title="ThÃƒÂªm">
                              <Smile className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            {isMe && canRecallByCreatedAt(msg.createdAt) && (
                              <button onClick={() => startEdit(msg)} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center" title="SÃ¡Â»Â­a">
                                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                            )}
                            <button onClick={() => startForward(msg.id)} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center" title="ChuyÃ¡Â»Æ’n tiÃ¡ÂºÂ¿p">
                              <Forward className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            <button onClick={() => handleToggleStar(msg.id)} className="w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center" title="Star">
                              <Star className={`w-3.5 h-3.5 ${msg.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-500'}`} />
                            </button>
                          </div>

                          {/* Quick reaction popup */}
                          {contextMenuMsgId === msg.id && (
                            <div className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} flex items-center gap-1 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5 z-10`}>
                              {REACTIONS.map((r) => (
                                <button
                                  key={r.key}
                                  onClick={() => handleReaction(msg.id, r.key)}
                                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-transform hover:scale-125"
                                  title={r.label}
                                >
                                  <span className="w-5 h-5 inline-block">{r.svg}</span>
                                </button>
                              ))}
                              <button onClick={() => setContextMenuMsgId(null)} className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-3 h-3 text-gray-400" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Reaction display */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(msg.reactions).map(([key, count]) => (
                              <button
                                key={key}
                                onClick={() => handleReaction(msg.id, key)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-xs border border-gray-200 transition-colors"
                              >
                                <ReactionIcon reactionKey={key} className="w-4 h-4 inline-block" />
                                <span className="text-gray-600 font-medium">{count as number}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Action row */}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => togglePinMessage(msg.id)} className="hover:text-gray-600 inline-flex items-center gap-1">
                        <Pin className={`w-3 h-3 ${msg.pinned ? 'text-blue-500' : ''}`} />
                        {msg.pinned ? 'BÃ¡Â»Â  ghim' : 'Ghim'}
                      </button>
                      {canRecall && (
                        <button onClick={() => recallMessage(msg.id)} className="hover:text-red-600 inline-flex items-center gap-1">
                          Thu hÃ¡Â»â€œi
                        </button>
                      )}
                      <button onClick={() => deleteMessageForMe(msg.id)} className="hover:text-red-600 inline-flex items-center gap-1">
                        XÃƒÂ³a phÃƒÂ­a tÃƒÂ´i
                      </button>
                    </div>
                    {isMe && seenList.length > 0 && (
                      <div className="text-[11px] text-emerald-600 mt-0.5">Đã xem: {seenList.slice(0, 3).join(', ')}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'pinned' && (
          <>
            {loadingPinned && <div className="text-sm text-gray-500">Dang tai pinned messages...</div>}
            {!loadingPinned && pinnedMessages.length === 0 && (
              <div className="text-sm text-gray-500">Chua co tin nhan ghim.</div>
            )}
            {!loadingPinned && pinnedMessages.map((msg) => (
              <div key={`pin-${msg.id}`} className="p-3 border border-gray-200 rounded-xl">
                <div className="text-xs text-gray-500 mb-1">{msg.senderName}</div>
                <div className="text-sm text-gray-900 whitespace-pre-wrap wrap-break-word">{msg.content}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <button onClick={() => togglePinMessage(msg.id)} className="text-xs text-blue-600 hover:text-blue-700">
                    Bo ghim
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'media' && (
          <>
            <div className="flex flex-wrap gap-2">
              {['', 'image', 'video', 'file', 'audio'].map((kind) => (
                <button
                  key={`media-kind-${kind || 'all'}`}
                  onClick={() => setMediaType(kind)}
                  className={`h-8 px-3 rounded-full text-xs border ${mediaType === kind ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {kind || 'all'}
                </button>
              ))}
            </div>

            {loadingMedia && <div className="text-sm text-gray-500">Dang tai media...</div>}
            {!loadingMedia && mediaMessages.length === 0 && (
              <div className="text-sm text-gray-500">Chua co media trong nhom.</div>
            )}
            {!loadingMedia && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {mediaMessages.flatMap((msg) => (msg.attachments || []).map((att, idx) => {
                  const kind = (att.type || '').toLowerCase();
                  if (mediaType && kind !== mediaType) return null;
                  if (kind === 'image') {
                    return (
                      <a key={`media-${msg.id}-${idx}`} href={att.url} target="_blank" rel="noreferrer" className="block">
                        <img src={att.url} alt={att.fileName || 'image'} className="w-full h-36 object-cover rounded-lg border border-gray-200" />
                      </a>
                    );
                  }
                  return (
                    <a
                      key={`media-${msg.id}-${idx}`}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 border border-gray-200 rounded-lg text-xs break-all hover:bg-gray-50"
                    >
                      {att.fileName || att.url}
                    </a>
                  );
                }))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 bg-white">
        {conversation?.isDisbanded ? (
          <div className="p-4 bg-gray-50 flex items-center justify-center rounded-xl">
            <p className="text-red-500 font-medium text-sm">Nhóm này đã được giải tán bởi nhóm trưởng</p>
          </div>
        ) : (
          <GroupInput
            message={message}
            onMessageInput={handleMessageInput}
            onSend={handleSendMessage}
            canSend={canSend}
            sending={sending}
            activeTab={activeTab}
            typingNames={typingNames}
            onOpenPollModal={() => setIsCreatePollOpen(true)}
            onOpenAppointmentModal={() => setIsCreateAppointmentOpen(true)}
            mentionOpen={mentionOpen}
            mentionCandidates={mentionCandidates}
            onApplyMention={applyMention}
          />
        )}

        {/* Create Poll Modal */}
        {isCreatePollOpen && (
          <CreatePollModal
            onClose={() => setIsCreatePollOpen(false)}
            onSubmit={handleCreatePoll}
            creating={creatingPoll}
          />
        )}

        {isCreateAppointmentOpen && (
          <CreateAppointmentModal
            onClose={() => setIsCreateAppointmentOpen(false)}
            onSubmit={handleCreateAppointment}
            creating={creatingAppointment}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Forward modal */}
      {forwardingMessageId && (
        <GroupForwardModal
          conversations={forwardConversations}
          targetId={forwardTargetId}
          onTargetChange={setForwardTargetId}
          onConfirm={submitForward}
          onCancel={() => setForwardingMessageId(null)}
        />
      )}

      {viewProfileTarget && (
        <ViewProfileModal
          userName={viewProfileTarget.userName}
          onConfirm={() => {
            navigate(`/profile/${viewProfileTarget.userId}`);
            setViewProfileTarget(null);
          }}
          onCancel={() => setViewProfileTarget(null)}
        />
      )}
    </div>
  );
}






