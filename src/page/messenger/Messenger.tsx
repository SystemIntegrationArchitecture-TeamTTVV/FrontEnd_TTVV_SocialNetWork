import { Link, useNavigate, useLocation, type Location } from 'react-router-dom';
import { Settings, Edit, Search, Phone, Video, Info, Plus, Send, Check, CheckCheck, MoreVertical, X, User, Bell, Palette, Pencil, Lock, Search as SearchIcon, Reply, Forward, Trash2, Copy, Pin, Star, ChevronLeft, ChevronRight, Smile, Mic, FileText, Image as ImageIcon, Users, Bot, Sparkles, Grid3X3, BarChart3, MapPin, Contact, Music, Gift, EyeOff, Shield, Unlock } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../common/icons/IconComponents';
import { REACTIONS } from '../../components/chat/ReactionIcons';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import { useSocket } from '../../contexts/SocketContext';
import EmojiPicker from '../../components/chat/EmojiPicker';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { uploadApi } from '../../apis/upload';
import { messagesApi, type Message, type MessageAttachment } from '../../apis/messages';
import { aiApi, type AIChatRequest, type AIDailySummaryResponse } from '../../apis/ai';
import { usersApi, type PresenceStatus } from '../../apis/users';
import { getLocaleTag } from '../../i18n';
import { canRecallByCreatedAt } from '../../constants/chatPolicy';
import { notify } from '../../services/notify';

interface MessengerLocationState {
  openConversationId?: string;
}

const STICKER_TOPICS = [
  {
    id: 'emoji',
    label: 'Emoji',
    files: [
      'sticker-01.svg', 'sticker-02.svg', 'sticker-03.svg', 'sticker-04.svg',
      'sticker-05.svg', 'sticker-06.svg', 'sticker-07.svg', 'sticker-08.svg',
      'sticker-09.svg', 'sticker-10.svg', 'sticker-11.svg', 'sticker-12.svg',
    ],
  },
  {
    id: 'christmas',
    label: 'Christmas',
    files: [
      'christmas/bear.png',
      'christmas/fox.png',
      'christmas/pig.png',
      'christmas/reindeer.png',
      'christmas/santa-claus.png',
    ],
  },
  {
    id: 'home',
    label: 'Home',
    files: [
      'home/coffee-mug.png',
      'home/reading-book.png',
      'home/reading.png',
      'home/stay-home.png',
      'home/stretching.png',
    ],
  },
  {
    id: 'pets',
    label: 'Pets',
    files: [
      'pets/adopt.png',
      'pets/bath.png',
      'pets/cat.png',
      'pets/dog.png',
      'pets/good_morning.png',
      'pets/have_a_nice_day.png',
      'pets/pet_food.png',
    ],
  },
] as const;

const STICKER_TOPIC_WITH_ALL = [
  {
    id: 'all',
    label: 'All',
    files: STICKER_TOPICS.flatMap((topic) => topic.files),
  },
  ...STICKER_TOPICS,
];

/** Deterministic color from string — same input always gives same color */
const hashColor = (str: string): string => {
  const colors = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#2563eb', '#7c3aed', '#db2777',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export default function Messenger() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: MessengerLocationState };
  const { user } = useAuth();
  const { startCall } = useCall();
  const { isConnected, subscribe, subscribeConversationRoom } = useSocket();
  const {
    conversations,
    messages: apiMessages,
    loading,
    loadConversations,
    loadMessages,
    sendMessage: sendMessageAPI,
    removeMessage,
    removeMessageForMe,
    forwardMessage,
    formatMessageForDisplay,
  } = useMessages();

  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showStickerPanel, setShowStickerPanel] = useState(false);
  const [activeStickerTopic, setActiveStickerTopic] = useState(STICKER_TOPIC_WITH_ALL[0].id);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserIds, setTypingUserIds] = useState<string[]>([]);
  const [isForwarding, setIsForwarding] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<{ id: string; content: string } | null>(null);
  const [forwardTargetConversationId, setForwardTargetConversationId] = useState<string>('');
  const [forwardNote, setForwardNote] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof formatMessageForDisplay>[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ReturnType<typeof formatMessageForDisplay>[]>([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const voiceTranscriptRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [filePreview, setFilePreview] = useState<{ file: File; preview: string } | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // ── Hidden Conversations State ──────────────────────────────────────────
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [hiddenConversations, setHiddenConversations] = useState<Conversation[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingUnlockConv, setPendingUnlockConv] = useState<Conversation | null>(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [showHideInput, setShowHideInput] = useState<string | null>(null); // conversationId being hidden
  const [hidePin, setHidePin] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convId: string } | null>(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [hideError, setHideError] = useState<string | null>(null);
  const [groupMemberInput, setGroupMemberInput] = useState('');
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [groupAvatarDraft, setGroupAvatarDraft] = useState('');
  const [adminDraft, setAdminDraft] = useState<string[]>([]);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [pendingJoins, setPendingJoins] = useState<string[]>([]);
  const [groupActionError, setGroupActionError] = useState<string | null>(null);
  const [groupActionMessage, setGroupActionMessage] = useState<string | null>(null);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const lastSeenSentMessageIdRef = useRef<string | null>(null);
  const lastDeliveredSentMessageIdRef = useRef<string | null>(null);
  const seenRefreshTimerRef = useRef<number | null>(null);
  const openConversationId = location.state?.openConversationId;
  const { t, i18n } = useTranslation();
  
  // AI Chat state
  const AI_CONVERSATION_ID = 'ai_assistant';
  const [aiMessages, setAiMessages] = useState<Array<{ id: string; text: string; isUser: boolean; timestamp: Date }>>([
    {
      id: '1',
      text: t('messenger.aiAssistant.welcome'),
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // ── Presence State ──────────────────────────────────────────────────────
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceStatus>>({});

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // ── Fetch presence for all conversation participants & subscribe realtime ──
  useEffect(() => {
    if (!user?.id || conversations.length === 0) return;

    // Collect all unique other-participant IDs from 1-on-1 and group conversations
    const participantIdSet = new Set<string>();
    for (const conv of conversations) {
      if (conv.participantIds) {
        for (const pid of conv.participantIds) {
          if (pid !== user.id) participantIdSet.add(pid);
        }
      }
    }
    const participantIds = Array.from(participantIdSet);
    if (participantIds.length === 0) return;

    // Fetch initial presence
    usersApi.getPresenceByUserIds(participantIds)
      .then((result) => setPresenceByUserId(result || {}))
      .catch(() => { /* keep empty state */ });
  }, [user?.id, conversations]);

  // Subscribe to realtime presence changes
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubPresence = subscribe('USER_PRESENCE_CHANGED', (event) => {
      const payload = event.data as { userId?: string; username?: string; online?: boolean; lastSeenAt?: string };
      if (!payload?.userId || payload.userId === user.id) return;

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

    return unsubPresence;
  }, [isConnected, user?.id, subscribe]);

  // If user opens `/messenger` without selecting a conversation (activeChat === null),
  // auto-open the incoming conversation so messages are visible immediately.
  useEffect(() => {
    if (!isConnected || !user?.id) return;

    const unsubscribe = subscribe('MESSAGE_RECEIVED', (event) => {
      if (event.type !== 'MESSAGE_RECEIVED' || !event.data) return;

      const message = event.data as Message;
      if (message.senderId === user.id) return;
      if (!message.conversationId) return;

      setActiveChat((prev) => {
        if (prev) return prev;
        return String(message.conversationId);
      });
    });

    return unsubscribe;
  }, [isConnected, user?.id, subscribe]);

  // Auto-open a conversation passed via navigation state (e.g., after creating new chat)
  useEffect(() => {
    if (openConversationId) {
      setActiveChat(openConversationId);
    }
  }, [openConversationId]);

  useEffect(() => {
    if (openConversationId && conversations.some((c) => c.id === openConversationId)) {
      setActiveChat(openConversationId);
    }
  }, [openConversationId, conversations]);

  const activeConversationRaw = activeChat && activeChat !== AI_CONVERSATION_ID ? conversations.find((c) => c.id === activeChat) : undefined;
  const isGroupChat = activeChat !== AI_CONVERSATION_ID && !!activeConversationRaw?.isGroup;
  const isAIChat = activeChat === AI_CONVERSATION_ID;
  const isOwner = !!(user?.id && activeConversationRaw?.ownerId === user.id);
  const isAdmin = !!(user?.id && activeConversationRaw?.adminIds?.includes(user.id));
  const canManageGroup = isOwner || isAdmin;

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat && activeChat !== AI_CONVERSATION_ID) {
      loadMessages(activeChat);
      setEditingMessageId(null);
      setReplyTo(null);
      setTypingUserIds([]);
      setIsTyping(false);
      lastSeenSentMessageIdRef.current = null;
      lastDeliveredSentMessageIdRef.current = null;
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      isTypingRef.current = false;
    }
  }, [activeChat, loadMessages]);

  // Subscribe to room channel for active conversation (ensures no missed events)
  useEffect(() => {
    if (!activeChat || activeChat === AI_CONVERSATION_ID || !isConnected) return;
    const unsubscribeRoom = subscribeConversationRoom(activeChat);
    return unsubscribeRoom;
  }, [activeChat, isConnected, subscribeConversationRoom]);

  // Sync admin/owner draft state when switching conversations
  useEffect(() => {
    if (activeConversationRaw) {
      setGroupNameDraft(activeConversationRaw.groupName || '');
      setGroupAvatarDraft(activeConversationRaw.groupAvatar || '');
      setAdminDraft((activeConversationRaw.adminIds || []).filter(id => id !== activeConversationRaw.ownerId));
      setNewOwnerId(activeConversationRaw.ownerId || '');
      setGroupActionError(null);
      setGroupActionMessage(null);
      if (user?.id && (isOwner || isAdmin) && activeConversationRaw.approvalsRequired) {
        conversationsApi
          .getPendingJoinRequests(activeConversationRaw.id, user.id)
          .then((list) => setPendingJoins(list))
          .catch((err) => {
            console.error('Failed to load pending join requests', err);
            setPendingJoins([]);
          });
      } else {
        setPendingJoins([]);
      }
    } else {
      setGroupNameDraft('');
      setGroupAvatarDraft('');
      setAdminDraft([]);
      setNewOwnerId('');
      setPendingJoins([]);
    }
  }, [activeConversationRaw, user?.id, isOwner, isAdmin, loadConversations]);

  // Get current messages for active chat (memoized to keep stable reference for effects)
  const messages = useMemo(() => {
    if (activeChat === AI_CONVERSATION_ID) {
      // Return AI messages formatted in the same shape as regular DisplayMessage
      return aiMessages.map((m) => {
        const isMe = !!m.isUser;
        const senderId = isMe ? user?.id || 'me' : 'ai';
        const sender =
          isMe
            ? user?.fullName || user?.username || 'You'
            : 'AI Assistant';

        return {
          id: m.id,
          sender,
          senderId,
          content: m.text,
          time: m.timestamp.toLocaleTimeString(getLocaleTag(), {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isMe,
          status: isMe ? ('read' as const) : null,
          reactions: [],
          attachments: [],
          isEdited: false,
          createdAt: m.timestamp.toISOString(),
          image: undefined,
          pinned: false,
          starred: false,
          replyTo: undefined,
        };
      });
    }
    return activeChat ? (apiMessages[activeChat] || []).map((m) => formatMessageForDisplay(m)) : [];
  }, [activeChat, apiMessages, formatMessageForDisplay, aiMessages, user?.id, user?.fullName, user?.username, i18n.language]);

  const formattedConversations = useMemo(() => {
    const formatTime = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days === 0) {
        if (hours === 0) return t('messenger.time.justNow');
        return t('messenger.time.hoursAgo', { count: hours });
      } else if (days === 1) return t('messenger.time.yesterday');
      else if (days < 7) return t('messenger.time.daysAgo', { count: days });
      else return date.toLocaleDateString(getLocaleTag());
    };

    // Add AI Assistant conversation at the top
    const aiConversation = {
      id: AI_CONVERSATION_ID,
      name: t('messenger.aiAssistant.name'),
      avatar: 'AI',
      color: '#3b82f6',
      online: true,
      lastMessage: aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text.substring(0, 50) : t('messenger.aiAssistant.lastMessageFallback'),
      time: aiMessages.length > 0 ? formatTime(aiMessages[aiMessages.length - 1].timestamp.toISOString()) : '',
      unread: 0,
      isGroup: false,
    };

    const regularConversations = conversations
      .filter((conv) => !conv.hiddenForCurrentUser)
      .map((conv) => {
        if (!user?.id) return null;

        const otherParticipantIndex = conv.participantIds.findIndex((id) => id !== user.id);

        const name = conv.isGroup
          ? conv.groupName || 'Group Chat'
          : conv.participantNames?.[otherParticipantIndex] || 'Unknown User';

        const initials = name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase();

        // Determine online status from presence data
        let online = false;
        if (conv.isGroup) {
          // Group: online if ANY participant (besides current user) is online
          online = conv.participantIds.some(
            (pid) => pid !== user.id && presenceByUserId[pid]?.online
          );
        } else {
          // DM: online if the other participant is online
          const otherParticipantId = conv.participantIds.find((id) => id !== user.id);
          online = !!(otherParticipantId && presenceByUserId[otherParticipantId]?.online);
        }

        return {
          id: conv.id,
          name,
          avatar: initials,
          color: hashColor(conv.id),
          online,
          lastMessage: conv.lastMessagePreview || '',
          time: formatTime(conv.lastMessageAt),
          unread: 0,
          isGroup: conv.isGroup,
        };
      })
      .filter((c): c is { id: string; name: string; avatar: string; color: string; online: boolean; lastMessage: string; time: string; unread: number; isGroup: boolean } => Boolean(c));

    return [aiConversation, ...regularConversations];
  }, [conversations, user?.id, aiMessages, t, i18n.language, presenceByUserId]);

  const activeConversation = activeChat 
    ? formattedConversations.find((c) => c.id === activeChat)
    : null;

  const getConversationDisplayName = (conv: (typeof conversations)[number]) => {
    if (conv.isGroup) {
      return conv.groupName || 'Group Chat';
    }
    if (!user?.id) {
      return 'Direct Chat';
    }
    const otherParticipantIndex = conv.participantIds.findIndex((id) => id !== user.id);
    if (otherParticipantIndex < 0) {
      return conv.participantNames?.[0] || conv.participantIds?.[0] || 'Direct Chat';
    }
    return conv.participantNames?.[otherParticipantIndex] || conv.participantIds?.[otherParticipantIndex] || 'Direct Chat';
  };

  const resetForwardDialog = () => {
    setForwardingMessage(null);
    setForwardTargetConversationId('');
    setForwardNote('');
    setIsForwarding(false);
  };

  const handleConfirmForward = async () => {
    if (!forwardingMessage || !forwardTargetConversationId) return;

    setIsForwarding(true);
    try {
      await forwardMessage(
        forwardingMessage.id,
        forwardTargetConversationId,
        forwardNote.trim() || undefined
      );

      if (forwardTargetConversationId !== activeChat) {
        setActiveChat(forwardTargetConversationId);
      }
      resetForwardDialog();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: unknown) {
      console.error('Failed to forward message:', err);
      const errorText = err instanceof Error ? err.message : 'Forward message failed';
      notify.error(errorText);
      setIsForwarding(false);
    }
  };

  const activeApiMessages = useMemo(
    () => (activeChat && activeChat !== AI_CONVERSATION_ID ? apiMessages[activeChat] || [] : []),
    [activeChat, apiMessages]
  );

  const typingNames = useMemo(() => {
    if (!activeConversationRaw || typingUserIds.length === 0) {
      return [] as string[];
    }

    return typingUserIds
      .map((uid) => {
        const idx = activeConversationRaw.participantIds?.indexOf(uid) ?? -1;
        if (idx >= 0) {
          return activeConversationRaw.participantNames?.[idx] || uid;
        }
        return uid;
      })
      .filter(Boolean)
      .slice(0, 3);
  }, [activeConversationRaw, typingUserIds]);

  const sendTypingEvent = async (typing: boolean) => {
    if (!activeChat || !user?.id || activeChat === AI_CONVERSATION_ID) {
      return;
    }
    try {
      await messagesApi.sendTypingEvent(activeChat, { userId: user.id, typing });
    } catch {
      // ignore typing failures
    }
  };

  const scheduleTypingStop = () => {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current);
    }

    typingStopTimerRef.current = window.setTimeout(() => {
      if (!isTypingRef.current) {
        return;
      }
      isTypingRef.current = false;
      sendTypingEvent(false).catch(() => undefined);
    }, 1200);
  };

  const handleMessageInputChange = (value: string) => {
    setMessage(value);

    if (!activeChat || !user?.id || activeChat === AI_CONVERSATION_ID) {
      return;
    }

    const hasContent = value.trim().length > 0;
    if (hasContent && !isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingEvent(true).catch(() => undefined);
    }

    if (!hasContent && isTypingRef.current) {
      isTypingRef.current = false;
      sendTypingEvent(false).catch(() => undefined);
    }

    if (hasContent) {
      scheduleTypingStop();
    }
  };

  useEffect(() => {
    if (!isConnected || !user?.id || !activeChat || activeChat === AI_CONVERSATION_ID) {
      return;
    }

    const unsubscribeTyping = subscribe('TYPING', (event) => {
      const payload = event.data as { conversationId?: string; userId?: string; typing?: boolean };
      if (!payload?.conversationId || !payload?.userId) return;
      if (payload.conversationId !== activeChat || payload.userId === user.id) return;

      setTypingUserIds((prev) => {
        let next: string[];
        if (payload.typing) {
          next = prev.includes(payload.userId!) ? prev : [...prev, payload.userId!];
        } else {
          next = prev.filter((id) => id !== payload.userId);
        }
        setIsTyping(next.length > 0);
        return next;
      });
    });

    const unsubscribeSeen = subscribe('MESSAGE_SEEN', (event) => {
      const payload = event.data as { conversationId?: string; userId?: string };
      if (!payload?.conversationId || payload.conversationId !== activeChat) return;
      if (payload.userId === user.id) return;

      if (seenRefreshTimerRef.current) {
        window.clearTimeout(seenRefreshTimerRef.current);
      }

      seenRefreshTimerRef.current = window.setTimeout(() => {
        loadMessages(activeChat);
        seenRefreshTimerRef.current = null;
      }, 180);
    });

    return () => {
      unsubscribeTyping();
      unsubscribeSeen();
      if (seenRefreshTimerRef.current) {
        window.clearTimeout(seenRefreshTimerRef.current);
        seenRefreshTimerRef.current = null;
      }
    };
  }, [isConnected, user?.id, activeChat, subscribe, loadMessages]);

  useEffect(() => {
    if (!activeChat || !user?.id || activeChat === AI_CONVERSATION_ID || activeApiMessages.length === 0) {
      return;
    }

    const lastIncoming = [...activeApiMessages]
      .reverse()
      .find((m) => !m.isDeleted && m.senderId !== user.id);

    if (!lastIncoming) {
      return;
    }
    if (lastSeenSentMessageIdRef.current === lastIncoming.id) {
      return;
    }

    lastSeenSentMessageIdRef.current = lastIncoming.id;
    messagesApi
      .markSeen(activeChat, { userId: user.id, lastSeenMessageId: lastIncoming.id })
      .catch(() => undefined);
  }, [activeApiMessages, activeChat, user?.id]);

  useEffect(() => {
    if (!activeChat || !user?.id || activeChat === AI_CONVERSATION_ID || activeApiMessages.length === 0) {
      return;
    }

    const lastIncoming = [...activeApiMessages]
      .reverse()
      .find((m) => !m.isDeleted && m.senderId !== user.id);

    if (!lastIncoming) {
      return;
    }
    if (lastDeliveredSentMessageIdRef.current === lastIncoming.id) {
      return;
    }

    lastDeliveredSentMessageIdRef.current = lastIncoming.id;
    messagesApi
      .markDelivered(activeChat, { userId: user.id, lastDeliveredMessageId: lastIncoming.id })
      .catch(() => undefined);
  }, [activeApiMessages, activeChat, user?.id]);

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
      }
      if (isTypingRef.current && activeChat && activeChat !== AI_CONVERSATION_ID && user?.id) {
        messagesApi.sendTypingEvent(activeChat, { userId: user.id, typing: false }).catch(() => undefined);
      }
    };
  }, [activeChat, user?.id]);
  
  // Get call info - supports both direct and group calls
  const getCallInfo = () => {
    if (!activeChat || !user?.id) return null;
    if (activeChat === AI_CONVERSATION_ID) return null;

    const conv = conversations.find(c => c.id === activeChat);
    if (!conv) return null;

    if (conv.isGroup) {
      return {
        id: activeChat,
        name: conv.groupName || 'Group Chat',
        isGroup: true,
      };
    }

    const otherParticipantId = conv.participantIds.find(id => id !== user.id);
    const otherParticipantIndex = conv.participantIds.findIndex(id => id !== user.id);
    const otherParticipantName = conv.participantNames?.[otherParticipantIndex] || 'Unknown User';

    if (!otherParticipantId) return null;

    return {
      id: otherParticipantId,
      name: otherParticipantName,
      isGroup: false,
    };
  };


  const isDailySummaryPrompt = (input: string) => {
    const normalized = input.toLowerCase().trim();
    return (
      normalized.includes('tóm tắt') ||
      normalized.includes('tom tat') ||
      normalized.includes('summary') ||
      normalized.includes('thông báo hôm nay') ||
      normalized.includes('thong bao hom nay') ||
      normalized.includes('notification')
    );
  };

  const appendAiMessage = (text: string) => {
    const aiMessage = {
      id: Date.now().toString(),
      text,
      isUser: false,
      timestamp: new Date(),
    };
    setAiMessages((prev) => [...prev, aiMessage]);
  };

  const formatDailySummaryMessage = (data: AIDailySummaryResponse) => {
    const generatedAt = data.generatedAt
      ? new Date(data.generatedAt).toLocaleTimeString(getLocaleTag(), {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return [
      t('messenger.aiAssistant.summaryHeader'),
      t('messenger.aiAssistant.summaryCounts', {
        notifications: data.notificationsCount,
        posts: data.friendsPostCount,
        messages: data.incomingMessageCount,
      }),
      '',
      data.summary,
      generatedAt ? '' : null,
      generatedAt ? t('messenger.aiAssistant.summaryGeneratedAt', { time: generatedAt }) : null,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleGenerateDailySummaryForAi = async (userPrompt?: string) => {
    if (!user?.id) return;

    if (userPrompt) {
      const userMessage = {
        id: Date.now().toString(),
        text: userPrompt,
        isUser: true,
        timestamp: new Date(),
      };
      setAiMessages((prev) => [...prev, userMessage]);
    }

    setIsAiLoading(true);
    try {
      const summary = await aiApi.dailySummary({
        userId: user.id,
        limit: 6,
      });
      appendAiMessage(formatDailySummaryMessage(summary));
    } catch (error) {
      console.error('❌ Error generating AI daily summary:', error);
      appendAiMessage(t('messenger.aiAssistant.summaryError'));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !replyTo && !filePreview && uploadedFiles.length === 0) return;
    if (!activeChat || !user?.id) return;

    if (activeChat !== AI_CONVERSATION_ID && isTypingRef.current) {
      isTypingRef.current = false;
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current);
        typingStopTimerRef.current = null;
      }
      sendTypingEvent(false).catch(() => undefined);
    }

    // Handle AI conversation separately
    if (activeChat === AI_CONVERSATION_ID) {
      const messageToSend = message.trim();
      if (!messageToSend) return;
      setMessage('');

      if (isDailySummaryPrompt(messageToSend)) {
        await handleGenerateDailySummaryForAi(messageToSend);
        return;
      }

      const userMessage = {
        id: Date.now().toString(),
        text: messageToSend,
        isUser: true,
        timestamp: new Date(),
      };
      
      setAiMessages((prev) => [...prev, userMessage]);
      setIsAiLoading(true);

      try {
        const request: AIChatRequest = {
          message: messageToSend,
          userId: user.id,
          conversationId: aiConversationId || undefined,
        };

        const response = await aiApi.chat(request);

        if (response.conversationId && !aiConversationId) {
          setAiConversationId(response.conversationId);
        }

        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false,
          timestamp: new Date(),
        };

        setAiMessages((prev) => [...prev, aiMessage]);
      } catch (error) {
        console.error('❌ Error chatting with AI:', error);
        const errorMessage = {
          id: (Date.now() + 1).toString(),
          text: t('messenger.aiAssistant.sendError'),
          isUser: false,
          timestamp: new Date(),
        };
        setAiMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsAiLoading(false);
      }
      return;
    }

    try {
      let attachments: MessageAttachment[] = [];
      
      // Upload all queued files and group into a single message
      if (uploadedFiles.length > 0) {
        setUploadingFiles(true);
        try {
          const uploadResults = await uploadApi.uploadFiles(uploadedFiles);
          attachments = uploadResults.map((result, i) => {
            const file = uploadedFiles[i];
            let type: string = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            else if (file.type.startsWith('audio/')) type = 'audio';
            return {
              type,
              url: result.url,
              fileName: result.fileName,
              fileSize: result.fileSize,
            };
          });
        } finally {
          setUploadingFiles(false);
        }
        // Clear uploaded files state
        setUploadedFiles([]);
      } else if (filePreview) {
        // Legacy single-image preview path (fallback)
        const uploadResult = await uploadApi.uploadFile(filePreview.file);
        attachments = [{
          type: 'image',
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        }];
        URL.revokeObjectURL(filePreview.preview);
        setFilePreview(null);
      }

      // Send message (can have empty content if attachments exist)
      const messageContent = message.trim();

      if (editingMessageId) {
        if (!messageContent && attachments.length === 0) {
          return;
        }
        await messagesApi.updateMessage(editingMessageId, {
          senderId: user.id,
          content: messageContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        setEditingMessageId(null);
        setMessage('');
        setReplyTo(null);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
      
      console.log('📨 Sending message:', {
        conversationId: activeChat,
        content: messageContent,
        attachmentsCount: attachments.length,
        attachments: attachments,
      });
      
      if (messageContent || attachments.length > 0) {
        await sendMessageAPI(
          activeChat,
          messageContent,
          attachments.length > 0 ? attachments : undefined,
          replyTo?.id
        );
      }
      
      setMessage('');
      setReplyTo(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      notify.error(t('messenger.sendMessageError'));
    }
  };

  const handleSendSticker = async (stickerFile: string) => {
    if (!activeChat || !user?.id) return;
    try {
      await sendMessageAPI(
        activeChat,
        '',
        [
          {
            type: 'image',
            url: `/stickers/${stickerFile}`,
            fileName: stickerFile,
          },
        ],
        replyTo?.id,
      );
      setShowStickerPanel(false);
      setShowAttachmentMenu(false);
      setReplyTo(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send sticker:', error);
      notify.error(t('messenger.sendMessageError'));
    }
  };

  const parseIdsInput = (input: string) =>
    Array.from(
      new Set(
        input
          .split(/[,;\s]+/)
          .map((i) => i.trim())
          .filter(Boolean)
      )
    );

  const handleAddMembers = async () => {
    if (!activeChat || !user?.id) return;
    const ids = parseIdsInput(groupMemberInput);
    if (ids.length === 0) {
      setGroupActionError(t('messenger.group.errorEmptyIds'));
      return;
    }

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.addGroupMembers(activeChat, {
        requesterId: user.id,
        participantIds: ids,
      });
      setGroupMemberInput('');
      setGroupActionMessage(t('messenger.group.addMembersSuccess'));
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to add members', err);
      const message = err instanceof Error ? err.message : t('messenger.group.addMembersError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeChat || !user?.id) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      // Owner leave flow: must transfer ownership first
      if (memberId === user.id && isGroupChat && isOwner) {
        if (!newOwnerId || newOwnerId === user.id) {
          setGroupActionError(t('messenger.group.ownerMustChooseNewOwner'));
          return;
        }
        await conversationsApi.leaveGroup(activeChat, {
          requesterId: user.id,
          newOwnerId,
        });
        setGroupActionMessage(t('messenger.group.leaveSuccess'));
        await loadConversations();
        setActiveChat(null);
        return;
      }

      await conversationsApi.removeGroupMember(activeChat, {
        requesterId: user.id,
        participantId: memberId,
      });
      const selfRemoved = memberId === user.id;
      setGroupActionMessage(selfRemoved ? t('messenger.group.leaveSuccess') : t('messenger.group.removeMemberSuccess'));
      await loadConversations();
      if (selfRemoved) {
        setActiveChat(null);
      }
    } catch (err: unknown) {
      console.error('Failed to remove member', err);
      const message = err instanceof Error ? err.message : t('messenger.group.removeMemberError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleSaveGroupMeta = async () => {
    if (!activeChat || !user?.id) return;
    if (!isGroupChat) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.updateConversationMeta(activeChat, {
        requesterId: user.id,
        groupName: groupNameDraft.trim(),
        groupAvatar: groupAvatarDraft.trim(),
      });
      setGroupActionMessage(t('messenger.group.updateMetaSuccess'));
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to update group meta', err);
      const message = err instanceof Error ? err.message : t('messenger.group.updateMetaError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeChat || !user?.id) return;
    if (!isGroupChat || !isOwner) {
      setGroupActionError(t('messenger.group.onlyOwnerCanDisband'));
      return;
    }
    const ok = confirm(t('messenger.group.confirmDisband'));
    if (!ok) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.deleteConversationAsUser(activeChat, user.id);
      setGroupActionMessage(t('messenger.group.disbandSuccess'));
      setActiveChat(null);
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to delete group', err);
      const message = err instanceof Error ? err.message : t('messenger.group.disbandError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleClearConversationForMe = async () => {
    if (!activeChat || !user?.id) return;
    if (activeChat === AI_CONVERSATION_ID) return;

    const ok = confirm('Ban co chac muon xoa doan chat cho rieng minh khong?');
    if (!ok) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.clearConversationForUser(activeChat, { userId: user.id });
      setActiveChat(null);
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to clear conversation for current user', err);
      const message = err instanceof Error ? err.message : 'Xoa doan chat that bai';
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleJoinRequestDecision = async (requesterId: string, approved: boolean) => {
    if (!activeChat || !user?.id) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.handleJoinRequest(activeChat, {
        requesterId,
        approverId: user.id,
        approved,
      });
      setGroupActionMessage(approved ? t('messenger.group.approveJoinSuccess') : t('messenger.group.rejectJoinSuccess'));
      // Refresh pending list and conversation
      if (activeConversationRaw?.approvalsRequired) {
        const list = await conversationsApi.getPendingJoinRequests(activeChat, user.id);
        setPendingJoins(list);
      }
      await loadConversations();
    } catch (err) {
      console.error('Failed to handle join request', err);
      const message = err instanceof Error ? err.message : t('messenger.group.handleJoinError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleAdminToggle = (memberId: string) => {
    if (!activeConversationRaw) return;
    if (memberId === activeConversationRaw.ownerId) return; // owner always has full rights
    setAdminDraft((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleUpdateRoles = async () => {
    if (!activeChat || !user?.id || !isOwner) {
      setGroupActionError(t('messenger.group.onlyOwnerCanUpdateRoles'));
      return;
    }

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      const payload = {
        requesterId: user.id,
        newOwnerId: newOwnerId || undefined,
        adminIds: adminDraft.filter((id) => id !== newOwnerId),
      };

      await conversationsApi.updateGroupRoles(activeChat, payload);
      setGroupActionMessage(t('messenger.group.updateRolesSuccess'));
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to update group roles', err);
      const message = err instanceof Error ? err.message : t('messenger.group.updateRolesError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = async (file: File) => {
    if (!activeChat) {
      notify.error(t('messenger.errors.noConversationSelected'));
      return;
    }

    try {
      setUploadingFiles(true);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        setFilePreview({ file, preview });
      }

      console.log('📤 Uploading file:', file.name, file.type, file.size);
      
      // Upload file to server
      const uploadResult = await uploadApi.uploadFile(file);
      console.log('✅ File uploaded successfully:', uploadResult);

      // Add to uploaded files list (for preview before send)
      setUploadedFiles([...uploadedFiles, file]);
      
      // Optionally focus message input for caption
      if (file.type.startsWith('image/')) {
        // For images, keep preview for user to add caption
        console.log('🖼️ Image preview ready, user can add caption before sending');
      } else {
        // For videos and files, auto-send
        const attachment: MessageAttachment = {
          type: file.type.startsWith('video/') ? 'video' : 'file',
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        };

        const messageContent = file.type.startsWith('video/') ? t('messenger.captionVideo') : `📎 ${file.name}`;
        await sendMessageAPI(activeChat, messageContent, [attachment], replyTo?.id);
        setReplyTo(null);
        
        console.log('✅ Message sent with attachment');
        
        // Clear preview
        setFilePreview(null);
        setUploadedFiles([]);

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Failed to upload file:', error);
      notify.error(t('messenger.errors.uploadFile'));
      
      // Clear preview on error
      setFilePreview(null);
      setUploadedFiles([]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleVoiceRecording = async (blob: Blob) => {
    if (!activeChat) {
      notify.error(t('messenger.errors.noConversationSelected'));
      return;
    }

    try {
      setUploadingFiles(true);
      console.log('🎤 Uploading voice message:', blob.size, 'bytes');

      // Convert blob to file
      const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
      
      // Upload voice file
      const uploadResult = await uploadApi.uploadFile(voiceFile);
      console.log('✅ Voice message uploaded:', uploadResult);

      // Create attachment object
      const attachment: MessageAttachment = {
        type: 'audio',
        url: uploadResult.url,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
      };

      // Send message with voice attachment
      await sendMessageAPI(activeChat, t('messenger.captionVoice'), [attachment], replyTo?.id);
      setReplyTo(null);
      console.log('✅ Voice message sent');

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('❌ Failed to upload voice message:', error);
      notify.error(t('messenger.errors.voiceMessage'));
    } finally {
      setUploadingFiles(false);
    }
  };
  void handleFileSelect;
  void handleVoiceRecording;

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await messagesApi.toggleReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  };

  const handleMessageAction = (action: string, messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'reply':
        setReplyTo({ id: messageId, content: message.content, sender: message.sender });
        break;
      case 'forward':
        setForwardingMessage({ id: messageId, content: message.content });
        setForwardTargetConversationId(activeChat && activeChat !== AI_CONVERSATION_ID ? activeChat : '');
        setForwardNote('');
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'pin':
        if (user?.id) {
          messagesApi.togglePin(messageId, user.id).catch((err: unknown) => {
            console.error('Failed to toggle pin:', err);
          });
        }
        break;
      case 'star':
        if (user?.id) {
          messagesApi.toggleStar(messageId, user.id).catch((err: unknown) => {
            console.error('Failed to toggle star:', err);
          });
        }
        break;
      case 'delete':
        if (!canRecallByCreatedAt(message.createdAt)) {
          notify.error('Da qua thoi gian thu hoi (2 phut)');
          break;
        }
        if (activeChat && message.isMe && confirm(t('messenger.confirmDeleteMessage'))) {
          removeMessage(activeChat, messageId).catch((err: unknown) => {
            console.error('Failed to delete message:', err);
            const messageText = err instanceof Error ? err.message : t('messenger.errors.deleteMessage');
            notify.error(messageText);
          });
        }
        break;
      case 'delete_for_me':
        if (activeChat && user?.id && confirm('Xoa tin nhan nay o phia ban?')) {
          removeMessageForMe(activeChat, messageId).catch((err: unknown) => {
            console.error('Failed to delete message for me:', err);
            notify.error('Xoa phia toi that bai');
          });
        }
        break;
      case 'edit':
        if (!message.isMe) break;
        setMessage(message.content);
        setEditingMessageId(messageId);
        setReplyTo(null);
        break;
    }
    setSelectedMessage(null);
    setMenuPosition(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadedFiles((prev) => [...prev, ...files]);
    setShowAttachmentMenu(false);
    // Reset input so the same file(s) can be re-selected
    e.target.value = '';
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      // Stop recording + speech recognition
      mediaRecorderRef.current?.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      return;
    }

    // Start recording
    try {
      voiceTranscriptRef.current = '';
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          setVoiceBlob(blob);
          setShowVoicePreview(true);
        }
        setRecordingDuration(0);
      };

      // Start SpeechRecognition simultaneously (for voice-to-text option)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          voiceTranscriptRef.current = text;
        };
        recognition.onerror = () => {};
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      notify.error(t('messenger.errors.voiceMessage'));
    }
  };

  /** Option 1: Send as voice message */
  const handleVoiceSendAudio = async () => {
    if (voiceBlob) {
      await handleVoiceRecording(voiceBlob);
    }
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  /** Option 2: Convert to text → put in input */
  const handleVoiceConvertToText = () => {
    const text = voiceTranscriptRef.current.trim();
    if (text) {
      setMessage(prev => (prev ? prev + ' ' : '') + text);
    } else {
      notify.error('Khong nhan dien duoc giong noi. Hay thu lai.');
    }
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  /** Cancel voice preview */
  const handleVoiceCancel = () => {
    setShowVoicePreview(false);
    setVoiceBlob(null);
    voiceTranscriptRef.current = '';
  };

  // Server-side search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || !activeChat || !user?.id) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await messagesApi.searchMessages(activeChat, searchQuery.trim(), user.id);
        setSearchResults(results.map(formatMessageForDisplay));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeChat, user?.id, formatMessageForDisplay]);

  const filteredMessages = searchResults !== null ? searchResults : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!selectedMessage) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside menu and button
      if (!target.closest('[data-message-menu]') && !target.closest('.group')) {
        setSelectedMessage(null);
        setMenuPosition(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedMessage]);

  return (
    <div className="h-[calc(100vh-5rem)] bg-slate-50 dark:bg-[#0c0e14] flex relative overflow-hidden transition-colors duration-300">

      {/* Left Sidebar - Conversations */}
      <div className={`border-r border-gray-200/50 dark:border-white/5 glass-surface flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
        leftSidebarCollapsed ? 'w-20' : 'w-[340px]'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!leftSidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">{t('messenger.messagesHeader')}</h1>
          )}
          <div className={`flex gap-2 ${leftSidebarCollapsed ? 'flex-col w-full' : ''}`}>
            {!leftSidebarCollapsed && (
              <>
                <button 
                  onClick={() => navigate('/messenger/new')}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={t('messenger.newMessageIconTitle')}
                >
                  <Edit className="w-5 h-5 text-gray-700" />
                </button>
                <button 
                  onClick={() => navigate('/messenger/new', { state: { createGroup: true } })}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={t('messenger.createGroupIconTitle')}
                >
                  <Users className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={async () => {
                    setShowHiddenPanel(true);
                    if (!user?.id) return;
                    setHiddenLoading(true);
                    try {
                      const data = await conversationsApi.getHiddenConversationsByUserId(user.id);
                      setHiddenConversations(Array.isArray(data) ? data : []);
                    } catch { setHiddenConversations([]); }
                    finally { setHiddenLoading(false); }
                  }}
                  className="w-10 h-10 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/60 flex items-center justify-center transition-colors relative group"
                  title="Chat ẩn"
                >
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </button>
                <Link
                  to="/messenger/settings"
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title={t('messenger.settingsIconTitle')}
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                </Link>
              </>
            )}
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title={leftSidebarCollapsed ? t('messenger.expandSidebarTitle') : t('messenger.collapseSidebarTitle')}
            >
              {leftSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-700" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Search */}
          <div className="p-4 border-b border-gray-100/50 dark:border-white/5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder={t('messenger.searchMessagesPlaceholder')}
                className="w-full h-11 pl-11 pr-4 rounded-2xl bg-gray-100/50 dark:bg-[#22263a]/50 border border-transparent focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1a1d28] text-sm transition-all dark:text-gray-200"
              />
            </div>
          </div>


        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
           {loading && formattedConversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">{t('messenger.loadingConversations')}</div>
          )}
          {(sidebarSearch
            ? formattedConversations.filter(c => c.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
            : formattedConversations
          ).map((conv) => (
            <div
              key={conv.id}
              onClick={() => {
                if (showHideInput === conv.id) return;
                setActiveChat(conv.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenu({ x: e.clientX, y: e.clientY, convId: conv.id });
              }}
              className={`cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                activeChat === conv.id 
                  ? 'bg-blue-50 dark:bg-blue-500/15' 
                  : 'hover:bg-gray-100/80 dark:hover:bg-[#1e2130]/80'
              } ${leftSidebarCollapsed ? 'p-2 mx-2 my-0.5 flex items-center justify-center' : 'px-3 py-2.5 mx-1 my-0.5 flex items-center gap-3'}`}
              title={leftSidebarCollapsed ? conv.name : ''}
            >
              {showHideInput === conv.id ? (
                <div className="w-full flex flex-col gap-2 p-1 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                      <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">Ẩn "{conv.name}"</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="password"
                      maxLength={6}
                      autoFocus
                      value={hidePin}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { setHidePin(e.target.value.replace(/\D/g, '')); setHideError(null); }}
                      placeholder="Mã PIN"
                      className="w-full h-8 px-2.5 text-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none dark:text-white transition-all font-mono tracking-widest text-center"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && hidePin.length >= 4) {
                          e.preventDefault();
                          // trigger hide
                          (async () => {
                            if (!user?.id) return;
                            setHideLoading(true);
                            setHideError(null);
                            try {
                              await conversationsApi.hideConversation(conv.id, { userId: user.id, pin: hidePin });
                              setShowHideInput(null);
                              setHidePin('');
                              loadConversations();
                              if (activeChat === conv.id) setActiveChat(null);
                              notify.success('Đã ẩn hội thoại');
                            } catch (err: any) {
                              setHideError(err?.message || 'Lỗi');
                            } finally {
                              setHideLoading(false);
                            }
                          })();
                        }
                      }}
                    />
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user?.id) return;
                        setHideLoading(true);
                        setHideError(null);
                        try {
                          await conversationsApi.hideConversation(conv.id, { userId: user.id, pin: hidePin });
                          setShowHideInput(null);
                          setHidePin('');
                          loadConversations();
                          if (activeChat === conv.id) setActiveChat(null);
                          notify.success('Đã ẩn hội thoại');
                        } catch (err: any) {
                          setHideError(err?.message || 'Lỗi');
                        } finally {
                          setHideLoading(false);
                        }
                      }}
                      disabled={hidePin.length < 4 || hideLoading}
                      className="h-8 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                    >
                      {hideLoading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Ẩn'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHideInput(null);
                        setHidePin('');
                        setHideError(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg shrink-0 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {hideError && <p className="text-[10px] text-red-500 text-center font-medium">{hideError}</p>}
                </div>
              ) : leftSidebarCollapsed ? (
                <div className="relative shrink-0">
                  {conv.id === AI_CONVERSATION_ID ? (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  ) : conv.isGroup ? (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: conv.color }}>
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ backgroundColor: conv.color }}
                      >
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {conv.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unread}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="relative shrink-0">
                    {conv.id === AI_CONVERSATION_ID ? (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    ) : conv.isGroup ? (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: conv.color }}>
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: conv.color }}
                        >
                          {conv.avatar}
                        </div>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${conv.unread > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-900'}`}>{conv.name}</p>
                      <span className={`text-xs shrink-0 ${conv.unread > 0 ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-xs truncate ${conv.unread > 0 ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Context Menu ────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-50 w-48 bg-white dark:bg-[#22263a] rounded-xl shadow-xl border border-gray-100 dark:border-white/5 py-1 animate-in fade-in zoom-in-95 duration-150"
          style={{ top: Math.min(contextMenu.y, window.innerHeight - 150), left: Math.min(contextMenu.x, window.innerWidth - 200) }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowHideInput(contextMenu.convId);
              setHidePin('');
              setHideError(null);
              if (leftSidebarCollapsed) setLeftSidebarCollapsed(false);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-3 transition-colors"
          >
            <EyeOff className="w-4 h-4 text-amber-500" />
            Ẩn hội thoại
          </button>
        </div>
      )}

      {/* ── Hidden Conversations Panel ────────────────────────────────────── */}
      {showHiddenPanel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowHiddenPanel(false); setShowHideInput(null); setHidePin(''); }} />
          {/* Panel */}
          <div className="relative w-full max-w-md mx-4 bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Chat ẩn</h2>
                  <p className="text-xs text-gray-500">{hiddenConversations.length} hội thoại đang ẩn</p>
                </div>
              </div>
              <button onClick={() => { setShowHiddenPanel(false); setShowHideInput(null); setHidePin(''); }} className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            {/* Panel Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {hiddenLoading ? (
                <div className="p-8 text-center text-gray-500">Đang tải...</div>
              ) : hiddenConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Không có hội thoại nào đang ẩn</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                  {hiddenConversations.map((conv) => {
                    const otherIdx = conv.participantIds?.findIndex((id) => id !== user?.id) ?? 0;
                    const name = conv.isGroup
                      ? conv.groupName || 'Group Chat'
                      : conv.participantNames?.[otherIdx] || 'Chat';
                    const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <div
                        key={conv.id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (conv.hiddenRequiresPin) {
                            setPendingUnlockConv(conv);
                            setUnlockPin('');
                            setUnlockError(null);
                            setShowUnlockModal(true);
                          }
                        }}
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: hashColor(conv.id) }}>
                          {conv.isGroup ? <Users className="w-5 h-5 text-white" /> : initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Cần PIN để mở
                          </p>
                        </div>
                        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                            <Unlock className="w-4 h-4 text-amber-600" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Unlock PIN Modal ──────────────────────────────────────────────── */}
      {showUnlockModal && pendingUnlockConv && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowUnlockModal(false); setPendingUnlockConv(null); setUnlockPin(''); setUnlockError(null); }} />
          <div className="relative w-full max-w-sm mx-4 bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Mở khóa hội thoại</h3>
              <p className="text-sm text-gray-500 mb-5">Nhập PIN để xem hội thoại này</p>
              <input
                type="password"
                maxLength={6}
                value={unlockPin}
                onChange={(e) => { setUnlockPin(e.target.value.replace(/\D/g, '')); setUnlockError(null); }}
                placeholder="Nhập PIN (4-6 số)"
                className="w-full h-12 px-4 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-400 dark:text-white transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && unlockPin.length >= 4) {
                    e.preventDefault();
                    (async () => {
                      if (!user?.id || !pendingUnlockConv) return;
                      setUnlockLoading(true);
                      setUnlockError(null);
                      try {
                        await conversationsApi.unhideConversation(pendingUnlockConv.id, { userId: user.id, pin: unlockPin });
                        setShowUnlockModal(false);
                        setShowHiddenPanel(false);
                        setPendingUnlockConv(null);
                        setUnlockPin('');
                        loadConversations();
                        setActiveChat(pendingUnlockConv.id);
                        notify.success('Đã mở khóa hội thoại');
                      } catch (err: any) {
                        setUnlockError(err?.message || 'PIN không đúng');
                      } finally {
                        setUnlockLoading(false);
                      }
                    })();
                  }
                }}
              />
              {unlockError && <p className="text-sm text-red-500 mt-2">{unlockError}</p>}
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setShowUnlockModal(false); setPendingUnlockConv(null); setUnlockPin(''); setUnlockError(null); }}
                  className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Hủy
                </button>
                <button
                  disabled={unlockPin.length < 4 || unlockLoading}
                  onClick={async () => {
                    if (!user?.id || !pendingUnlockConv) return;
                    setUnlockLoading(true);
                    setUnlockError(null);
                    try {
                      await conversationsApi.unhideConversation(pendingUnlockConv.id, { userId: user.id, pin: unlockPin });
                      setShowUnlockModal(false);
                      setShowHiddenPanel(false);
                      setPendingUnlockConv(null);
                      setUnlockPin('');
                      loadConversations();
                      setActiveChat(pendingUnlockConv.id);
                      notify.success('Đã mở khóa hội thoại');
                    } catch (err: any) {
                      setUnlockError(err?.message || 'PIN không đúng');
                    } finally {
                      setUnlockLoading(false);
                    }
                  }}
                  className="flex-1 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {unlockLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Unlock className="w-4 h-4" /> Mở khóa</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Chat Header */}
        {activeConversation && (
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {activeConversation.isGroup ? (
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm shrink-0" style={{ backgroundColor: activeConversation.color }}>
                  <Users className="w-6 h-6 text-white" />
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: activeConversation.color }}
                    onClick={() => navigate(`/profile/${activeConversation.id}`)}
                  >
                    {activeConversation.avatar}
                  </div>
                  {activeConversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-3 border-white"></div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-lg truncate">{activeConversation.name}</p>
                {activeConversation.online && (
                  <p className="text-sm text-green-500 font-medium">{t('messenger.activeNow')}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  showSearch ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title={t('messenger.header.searchIconTitle')}
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <button
                onClick={async () => {
                  const next = !showPinnedPanel;
                  setShowPinnedPanel(next);
                  if (next && activeChat && user?.id) {
                    setPinnedLoading(true);
                    try {
                      const data = await messagesApi.getPinnedMessages(activeChat, user.id);
                      setPinnedMessages(data.map(formatMessageForDisplay));
                    } catch { setPinnedMessages([]); }
                    finally { setPinnedLoading(false); }
                  }
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  showPinnedPanel ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Tin nhắn đã ghim"
              >
                <Pin className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  const callInfo = getCallInfo();
                  if (callInfo?.id && callInfo?.name) {
                    // For group calls: pass conversationId and isGroup=true
                    // For direct calls: pass userId and isGroup=false
                    const conversationId = callInfo.isGroup ? callInfo.id : undefined;
                    const isGroup = callInfo.isGroup || false;
                    startCall(callInfo.id, callInfo.name, 'voice', conversationId, isGroup);
                  } else {
                    notify.error(t('messenger.errors.startCall'));
                  }
                }}
                disabled={!activeChat || isAIChat}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title={
                  isAIChat
                    ? t('messenger.header.voiceCallNotAvailable')
                    : isGroupChat
                      ? t('messenger.header.groupCall')
                      : t('messenger.header.call')
                }
              >
                <Phone className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => {
                  const callInfo = getCallInfo();
                  if (callInfo?.id && callInfo?.name) {
                    // For group calls: pass conversationId and isGroup=true
                    // For direct calls: pass userId and isGroup=false
                    const conversationId = callInfo.isGroup ? callInfo.id : undefined;
                    const isGroup = callInfo.isGroup || false;
                    startCall(callInfo.id, callInfo.name, 'video', conversationId, isGroup);
                  } else {
                    notify.error(t('messenger.errors.startVideoCall'));
                  }
                }}
                disabled={!activeChat || isAIChat}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title={
                  isAIChat
                    ? t('messenger.header.videoCallNotAvailable')
                    : isGroupChat
                      ? t('messenger.header.groupVideoCall')
                      : t('messenger.header.videoCall')
                }
              >
                <Video className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  !rightSidebarCollapsed ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-600'
                }`}
                title={t('messenger.header.infoIconTitle')}
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {activeConversation && showSearch && (
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('messenger.searchInConversationPlaceholder')}
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {searchLoading && <p className="text-xs text-gray-400 mt-2 pl-1">Đang tìm...</p>}
            {searchResults !== null && !searchLoading && (
              <p className="text-xs text-gray-400 mt-2 pl-1">Tìm thấy {searchResults.length} kết quả</p>
            )}
          </div>
        )}

        {/* Pinned Messages Panel */}
        {activeConversation && showPinnedPanel && (
          <div className="border-b border-gray-100 bg-white">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-gray-800">Tin nhắn đã ghim</span>
                <span className="text-xs text-gray-400">({pinnedMessages.length})</span>
              </div>
              <button onClick={() => setShowPinnedPanel(false)} className="w-7 h-7 rounded-md hover:bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto px-4 pb-3 space-y-2">
              {pinnedLoading ? (
                <p className="text-xs text-gray-400 py-2">Đang tải...</p>
              ) : pinnedMessages.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">Chưa có tin nhắn nào được ghim</p>
              ) : (
                pinnedMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2 p-2 rounded-lg bg-blue-50/60 hover:bg-blue-50 transition-colors cursor-pointer text-left" onClick={() => {
                    const el = document.getElementById(`msg-${msg.id}`);
                    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('ring-2', 'ring-blue-400'); setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000); }
                  }}>
                    <Pin className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-700">{msg.sender}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{msg.content || '📎 Tệp đính kèm'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{msg.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        {activeConversation ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 bg-gray-50" ref={messagesEndRef}>
            {filteredMessages.map((msg) => {
              const isSelected = selectedMessage === msg.id;
              const canRecall = msg.isMe && canRecallByCreatedAt(msg.createdAt);
              return (
                <div
                id={`msg-${msg.id}`}
                key={msg.id}
                className={`group flex items-end gap-2 ${msg.isMe ? 'flex-row-reverse' : ''} transition-all duration-300`}
              >
                {!msg.isMe && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.senderId === 'ai' 
                        ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                        : 'cursor-pointer'
                    }`}
                    style={msg.senderId !== 'ai' ? { backgroundColor: hashColor(msg.senderId || 'u') } : undefined}
                    onClick={msg.senderId === 'ai' ? undefined : () => navigate(`/profile/${msg.senderId}`)}
                  >
                    {msg.senderId === 'ai' ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white font-semibold text-xs">{msg.sender.charAt(0)}</span>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] relative ${msg.isMe ? 'text-right' : ''}`}>
                  {/* Sender name — only in group chats */}
                  {isGroupChat && !msg.isMe && (
                    <p className="text-[11px] font-medium text-gray-400 mb-0.5 ml-1">{msg.sender}</p>
                  )}
                  {/* Reply To */}
                  {msg.replyTo && (
                    <div className={`mb-1 p-2 rounded-lg bg-gray-100 border-l-3 border-blue-400 text-left`}>
                      <p className="text-[11px] font-semibold text-gray-500">{msg.replyTo.sender}</p>
                      <p className="text-xs text-gray-600 line-clamp-1">{msg.replyTo.content}</p>
                    </div>
                  )}
                  
                  {/* Pinned Badge */}
                  {msg.pinned && (
                    <div className="mb-1 flex items-center gap-1 text-[11px] text-gray-400">
                      <Pin className="w-3 h-3" />
                      <span>{t('messenger.messageOptions.pinned')}</span>
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (() => {
                    const images = msg.attachments!.filter(a => a.type === 'image');
                    const others = msg.attachments!.filter(a => a.type !== 'image');
                    return (
                      <div className="mb-1 space-y-1">
                        {/* Image grid — groups multiple images together */}
                        {images.length === 1 && (
                          <div className="max-w-[240px] rounded-2xl overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                            <img
                              src={images[0].url}
                              alt={images[0].fileName || t('messenger.attachment.imageAlt')}
                              className="w-full h-auto"
                              onClick={() => window.open(images[0].url, '_blank')}
                            />
                          </div>
                        )}
                        {images.length >= 2 && (
                          <div className={`grid gap-0.5 rounded-2xl overflow-hidden max-w-[280px] ${
                            images.length === 2 ? 'grid-cols-2' :
                            images.length === 3 ? 'grid-cols-2' :
                            'grid-cols-2'
                          }`}>
                            {images.slice(0, 4).map((img, idx) => (
                              <div
                                key={idx}
                                className={`relative cursor-pointer hover:opacity-90 transition-opacity ${
                                  images.length === 3 && idx === 0 ? 'row-span-2' : ''
                                }`}
                                onClick={() => window.open(img.url, '_blank')}
                              >
                                <img
                                  src={img.url}
                                  alt={img.fileName || ''}
                                  className={`w-full object-cover ${
                                    images.length === 3 && idx === 0 ? 'h-full' : 'h-[120px]'
                                  }`}
                                />
                                {idx === 3 && images.length > 4 && (
                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white text-xl font-bold">+{images.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Non-image attachments */}
                        {others.map((attachment, idx) => (
                          <div key={`other-${idx}`}>
                            {attachment.type === 'video' && (
                              <div className="max-w-[240px] rounded-2xl overflow-hidden">
                                <video src={attachment.url} controls className="w-full h-auto" />
                              </div>
                            )}
                            {attachment.type === 'audio' && (
                              <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-2xl max-w-[240px]">
                                <Mic className="w-4 h-4 text-blue-500 shrink-0" />
                                <audio src={attachment.url} controls className="flex-1 h-8" />
                              </div>
                            )}
                            {attachment.type === 'file' && (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-2xl max-w-[240px] hover:bg-gray-100 transition-colors"
                              >
                                <FileText className="w-5 h-5 text-gray-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">
                                    {attachment.fileName || t('messenger.attachment.fileAlt')}
                                  </p>
                                  {attachment.fileSize && (
                                    <p className="text-[11px] text-gray-400">
                                      {(attachment.fileSize / 1024).toFixed(1)} KB
                                    </p>
                                  )}
                                </div>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {msg.image ? (
                    <div className="max-w-[240px] rounded-2xl mb-1 overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                      {msg.image === 'beach' && <LargeBeachPlaceholder className="w-full h-full" />}
                    </div>
                  ) : null}

                  {msg.content && (
                    <div
                      className={`relative inline-block px-3.5 py-2 ${
                        msg.isMe
                          ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                          : 'bg-gray-100 dark:bg-[#2a2d3a] text-gray-800 dark:text-gray-100 rounded-2xl rounded-bl-md'
                      }`}
                      onDoubleClick={() => handleReaction(msg.id, 'LOVE')}
                    >
                      <p className="whitespace-pre-line text-[14px] leading-relaxed">{msg.content}</p>
                    </div>
                  )}


                  {/* Message Options */}
                  <div className={`absolute ${msg.isMe ? 'left-0' : 'right-0'} top-0 ${msg.isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity z-20`}>
                    <div className="relative">
                      <button
                        ref={isSelected ? menuButtonRef : null}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isSelected) {
                            const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            if (msg.isMe) {
                              setMenuPosition({ 
                                top: buttonRect.top, 
                                right: window.innerWidth - buttonRect.left + 8 
                              });
                            } else {
                              setMenuPosition({ 
                                top: buttonRect.top, 
                                left: buttonRect.right + 8 
                              });
                            }
                            setSelectedMessage(msg.id);
                          } else {
                            setSelectedMessage(null);
                            setMenuPosition(null);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors z-20"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {isSelected && selectedMessage === msg.id && menuPosition && (
                        <div 
                          data-message-menu
                          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-[9999] min-w-[180px]"
                          style={menuPosition}
                          onClick={(e) => e.stopPropagation()}
                        >
                              <button
                                onClick={() => handleMessageAction('reply', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Reply className="w-4 h-4" />
                                <span>{t('messenger.messageOptions.reply')}</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('forward', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Forward className="w-4 h-4" />
                                <span>{t('messenger.messageOptions.forward')}</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('copy', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Copy className="w-4 h-4" />
                                <span>{t('messenger.messageOptions.copy')}</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('pin', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Pin className="w-4 h-4" />
                                <span>{msg.pinned ? t('messenger.messageOptions.unpin') : t('messenger.messageOptions.pin')}</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('star', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Star className={`w-4 h-4 ${msg.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                <span>{msg.starred ? t('messenger.messageOptions.unstar') : t('messenger.messageOptions.star')}</span>
                              </button>
                              {msg.isMe && (
                                <button
                                  onClick={() => handleMessageAction('edit', msg.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                  <Pencil className="w-4 h-4" />
                                  <span>{t('messenger.messageOptions.edit')}</span>
                                </button>
                              )}
                              <div className="border-t border-gray-100 my-1"></div>
                              {canRecall && (
                                <button
                                  onClick={() => handleMessageAction('delete', msg.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span>{t('messenger.messageOptions.delete')}</span>
                                </button>
                              )}
                              {msg.isMe && !canRecall && (
                                <div className="w-full px-4 py-2 text-left text-sm text-gray-400 flex items-center gap-3" title="Chi thu hoi trong 2 phut dau">
                                  <Trash2 className="w-4 h-4" />
                                  <span>Het han thu hoi</span>
                                </div>
                              )}
                              <button
                                onClick={() => handleMessageAction('delete_for_me', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Xoa phia toi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                  {/* Reactions */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-2 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      {msg.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleReaction(msg.id, reaction.emoji)}
                          className="px-2 py-1 rounded-full bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 text-xs"
                        >
                          <span>{reaction.emoji}</span>
                          <span className="text-gray-600 font-medium">{reaction.users.length}</span>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          const picker = document.getElementById(`reaction-picker-${msg.id}`);
                          if (picker) {
                            picker.classList.toggle('hidden');
                            picker.classList.toggle('flex');
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                      
                      {/* Quick Reactions Picker */}
                      <div
                        id={`reaction-picker-${msg.id}`}
                        className="hidden absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 gap-1 z-20"
                      >
                        {REACTIONS.map((r) => (
                          <button
                            key={r.key}
                            onClick={() => {
                              handleReaction(msg.id, r.key);
                              const picker = document.getElementById(`reaction-picker-${msg.id}`);
                              if (picker) {
                                picker.classList.add('hidden');
                                picker.classList.remove('flex');
                              }
                            }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                            title={r.label}
                          >
                            <span className="w-5 h-5 inline-block">{r.svg}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time and Status */}
                  <div className={`flex items-center gap-1 mt-0.5 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-[11px] text-gray-400">{msg.time}</p>
                    {msg.isMe && msg.status && (
                      <div className="flex items-center">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700">Chua chon doan chat</h3>
              <p className="mt-1 text-sm text-gray-500">Hay chon 1 cuoc tro chuyen ben trai de bat dau nhan tin.</p>
            </div>
          </div>
        )}

        {activeConversation && (
          <>
        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 md:px-6 py-2.5 md:py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="w-0.5 h-10 md:h-12 bg-blue-500 rounded-full shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-gray-700">{t('messenger.replyPreview', { sender: replyTo.sender })}</p>
                <p className="text-xs md:text-sm text-gray-500 line-clamp-1">{replyTo.content}</p>
              </div>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-600" />
            </button>
          </div>
        )}

        {editingMessageId && (
          <div className="px-4 md:px-6 py-2.5 md:py-3 border-t border-amber-100 bg-amber-50 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="w-0.5 h-10 md:h-12 bg-amber-500 rounded-full shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-amber-700">Dang chinh sua tin nhan</p>
                <p className="text-xs md:text-sm text-amber-600 line-clamp-1">Nhan Enter hoac nut gui de cap nhat.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingMessageId(null);
                setMessage('');
              }}
              className="w-7 h-7 md:w-8 md:h-8 rounded-full hover:bg-amber-100 flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-700" />
            </button>
          </div>
        )}

        {/* Typing Indicator */}
        {(((isTyping && !isAIChat && typingNames.length > 0) || (isAIChat && isAiLoading))) && (
          <div className="px-4 md:px-6 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-3">
              {isAIChat && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {isAIChat
                    ? t('messenger.typing.ai')
                    : typingNames.length > 1
                      ? `${typingNames[0]} +${typingNames.length - 1} dang nhap...`
                      : t('messenger.typing.user', { name: typingNames[0] ?? activeConversation?.name ?? '' })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 md:p-4 lg:p-5 border-t border-gray-100 bg-white">
          {isAIChat && (
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                onClick={() => handleGenerateDailySummaryForAi(t('messenger.aiAssistant.summaryQuickPrompt'))}
                disabled={isAiLoading}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
                title={t('messenger.aiAssistant.summarizeToday')}
              >
                <Sparkles className="w-4 h-4" />
                {t('messenger.aiAssistant.summarizeToday')}
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {uploadingFiles && (
            <div className="mb-3 flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span>{t('messenger.uploadingFiles')}</span>
            </div>
          )}

          {/* File Preview */}
          {filePreview && (
            <div className="mb-3 relative inline-block">
              <img 
                src={filePreview.preview} 
                alt="Preview" 
                className="max-w-xs max-h-40 rounded-lg shadow-sm"
              />
              <button
                onClick={() => {
                  URL.revokeObjectURL(filePreview.preview);
                  setFilePreview(null);
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Uploaded Files Preview — grouped multi-file */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2 md:mb-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-500">
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'tệp' : 'tệp'} đã chọn
                </span>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Xóa tất cả
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="relative shrink-0 group/file">
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border border-gray-200"
                        onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                      />
                    ) : (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 flex flex-col items-center justify-center border border-gray-200">
                        {file.type.startsWith('video/') ? (
                          <Video className="w-5 h-5 text-green-500" />
                        ) : file.type.startsWith('audio/') ? (
                          <Music className="w-5 h-5 text-pink-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-500" />
                        )}
                        <span className="text-[9px] text-gray-400 mt-0.5">
                          {file.name.split('.').pop()?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover/file:opacity-100"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate w-16 md:w-20 text-center">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div className="mb-2 md:mb-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.photo')}</span>
                </label>
                <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <Video className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.video')}</span>
                </label>
                <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.file')}</span>
                </label>
                <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-pink-100 flex items-center justify-center">
                    <Music className="w-5 h-5 text-pink-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.audio')}</span>
                </label>
                <button
                  onClick={() => {
                    const text = `[Location] ${t('messenger.attachments.locationShared')}`;
                    if (activeChat && user?.id) {
                      sendMessageAPI(activeChat, text, [], undefined).catch(() => {});
                      setShowAttachmentMenu(false);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-red-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.location')}</span>
                </button>
                <button
                  onClick={() => {
                    if (activeChat && user?.id) {
                      const card = `[Contact] ${user.fullName || user.username}`;
                      sendMessageAPI(activeChat, card, [], undefined).catch(() => {});
                      setShowAttachmentMenu(false);
                    }
                  }}
                  className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors"
                >
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-cyan-100 flex items-center justify-center">
                    <Contact className="w-5 h-5 text-cyan-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">{t('messenger.attachments.contact')}</span>
                </button>
                <label className="flex flex-col items-center gap-1.5 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-yellow-600" />
                  </div>
                  <span className="text-[11px] text-gray-600 font-medium">GIF</span>
                </label>
              </div>
            </div>
          )}

          {/* Sticker Panel */}
          {showStickerPanel && (
            <div className="mb-2 md:mb-3 p-3 bg-white rounded-xl border border-gray-200 shadow-lg">
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-thin">
                {STICKER_TOPIC_WITH_ALL.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setActiveStickerTopic(topic.id)}
                    className={`px-3 h-8 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      activeStickerTopic === topic.id
                        ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {topic.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {(STICKER_TOPIC_WITH_ALL.find((topic) => topic.id === activeStickerTopic)?.files ?? []).map((sticker) => (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => handleSendSticker(sticker)}
                    className="aspect-square rounded-xl bg-gray-50 border border-gray-100 p-2 hover:border-blue-300 hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-150"
                  >
                    <img
                      src={`/stickers/${sticker}`}
                      alt={sticker}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
            />
          )}

          {/* Voice Preview — after recording, choose: Send Voice or Convert to Text */}
          {showVoicePreview && (
            <div className="mb-2 p-3 bg-white rounded-xl border border-gray-200 shadow-md flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-gray-700 font-medium truncate">
                  {voiceTranscriptRef.current ? voiceTranscriptRef.current.substring(0, 50) + (voiceTranscriptRef.current.length > 50 ? '...' : '') : 'Da ghi am xong'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleVoiceSendAudio}
                  className="px-3 h-8 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors flex items-center gap-1.5"
                  title="Gui tin nhan thoai"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gui am</span>
                </button>
                <button
                  onClick={handleVoiceConvertToText}
                  className="px-3 h-8 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors flex items-center gap-1.5"
                  title="Chuyen thanh van ban"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Chuyen chu</span>
                </button>
                <button
                  onClick={handleVoiceCancel}
                  className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex items-center justify-center"
                  title="Huy"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-2.5">
            <button 
              onClick={() => {
                setShowAttachmentMenu((prev) => !prev);
                setShowStickerPanel(false);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showAttachmentMenu ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={t('messenger.attachmentsTitle')}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowStickerPanel((prev) => !prev);
                setShowAttachmentMenu(false);
                setShowEmojiPicker(false);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showStickerPanel ? 'text-pink-600 bg-pink-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Nhan dan"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              title={t('messenger.groupPanel.customizeChat')}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => handleMessageInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isRecording ? 'Dang ghi am...' : editingMessageId ? 'Chinh sua tin nhan...' : replyTo ? t('messenger.replyingTo', { sender: replyTo.sender }) : t('messenger.typeMessagePlaceholder')}
              className={`flex-1 h-10 px-4 rounded-full border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-[#1a1d28] text-sm transition-all dark:text-gray-100 dark:placeholder:text-gray-500 ${
                isRecording ? 'bg-red-50 ring-2 ring-red-200' : 'bg-gray-100/70 dark:bg-[#22263a]/60'
              }`}
            />

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-red-600 font-mono font-medium tabular-nums">
                  {Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Mic button — unified voice record */}
            <button
              onClick={handleVoiceRecord}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                isRecording ? 'text-red-600 bg-red-100 animate-pulse' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={isRecording ? 'Dung ghi am' : 'Ghi am giong noi'}
              disabled={uploadingFiles}
            >
              <Mic className="w-4 h-4" />
            </button>

            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showEmojiPicker ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={t('messenger.emojiPicker.title')}
              disabled={uploadingFiles}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={handleSendMessage}
              disabled={uploadingFiles || isAiLoading || (isAIChat && !message.trim()) || (!message.trim() && !filePreview)}
              className="w-8 h-8 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100 flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title={editingMessageId ? 'Cap nhat tin nhan' : t('messenger.send')}
            >
              {isAiLoading ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      {activeConversation && !rightSidebarCollapsed && (
        <div className="border-l border-gray-200/50 dark:border-white/5 glass-surface overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full md:w-[320px] lg:w-[360px] p-4 md:p-6 shadow-sm">

          {/* Profile Section */}
          <div className="text-center mb-6">
            <div
              className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: activeConversation.color }}
              onClick={() => navigate(`/profile/${activeConversation.id}`)}
            >
              {activeConversation.avatar}
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{activeConversation.name}</h3>
            {activeConversation.online && (
              <p className="text-sm md:text-base text-green-500 font-medium">{t('messenger.activeNow')}</p>
            )}
          </div>

          {isGroupChat && activeConversationRaw && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base md:text-lg font-bold text-gray-900">{t('messenger.groupPanel.title')}</h4>
                <span className="text-xs text-gray-500">
                  {t('messenger.groupPanel.memberCount', { count: activeConversationRaw.participantIds.length })}
                </span>
              </div>

              {groupActionMessage && (
                <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-100">
                  {groupActionMessage}
                </div>
              )}
              {groupActionError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
                  {groupActionError}
                </div>
              )}

              {canManageGroup && (
                <div className="space-y-2">
                  <h5 className="text-sm font-semibold text-gray-800">{t('messenger.groupPanel.groupInfo')}</h5>
                  <label className="text-sm font-medium text-gray-700">{t('messenger.groupPanel.groupName')}</label>
                  <input
                    type="text"
                    value={groupNameDraft}
                    onChange={(e) => setGroupNameDraft(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t('messenger.groupPanel.groupNamePlaceholder')}
                    disabled={updatingGroup}
                  />
                  <label className="text-sm font-medium text-gray-700">{t('messenger.groupPanel.groupAvatarUrl')}</label>
                  <input
                    type="text"
                    value={groupAvatarDraft}
                    onChange={(e) => setGroupAvatarDraft(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder={t('messenger.groupPanel.groupAvatarPlaceholder')}
                    disabled={updatingGroup}
                  />
                  <button
                    onClick={handleSaveGroupMeta}
                    disabled={updatingGroup}
                    className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {updatingGroup ? t('messenger.groupPanel.saving') : t('messenger.groupPanel.saveInfo')}
                  </button>
                </div>
              )}

              {canManageGroup && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      {t('messenger.groupPanel.requireApproval')}
                    </span>
                    <button
                      onClick={() => {
                        const next = !activeConversationRaw.approvalsRequired;
                        handleSaveGroupMeta();
                        conversationsApi
                          .updateConversationMeta(activeConversationRaw.id, {
                            requesterId: user!.id,
                            approvalsRequired: next,
                          })
                          .then(() => loadConversations())
                          .catch((err) => {
                            console.error('Failed to toggle approvalsRequired', err);
                          });
                      }}
                      disabled={updatingGroup}
                      className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                        activeConversationRaw.approvalsRequired ? 'bg-blue-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          activeConversationRaw.approvalsRequired ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {canManageGroup && activeConversationRaw.approvalsRequired && pendingJoins.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h5 className="text-sm font-semibold text-gray-800">
                    {t('messenger.groupPanel.joinRequestsTitle', { count: pendingJoins.length })}
                  </h5>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {pendingJoins.map((pid) => (
                      <div
                        key={pid}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-yellow-50 border border-yellow-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{pid}</p>
                          <p className="text-xs text-gray-600">{t('messenger.groupPanel.pendingApproval')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleJoinRequestDecision(pid, true)}
                            disabled={updatingGroup}
                            className="px-2 py-1 rounded-md text-xs bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60"
                          >
                            {t('messenger.groupPanel.accept')}
                          </button>
                          <button
                            onClick={() => handleJoinRequestDecision(pid, false)}
                            disabled={updatingGroup}
                            className="px-2 py-1 rounded-md text-xs bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            {t('messenger.groupPanel.reject')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canManageGroup && (
                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={groupMemberInput}
                      onChange={(e) => setGroupMemberInput(e.target.value)}
                      placeholder={t('messenger.groupPanel.addMembersPrompt')}
                      disabled={updatingGroup}
                      className="flex-1 h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                    />
                    <button
                      onClick={handleAddMembers}
                      disabled={updatingGroup}
                      className="h-11 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      <span>{updatingGroup ? t('messenger.groupPanel.processing') : t('messenger.groupPanel.addMembers')}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-800">{t('messenger.groupPanel.membersTitle')}</h5>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {activeConversationRaw.participantIds.map((pid, idx) => {
                    const name = activeConversationRaw.participantNames?.[idx] || pid;
                    const isMemberOwner = pid === activeConversationRaw.ownerId;
                    const isMemberAdmin = activeConversationRaw.adminIds?.includes(pid);
                    const isSelf = pid === user?.id;
                    
                    // Permission logic:
                    // - Owner can kick anyone (except themselves, but they can leave)
                    // - Admin can only kick regular members (not owner, not other admins)
                    // - Regular members can only leave themselves
                    const canKick = isSelf || (
                      isOwner && !isMemberOwner // Owner can kick anyone except themselves
                    ) || (
                      isAdmin && !isOwner && !isMemberOwner && !isMemberAdmin // Admin can only kick regular members
                    );

                    return (
                      <div key={pid} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMemberOwner && (
                            <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium">
                              {t('messenger.groupPanel.ownerBadge')}
                            </span>
                          )}
                          {isMemberAdmin && !isMemberOwner && (
                            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 font-medium">
                              {t('messenger.groupPanel.adminBadge')}
                            </span>
                          )}
                          {canKick && (
                            <button
                              onClick={() => handleRemoveMember(pid)}
                              disabled={updatingGroup}
                              className="px-2 py-1 rounded-md text-xs bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-60 font-medium"
                            >
                              {isSelf ? t('messenger.groupPanel.leave') : t('messenger.groupPanel.remove')}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Role Management & Delete Group - Owner Only */}
              {isOwner && (
                <>
                  <div className="space-y-3 pt-3 border-t border-gray-200">
                    <h5 className="text-sm font-semibold text-gray-800 mb-2">{t('messenger.groupPanel.roleManagement')}</h5>
                    
                    {/* Transfer Ownership */}
                <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('messenger.groupPanel.transferOwnership')}</label>
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={updatingGroup}
                  >
                    {activeConversationRaw.participantIds.map((pid, idx) => {
                      const name = activeConversationRaw.participantNames?.[idx] || pid;
                      return (
                        <option key={pid} value={pid}>
                          {name} {pid === activeConversationRaw.ownerId ? t('messenger.groupPanel.currentOwnerSuffix') : ''}
                        </option>
                      );
                    })}
                  </select>
                    </div>

                    {/* Manage Admins */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('messenger.groupPanel.assignAdmin')}</label>
                      <p className="text-xs text-gray-500 mb-2">{t('messenger.groupPanel.assignAdminHint')}</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                        {activeConversationRaw.participantIds
                          .filter(pid => pid !== activeConversationRaw.ownerId)
                          .map((pid) => {
                            const name = activeConversationRaw.participantNames?.[activeConversationRaw.participantIds.indexOf(pid)] || pid;
                            const isMemberAdmin = activeConversationRaw.adminIds?.includes(pid);
                            return (
                              <label key={pid} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                                <input
                                  type="checkbox"
                                  checked={adminDraft.includes(pid)}
                                  onChange={() => handleAdminToggle(pid)}
                                  className="rounded border-gray-300"
                                  disabled={updatingGroup}
                                />
                                <span className="text-sm text-gray-700 flex-1">{name}</span>
                                {isMemberAdmin && !adminDraft.includes(pid) && (
                                  <span className="text-xs text-gray-400">{t('messenger.groupPanel.currentlyAdmin')}</span>
                                )}
                              </label>
                            );
                          })}
                      </div>
                    </div>

                  <button
                    onClick={handleUpdateRoles}
                    disabled={updatingGroup}
                    className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    {updatingGroup ? t('messenger.groupPanel.saving') : t('messenger.groupPanel.saveRoles')}
                  </button>
                </div>

                  <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={handleDeleteGroup}
                    disabled={updatingGroup}
                    className="w-full h-11 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {updatingGroup ? t('messenger.groupPanel.processing') : t('messenger.groupPanel.disbandGroup')}
                  </button>
                </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 md:gap-4 mb-6">
            <button className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <User className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">{t('messenger.groupPanel.sidebarProfile')}</span>
            </button>
            <button className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Bell className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">{t('messenger.groupPanel.sidebarMute')}</span>
            </button>
            {!isAIChat && (
              <button onClick={handleClearConversationForMe} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-6 h-6 md:w-7 md:h-7 text-red-500" />
                </div>
                <span className="text-xs md:text-sm text-red-600 font-medium">Xoa doan chat</span>
              </button>
            )}
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Customize Chat */}
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3">
            <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">{t('messenger.groupPanel.customizeChat')}</h4>
            <div className="space-y-1.5">
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Palette className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>{t('messenger.groupPanel.changeTheme')}</span>
              </button>
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>{t('messenger.groupPanel.changeEmoji')}</span>
              </button>
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Pencil className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>{t('messenger.groupPanel.changeName')}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 md:my-6"></div>

          {/* Media */}
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base md:text-lg font-bold text-gray-900">{t('messenger.groupPanel.photosVideos')}</h4>
              <button className="text-xs md:text-sm text-blue-600 hover:underline font-medium">{t('messenger.groupPanel.seeAll')}</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 md:gap-2">
              <div className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <LargeBeachPlaceholder className="w-full h-full" />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <LargeSunPlaceholder className="w-full h-full" />
              </div>
              <div className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                <LargePartyPlaceholder className="w-full h-full" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 md:my-6"></div>

          {/* Privacy & Support */}
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">{t('messenger.groupPanel.privacySupport')}</h4>
            <div className="space-y-1.5">
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>{t('messenger.groupPanel.disappearingMessages')}</span>
              </button>
              <button 
                onClick={() => {
                  setShowSearch(true);
                  setRightSidebarCollapsed(true);
                }}
                className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3"
              >
                <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>{t('messenger.groupPanel.searchInConversation')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {forwardingMessage && (
        <div
          className="absolute inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={resetForwardDialog}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white border border-gray-200 shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Forward message</h3>
              <p className="text-sm text-gray-600 mt-1">Select a conversation and optionally add a note.</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 text-sm text-gray-700 max-h-24 overflow-auto whitespace-pre-wrap">
              {forwardingMessage.content || '[No text content]'}
            </div>

            <select
              value={forwardTargetConversationId}
              onChange={(e) => setForwardTargetConversationId(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Select conversation</option>
              {conversations.map((conv) => (
                <option key={conv.id} value={conv.id}>
                  {getConversationDisplayName(conv)}
                </option>
              ))}
            </select>

            <textarea
              value={forwardNote}
              onChange={(e) => setForwardNote(e.target.value)}
              placeholder="Add an optional note"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={resetForwardDialog}
                disabled={isForwarding}
                className="h-10 px-4 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmForward}
                disabled={!forwardTargetConversationId || isForwarding}
                className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {isForwarding ? 'Forwarding...' : 'Forward'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
