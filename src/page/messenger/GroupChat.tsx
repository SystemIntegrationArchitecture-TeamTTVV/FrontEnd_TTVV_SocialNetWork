import { useEffect, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { messagesApi, type Message } from '../../apis/messages';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { usersApi, type PresenceStatus, type User } from '../../apis/users';

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
  const [showPollComposer, setShowPollComposer] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [votingPollMessageId, setVotingPollMessageId] = useState<string | null>(null);
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceStatus>>({});

  const typingStopTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const lastSeenSentMessageIdRef = useRef<string | null>(null);
  const prevConnectedRef = useRef<boolean>(false);

  const conversationId = id || '';

  const isOwner = !!(user?.id && conversation?.ownerId === user.id);
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
    const page = await messagesApi.getMessagesByConversationCursor(conversationId, undefined, 20);
    const initial = page.messages || [];
    setMessages(initial);
    setNextCursor(page.nextCursor || null);
    setHasMore(!!page.hasMore);
    syncSeenMapFromMessages(initial);
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
      const page = await messagesApi.getMessagesByConversationCursor(conversationId, undefined, 50);
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

  const loadMore = async () => {
    if (!conversationId || !nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const page = await messagesApi.getMessagesByConversationCursor(conversationId, nextCursor, 20);
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
      if (incoming.senderId === user.id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
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

    return () => {
      unsubMessage();
      unsubDeleted();
      unsubPin();
      unsubEdited();
      unsubReacted();
      unsubPollUpdated();
      unsubTyping();
      unsubSeen();
      unsubPresence();
      unsubJoin();
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

  const handleSend = async () => {
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
      setMessages((prev) => prev.map((m) => (m.id === tempId ? created : m)));
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
      setError(err?.message || 'Gui tin nhan that bai');
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

  const togglePinMessage = async (messageId: string) => {
    if (!user?.id) return;
    try {
      const updated = await messagesApi.togglePin(messageId, user.id);
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? { ...m, pinned: updated.pinned } : m)));
      if (activeTab === 'pinned') {
        refreshPinned().catch(() => undefined);
      }
    } catch (err: any) {
      setError(err?.message || 'Cap nhat pin that bai');
    }
  };

  const setPollOptionAt = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const addPollOptionField = () => {
    setPollOptions((prev) => (prev.length >= 8 ? prev : [...prev, '']));
  };

  const removePollOptionField = (index: number) => {
    setPollOptions((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleCreatePoll = async () => {
    if (!conversationId || !user?.id || creatingPoll) return;
    const options = pollOptions.map((item) => item.trim()).filter((item) => item.length > 0);
    if (!pollQuestion.trim() || options.length < 2) {
      setError('Binh chon can cau hoi va it nhat 2 lua chon.');
      return;
    }

    setCreatingPoll(true);
    try {
      const created = await messagesApi.createPoll(conversationId, {
        userId: user.id,
        question: pollQuestion.trim(),
        options,
        multipleChoice: pollMultipleChoice,
      });
      setMessages((prev) => [...prev, created]);
      setShowPollComposer(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setPollMultipleChoice(false);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Tao binh chon that bai');
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleVotePoll = async (msg: Message, optionId: string) => {
    if (!user?.id || !msg.id || votingPollMessageId === msg.id) return;

    const currentSelections = (msg.pollOptions || [])
      .filter((option) => (option.voterUserIds || []).includes(user.id))
      .map((option) => option.optionId);

    let nextSelections: string[] = [];
    if (msg.pollMultipleChoice) {
      nextSelections = currentSelections.includes(optionId)
        ? currentSelections.filter((id) => id !== optionId)
        : [...currentSelections, optionId];
      if (nextSelections.length === 0) {
        nextSelections = [optionId];
      }
    } else {
      nextSelections = [optionId];
    }

    setVotingPollMessageId(msg.id);
    try {
      const updated = await messagesApi.votePoll(msg.id, {
        userId: user.id,
        optionIds: nextSelections,
      });
      setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: any) {
      setError(err?.message || 'Vote poll that bai');
    } finally {
      setVotingPollMessageId(null);
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
    <div className="h-screen bg-white flex flex-col">
      <div className="h-16 border-b border-gray-200 px-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/messenger')} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{conversation?.groupName || 'Group Chat'}</h1>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {(conversation?.participantIds?.length || 0)} thanh vien • {onlineCount} online
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'chat' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="Chat"
          >
            <MessageSquare className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => setActiveTab('pinned')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'pinned' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="Pinned"
          >
            <Pin className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${activeTab === 'media' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
            title="Media"
          >
            <Images className="w-4 h-4 text-gray-700" />
          </button>
          <button onClick={() => setShowSettings((v) => !v)} className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <Settings className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {error && <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-b border-red-100">{error}</div>}

      {showSettings && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300"
              placeholder="Ten nhom"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300"
              placeholder="Mo ta nhom"
            />
          </div>

          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={approvalsRequired} onChange={(e) => setApprovalsRequired(e.target.checked)} />
              Duyet thanh vien moi
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyAdminsCanSend} onChange={(e) => setOnlyAdminsCanSend(e.target.checked)} />
              Chi admin duoc gui
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={onlyAdminsCanAddMembers} onChange={(e) => setOnlyAdminsCanAddMembers(e.target.checked)} />
              Chi admin duoc them thanh vien
            </label>
          </div>

          {canManage && (
            <button onClick={saveSettings} className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">
              Luu cai dat
            </button>
          )}

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Plus className="w-4 h-4" /> Them thanh vien
            </div>
            <input
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-300 w-full"
              placeholder="Tim user de them vao nhom"
            />
            <div className="max-h-28 overflow-y-auto space-y-1">
              {memberCandidates.map((candidate) => {
                const candidateId = candidate.id || '';
                const selected = selectedMemberIds.includes(candidateId);
                return (
                  <button
                    key={candidateId}
                    onClick={() => {
                      if (!candidateId) return;
                      setSelectedMemberIds((prev) => selected ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                  >
                    {candidate.fullName || candidate.username || candidateId}
                  </button>
                );
              })}
            </div>
            <button
              onClick={addMembers}
              disabled={!canManage && onlyAdminsCanAddMembers}
              className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-50"
            >
              Them {selectedMemberIds.length} thanh vien
            </button>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Thanh vien trong nhom
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {memberRows.map((member) => (
                <div key={member.participantId} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${presenceByUserId[member.participantId]?.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    {member.name}
                    {member.isOwner ? ' (owner)' : member.isAdmin ? ' (admin)' : ''}
                  </span>
                  {canManage && !member.isOwner && (
                    <button onClick={() => removeMember(member.participantId)} className="text-red-600 hover:text-red-700">
                      Xoa
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Lock className="w-4 h-4" />
              An nhom bang PIN
            </div>
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="h-9 px-3 rounded-lg border border-gray-300"
              placeholder="Nhap PIN"
              type="password"
            />
            <button onClick={hideConversation} className="h-9 px-3 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-sm">
              An nhom
            </button>
            {!isOwner && (
              <button onClick={leaveGroup} className="h-9 px-3 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm">
                Roi nhom
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {activeTab === 'chat' && (
          <>
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="h-9 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 text-sm disabled:opacity-60"
                >
                  {loadingMore ? 'Dang tai them...' : 'Tai tin nhan cu hon'}
                </button>
              </div>
            )}

            {messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              const seenList = (seenByMessageId[msg.id] || msg.seenByUserIds || [])
                .filter((uid) => uid !== msg.senderId)
                .map((uid) => memberRows.find((m) => m.participantId === uid)?.name || uid);

              if (msg.messageType === 'SYSTEM') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              if (msg.messageType === 'POLL') {
                const pollOptions = msg.pollOptions || [];
                const totalVotes = pollOptions.reduce((sum, option) => sum + (option.voterUserIds || []).length, 0);
                const myVotes = new Set(
                  pollOptions
                    .filter((option) => (option.voterUserIds || []).includes(user?.id || ''))
                    .map((option) => option.optionId)
                );

                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}> 
                      {!isMe && <div className="text-xs text-gray-500 mb-1">{msg.senderName}</div>}
                      <div className={`px-4 py-3 rounded-2xl border ${isMe ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="text-xs font-semibold text-indigo-600 mb-2 inline-flex items-center gap-1">
                          <BarChart3 className="w-3.5 h-3.5" />
                          BINH CHON
                        </div>
                        <div className="font-medium text-sm text-gray-900 mb-2">{msg.pollQuestion || msg.content}</div>
                        <div className="space-y-2">
                          {pollOptions.map((option) => {
                            const voteCount = (option.voterUserIds || []).length;
                            const selected = myVotes.has(option.optionId);
                            return (
                              <button
                                key={`${msg.id}-${option.optionId}`}
                                onClick={() => handleVotePoll(msg, option.optionId)}
                                disabled={msg.pollClosed || votingPollMessageId === msg.id}
                                className={`w-full text-left px-3 py-2 rounded-lg border text-sm flex items-center justify-between ${selected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'} disabled:opacity-60`}
                              >
                                <span className="inline-flex items-center gap-2 text-gray-800">
                                  {selected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                  {option.text}
                                </span>
                                <span className="text-xs text-gray-500">{voteCount}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="mt-2 text-[11px] text-gray-500">
                          {totalVotes} vote{totalVotes === 1 ? '' : 's'}{msg.pollMultipleChoice ? ' • nhieu lua chon' : ' • mot lua chon'}
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isMe && <div className="text-xs text-gray-500 mb-1">{msg.senderName}</div>}
                    <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                      <div className="whitespace-pre-wrap wrap-break-word">{renderMessageContent(msg.content || '')}</div>
                      {renderAttachments(msg)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button onClick={() => togglePinMessage(msg.id)} className="hover:text-gray-600 inline-flex items-center gap-1">
                        <Pin className={`w-3 h-3 ${msg.pinned ? 'text-blue-500' : ''}`} />
                        {msg.pinned ? 'Unpin' : 'Pin'}
                      </button>
                    </div>
                    {isMe && seenList.length > 0 && (
                      <div className="text-[11px] text-emerald-600 mt-0.5">Seen by {seenList.slice(0, 3).join(', ')}</div>
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
        {!canSend && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-2">
            Nhom dang bat che do chi admin/owner moi duoc gui tin nhan.
          </div>
        )}

        {activeTab === 'chat' && typingNames.length > 0 && (
          <div className="text-xs text-gray-500 mb-2 inline-flex items-center gap-1">
            <AtSign className="w-3 h-3" />
            {typingNames.join(', ')} dang nhap...
          </div>
        )}

        {activeTab === 'chat' && canSend && (
          <div className="mb-2">
            <button
              onClick={() => setShowPollComposer((prev) => !prev)}
              className="h-8 px-3 rounded-lg border border-gray-300 hover:bg-gray-50 text-xs inline-flex items-center gap-1"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {showPollComposer ? 'Dong tao poll' : 'Tao poll'}
            </button>
          </div>
        )}

        {activeTab === 'chat' && showPollComposer && canSend && (
          <div className="mb-3 p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300"
              placeholder="Cau hoi binh chon"
            />
            <div className="space-y-2">
              {pollOptions.map((option, idx) => (
                <div key={`poll-option-${idx}`} className="flex items-center gap-2">
                  <input
                    value={option}
                    onChange={(e) => setPollOptionAt(idx, e.target.value)}
                    className="flex-1 h-9 px-3 rounded-lg border border-gray-300"
                    placeholder={`Lua chon ${idx + 1}`}
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => removePollOptionField(idx)}
                      className="h-9 px-2 rounded-lg border border-gray-300 text-xs hover:bg-white"
                    >
                      Xoa
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button onClick={addPollOptionField} className="h-8 px-3 rounded-lg border border-gray-300 text-xs hover:bg-white">
                Them lua chon
              </button>
              <label className="text-xs text-gray-700 inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pollMultipleChoice}
                  onChange={(e) => setPollMultipleChoice(e.target.checked)}
                />
                Cho phep nhieu lua chon
              </label>
              <button
                onClick={() => handleCreatePoll().catch(() => undefined)}
                disabled={creatingPoll}
                className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-60"
              >
                {creatingPoll ? 'Dang tao...' : 'Dang poll'}
              </button>
            </div>
          </div>
        )}

        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => handleMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSend().catch(() => undefined);
                }
              }}
              placeholder="Nhap tin nhan (mention: @[Ten Thanh Vien])"
              className="flex-1 h-11 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!canSend || sending || activeTab !== 'chat'}
            />
            <button
              onClick={() => handleSend().catch(() => undefined)}
              disabled={!message.trim() || !canSend || sending || activeTab !== 'chat'}
              className="w-11 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {mentionOpen && mentionCandidates.length > 0 && activeTab === 'chat' && (
            <div className="absolute bottom-14 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1 z-10">
              {mentionCandidates.map((candidate) => (
                <button
                  key={`mention-${candidate.participantId}`}
                  onClick={() => applyMention(candidate.name)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm"
                >
                  {candidate.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
