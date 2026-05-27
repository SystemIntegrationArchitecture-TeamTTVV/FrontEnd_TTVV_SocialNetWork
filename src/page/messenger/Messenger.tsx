import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import { useSocket } from '../../contexts/SocketContext';
import { conversationsApi, type Conversation } from '../../apis/conversations';
import { uploadApi } from '../../apis/upload';
import { messagesApi, type Message, type MessageAttachment } from '../../apis/messages';
import { aiApi, type AIChatRequest } from '../../apis/ai';
import { usersApi, type PresenceStatus } from '../../apis/users';
import { friendsApi, type FriendDTO } from '../../apis/friendRequests';
import { getLocaleTag } from '../../i18n';
import { canRecallByCreatedAt } from '../../constants/chatPolicy';
import { notify } from '../../services/notify';
import ForwardModal from './components/ForwardModal';
import ViewProfileModal from './components/ViewProfileModal';
import PinnedMessagesPanel from './components/PinnedMessagesPanel';
import PinnedBar from './components/PinnedBar';
import AppointmentBar from './components/AppointmentBar';
import ChatHeader from './components/ChatHeader';
import ChatInfoSidebar from './components/ChatInfoSidebar';
import TypingIndicator from './shared/TypingIndicator';
import ChatSidebar from './components/ChatSidebar';
import HiddenChatsPanel from './components/HiddenChatsPanel';
import MessageInput from './components/MessageInput';
import ChatMessages from './components/ChatMessages';
import { useVoiceRecording } from './hooks/useVoiceRecording';
import { useAIChat } from './hooks/useAIChat';
import { useGroupActions } from './hooks/useGroupActions';
import { useGroupPolls } from './hooks/useGroupPolls';
import { useGroupAppointments } from './hooks/useGroupAppointments';
import CreatePollModal from './components/CreatePollModal';
import CreateAppointmentModal from './components/CreateAppointmentModal';

interface MessengerLocationState {
  openConversationId?: string;
}

interface InvitePreviewState {
  token: string;
  conversation: Conversation;
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
const LAST_ACTIVE_CHAT_KEY = 'messenger:lastActiveChat';

/** Deterministic color from string ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â same input always gives same color */
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
  const location = useLocation() as Location & { state?: MessengerLocationState };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCall } = useCall();
  const { isConnected, subscribe, subscribeConversationRoom } = useSocket();
  const {
    conversations,
    messages: apiMessages,
    loading: messagesLoading,
    conversationsLoading,
    loadConversations,
    loadMessages,
    sendMessage: sendMessageAPI,
    removeMessage,
    removeMessageForMe,
    forwardMessage,
    toggleReaction,
    formatMessageForDisplay,
    loadMoreMessages,
    loadingMore,
    hasMoreMap,
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
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<{ id: string; content: string } | null>(null);
  const [forwardTargetConversationId, setForwardTargetConversationId] = useState<string>('');
  const [forwardNote, setForwardNote] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [viewProfileTarget, setViewProfileTarget] = useState<{ userId: string, userName: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSenderId, setSearchSenderId] = useState('');
  const [searchResults, setSearchResults] = useState<ReturnType<typeof formatMessageForDisplay>[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinnedPanel, setShowPinnedPanel] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ReturnType<typeof formatMessageForDisplay>[]>([]);
  const [pinnedLoading, setPinnedLoading] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [filePreview, setFilePreview] = useState<{ file: File; preview: string } | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Hidden Conversations State ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [hiddenConversations, setHiddenConversations] = useState<Conversation[]>([]);
  const [hiddenLoading, setHiddenLoading] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingUnlockConv, setPendingUnlockConv] = useState<Conversation | null>(null);
  const [unlockPin, setUnlockPin] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [friendList, setFriendList] = useState<FriendDTO[]>([]);
  const [showHideInput, setShowHideInput] = useState<string | null>(null); // conversationId being hidden
  const [hidePin, setHidePin] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; convId: string } | null>(null);
  const [hideLoading, setHideLoading] = useState(false);
  const [hideError, setHideError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [unreadByConversationId, setUnreadByConversationId] = useState<Record<string, number>>({});
  const [invitePreview, setInvitePreview] = useState<InvitePreviewState | null>(null);
  const [invitePreviewLoading, setInvitePreviewLoading] = useState(false);
  const [inviteJoinLoading, setInviteJoinLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);
  const prevScrollHeightRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingStopTimerRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);
  const lastSeenSentMessageIdRef = useRef<string | null>(null);
  const lastDeliveredSentMessageIdRef = useRef<string | null>(null);
  const seenRefreshTimerRef = useRef<number | null>(null);
  const realtimeReloadTimerRef = useRef<number | null>(null);
  const processedInviteTokenRef = useRef<string | null>(null);
  // Load friend list once on mount
  useEffect(() => {
    if (!user?.id) return;
    friendsApi.getFriendsByUserId(user.id)
      .then(setFriendList)
      .catch(() => undefined);
  }, [user?.id]);

  const openConversationId = location.state?.openConversationId;

  const clearInviteTokenParam = () => {
    const cleaned = new URLSearchParams(location.search);
    cleaned.delete('inviteToken');
    const nextSearch = cleaned.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    );
  };

  const handleJoinFromInvitePreview = async () => {
    if (!invitePreview || !user?.id) return;

    setInviteJoinLoading(true);
    try {
      const joinedConversation = await conversationsApi.joinByInviteLink(invitePreview.token, user.id);
      const isMember = Array.isArray(joinedConversation.participantIds) && joinedConversation.participantIds.includes(user.id);
      const isPending = Array.isArray(joinedConversation.pendingJoinIds) && joinedConversation.pendingJoinIds.includes(user.id);

      await loadConversations();

      if (isMember) {
        handleSelectChat(joinedConversation.id);
        notify.success('Tham gia nhom thanh cong');
      } else if (isPending) {
        notify.info('Yeu cau tham gia da duoc gui. Vui long cho phe duyet');
      } else {
        notify.info('Da xu ly link tham gia nhom');
      }

      setInvitePreview(null);
      clearInviteTokenParam();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Khong the tham gia nhom bang link';
      notify.error(message);
    } finally {
      setInviteJoinLoading(false);
    }
  };

  const handleDeclineInvitePreview = () => {
    setInvitePreview(null);
    clearInviteTokenParam();
  };

  useEffect(() => {
    if (!user?.id) return;

    const params = new URLSearchParams(location.search);
    const inviteToken = params.get('inviteToken');
    const queryConversationId = params.get('conversation');

    if (queryConversationId) {
      handleSelectChat(queryConversationId);
    }

    if (!inviteToken) {
      setInvitePreview(null);
      return;
    }

    if (processedInviteTokenRef.current === inviteToken && invitePreview?.token === inviteToken) return;
    processedInviteTokenRef.current = inviteToken;

    let cancelled = false;

    const handlePreviewByInvite = async () => {
      setInvitePreviewLoading(true);
      try {
        const conversation = await conversationsApi.previewJoinByInviteLink(inviteToken, user.id);
        if (cancelled) return;

        const isMember = Array.isArray(conversation.participantIds) && conversation.participantIds.includes(user.id);

        if (isMember) {
          handleSelectChat(conversation.id);
          setInvitePreview(null);
          clearInviteTokenParam();
        } else {
          setInvitePreview({ token: inviteToken, conversation });
        }
      } catch (error: unknown) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Khong the tham gia nhom bang link';
        notify.error(message);
        setInvitePreview(null);
        clearInviteTokenParam();
      } finally {
        if (!cancelled) {
          setInvitePreviewLoading(false);
        }
      }
    };

    void handlePreviewByInvite();

    return () => {
      cancelled = true;
    };
  }, [location.search, location.pathname, navigate, user?.id, invitePreview?.token]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeChat) {
      window.sessionStorage.setItem(LAST_ACTIVE_CHAT_KEY, activeChat);
    } else {
      window.sessionStorage.removeItem(LAST_ACTIVE_CHAT_KEY);
    }
  }, [activeChat]);

  const handleSelectChat = (chatId: string) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(LAST_ACTIVE_CHAT_KEY, chatId);
    }
    setUnreadByConversationId((prev) => {
      if (!prev[chatId]) return prev;
      const next = { ...prev };
      delete next[chatId];
      return next;
    });
    setActiveChat(chatId);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (conversations.length === 0) return;
    if (activeChat === AI_CONVERSATION_ID) return;
    if (activeChat && conversations.some((c) => c.id === activeChat)) return;

    // On mobile (< md breakpoint), don't auto-select a conversation
    // so the user sees the conversation list first
    const isMobile = window.innerWidth < 768;
    if (isMobile) return;

    const persisted = window.sessionStorage.getItem(LAST_ACTIVE_CHAT_KEY);
    if (persisted && conversations.some((c) => c.id === persisted)) {
      setActiveChat(persisted);
      return;
    }

    const firstRealConversation = conversations[0]?.id;
    if (firstRealConversation) {
      setActiveChat(firstRealConversation);
    }
  }, [activeChat, conversations]);

  const { t, i18n } = useTranslation();


  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Presence State ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
  const [presenceByUserId, setPresenceByUserId] = useState<Record<string, PresenceStatus>>({});
  const [avatarsByUserId, setAvatarsByUserId] = useState<Record<string, string>>({});

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

  // ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ Fetch presence for all conversation participants & subscribe realtime ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬
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

    // Fetch avatars for participants (throttled — max 3 concurrent to avoid DB pool exhaustion)
    const uncachedIds = participantIds.filter((id) => !avatarsByUserId[id]);
    if (uncachedIds.length > 0) {
      const BATCH_SIZE = 3;
      const fetchBatch = async () => {
        const allAvatars: Record<string, string> = {};
        for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
          const batch = uncachedIds.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(batch.map((id) => usersApi.getUserById(id)));
          results.forEach((r) => {
            if (r.status === 'fulfilled' && r.value?.id && r.value.avatar) {
              allAvatars[r.value.id] = r.value.avatar;
            }
          });
        }
        if (Object.keys(allAvatars).length > 0) {
          setAvatarsByUserId((prev) => ({ ...prev, ...allAvatars }));
        }
      };
      fetchBatch().catch(() => { /* silently fail */ });
    }
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

      const raw = event.data as any;
      const message = raw as Message;
      const incomingConversationId = String(
        raw?.conversationId
        || raw?.message?.conversationId
        || (typeof raw?.id === 'string' && Array.isArray(raw?.participantIds) ? raw.id : '')
      );
      if (!incomingConversationId) return;
      if (message?.senderId && message.senderId === user.id) return;

      // Fallback hard-sync: if currently viewing this conversation, force refresh latest page.
      // This guarantees realtime rendering even when socket payload shape differs between channels.
      if (activeChat === incomingConversationId) {
        if (realtimeReloadTimerRef.current) {
          window.clearTimeout(realtimeReloadTimerRef.current);
        }
        realtimeReloadTimerRef.current = window.setTimeout(() => {
          loadMessages(incomingConversationId);
          realtimeReloadTimerRef.current = null;
        }, 120);
      }

      if (activeChat && activeChat !== incomingConversationId) {
        setUnreadByConversationId((prev) => ({
          ...prev,
          [incomingConversationId]: (prev[incomingConversationId] || 0) + 1,
        }));
        // Show toast notification for messages from other conversations
        const senderName = message?.senderName || message?.senderId || '';
        const content = message?.content || '';
        const preview = content.length > 50 ? content.slice(0, 50) + '…' : content;
        if (senderName) {
          notify.info(`${senderName}: ${preview || 'Đã gửi tin nhắn'}`);
        }
      }

      // Show notification when user has no active chat
      if (!activeChat) {
        const senderName = message?.senderName || message?.senderId || '';
        const content = message?.content || '';
        const preview = content.length > 50 ? content.slice(0, 50) + '…' : content;
        if (senderName) {
          notify.info(`${senderName}: ${preview || 'Đã gửi tin nhắn'}`);
        }
      }

      setActiveChat((prev) => {
        if (prev) return prev;
        setUnreadByConversationId((counts) => {
          if (!counts[incomingConversationId]) return counts;
          const next = { ...counts };
          delete next[incomingConversationId];
          return next;
        });
        return incomingConversationId;
      });
    });

    return () => {
      unsubscribe();
      if (realtimeReloadTimerRef.current) {
        window.clearTimeout(realtimeReloadTimerRef.current);
        realtimeReloadTimerRef.current = null;
      }
    };
  }, [isConnected, user?.id, subscribe, activeChat, loadMessages]);

  // Auto-open a conversation passed via navigation state (e.g., after creating new chat)
  useEffect(() => {
    if (openConversationId) {
      setUnreadByConversationId((prev) => {
        if (!prev[openConversationId]) return prev;
        const next = { ...prev };
        delete next[openConversationId];
        return next;
      });
      setActiveChat(openConversationId);
    }
  }, [openConversationId]);

  useEffect(() => {
    if (openConversationId && conversations.some((c) => c.id === openConversationId)) {
      setUnreadByConversationId((prev) => {
        if (!prev[openConversationId]) return prev;
        const next = { ...prev };
        delete next[openConversationId];
        return next;
      });
      setActiveChat(openConversationId);
    }
  }, [openConversationId, conversations]);

  useEffect(() => {
    if (!activeChat) return;
    setUnreadByConversationId((prev) => {
      if (!prev[activeChat]) return prev;
      const next = { ...prev };
      delete next[activeChat];
      return next;
    });
  }, [activeChat]);

  const {
    AI_CONVERSATION_ID,
    aiMessages,
    setAiMessages,
    aiConversationId,
    setAiConversationId,
    isAiLoading,
    setIsAiLoading,
    isDailySummaryPrompt,
    handleGenerateDailySummaryForAi,
  } = useAIChat({
    userId: user?.id,
    getLocaleTag,
  });

  const activeConversationRaw = activeChat && activeChat !== AI_CONVERSATION_ID ? conversations.find((c) => c.id === activeChat) : undefined;
  const activeOtherParticipantId = useMemo(
    () => activeConversationRaw?.participantIds?.find((id) => id !== user?.id),
    [activeConversationRaw?.participantIds, user?.id]
  );
  const blockedByOtherAll = !!(activeOtherParticipantId && activeConversationRaw?.blockedByUserIds?.includes(activeOtherParticipantId));
  const blockedByOtherMessage = !!(activeOtherParticipantId && activeConversationRaw?.messageBlockedByUserIds?.includes(activeOtherParticipantId));
  const blockedByOtherCall = !!(activeOtherParticipantId && activeConversationRaw?.callBlockedByUserIds?.includes(activeOtherParticipantId));
  const isGroupChat = activeChat !== AI_CONVERSATION_ID && !!activeConversationRaw?.isGroup;
  const isAIChat = activeChat === AI_CONVERSATION_ID;
  const isOwner = !!(user?.id && activeConversationRaw?.ownerId === user.id);
  const isAdmin = !!(user?.id && activeConversationRaw?.adminIds?.includes(user.id));
  const canManageGroup = isOwner || isAdmin;

  const {
    isRecording,
    recordingDuration,
    showVoicePreview,
    voiceTranscriptRef,
    handleVoiceRecord,
    handleVoiceSendAudio,
    handleVoiceConvertToText,
    handleVoiceCancel,
  } = useVoiceRecording({
    onSendVoice: async (blob: Blob) => {
      await handleVoiceRecording(blob);
    },
    setMessage,
  });


  const {
    groupNameDraft,
    setGroupNameDraft,
    groupAvatarDraft,
    setGroupAvatarDraft,
    pendingJoins,
    setPendingJoins,
    groupActionError,
    setGroupActionError,
    groupActionMessage,
    setGroupActionMessage,
    updatingGroup,
    handleInviteFriends,
    handleRemoveMember,
    handleSaveGroupMeta,
    handleClearConversationForMe,
    handleClearGroupHistory,
    handleJoinRequestDecision,
    handleToggleRequireApproval,
    handleToggleOnlyAdminsCanSend,
    handleToggleAiAssistant,
    handleTransferOwnership,
    handleToggleAdminDirect,
    handleDisbandGroup,
  } = useGroupActions({
    activeChat,
    userId: user?.id,
    isGroupChat,
    isOwner,
    loadConversations,
    setActiveChat,
  });

  const {
    isCreatePollOpen,
    setIsCreatePollOpen,
    handleCreatePoll,
    handleVotePoll,
    creatingPoll,
    votingPollMessageId,
  } = useGroupPolls({
    conversationId: activeChat || '',
    userId: user?.id || '',
    userName: user?.fullName || '',
  });

  const {
    isCreateAppointmentOpen,
    setIsCreateAppointmentOpen,
    creatingAppointment,
    joiningAppointmentId,
    handleCreateAppointment,
    handleJoinAppointment,
  } = useGroupAppointments({
    conversationId: activeChat || '',
    userId: user?.id || '',
    userName: user?.fullName || '',
    loadMessages,
  });

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat && activeChat !== AI_CONVERSATION_ID) {
      loadMessages(activeChat);
      isInitialLoadRef.current = true;
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
      if (Number.isNaN(date.getTime())) {
        return '';
      }
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      if (Number.isNaN(diff) || diff < 0) {
        return t('messenger.time.justNow');
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days === 0) {
        if (hours === 0) return t('messenger.time.justNow');
        return t('messenger.time.hoursAgo', { count: hours });
      } else if (days === 1) return t('messenger.time.yesterday');
      else if (days < 7) return t('messenger.time.daysAgo', { count: days });
      else return date.toLocaleDateString(getLocaleTag());
    };

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
        if (!conv.participantIds || !Array.isArray(conv.participantIds)) return null;

        const otherParticipantIndex = conv.participantIds.findIndex((id) => id !== user.id);
        const otherParticipantId = conv.participantIds[otherParticipantIndex];

        // For direct chats: prefer nickname from nicknames map, then fallback to participantNames
        const name = conv.isGroup
          ? conv.groupName || 'Group Chat'
          : (otherParticipantId && conv.nicknames?.[otherParticipantId])
          || conv.participantNames?.[otherParticipantIndex]
          || 'Unknown User';

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

        const lastActivity = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;

        return {
          id: conv.id,
          name,
          avatar: initials,
          imageUrl: conv.isGroup ? conv.groupAvatar : (otherParticipantId ? (conv.participantAvatars?.[otherParticipantIndex] || avatarsByUserId[otherParticipantId]) : undefined),
          color: hashColor(conv.id),
          online,
          lastMessage: (() => {
            if (!conv.lastMessagePreview) return '';
            if (conv.lastMessageType === 'SYSTEM') return conv.lastMessagePreview;
            const senderPrefix = conv.lastMessageSenderId === user?.id ? t('messenger.you', 'Bạn') : conv.lastMessageSenderName;
            return senderPrefix ? `${senderPrefix}: ${conv.lastMessagePreview}` : conv.lastMessagePreview;
          })(),
          time: formatTime(conv.lastMessageAt),
          unread: unreadByConversationId[conv.id] || 0,
          isGroup: conv.isGroup,
          sortTime: Number.isNaN(lastActivity) ? 0 : lastActivity,
          pinned: conv.pinnedByUserIds?.includes(user.id) || false,
          otherParticipantId: conv.isGroup ? undefined : otherParticipantId,
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c))
      .sort((a, b) => {
        // Pinned conversations first
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then by time
        return b.sortTime - a.sortTime;
      });

    return [{ ...aiConversation, sortTime: Infinity, pinned: false }, ...regularConversations]
      .sort((a, b) => {
        // AI conversation always first (sortTime Infinity handles this)
        if (a.sortTime === Infinity && b.sortTime !== Infinity) return -1;
        if (a.sortTime !== Infinity && b.sortTime === Infinity) return 1;
        // Pinned conversations next
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        // Then by time
        return b.sortTime - a.sortTime;
      })
      .map(({ sortTime: _s, ...item }) => item);
  }, [conversations, user?.id, aiMessages, t, i18n.language, presenceByUserId, unreadByConversationId, avatarsByUserId]);

  const activeConversation = activeChat
    ? formattedConversations.find((c) => c.id === activeChat) || null
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
        console.error('[Messenger] Error chatting with AI:', error);
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

      console.log('[Messenger] Sending message:', {
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
      // Removed generic notify.error here because http.ts global interceptor already shows the specific backend error toast
    }
  };

  const handleSendSticker = async (stickerFile: string) => {
    if (!activeChat || !user?.id) return;
    try {
      // Detect GIPHY sticker (full URL prefixed with __giphy__)
      const isGiphy = stickerFile.startsWith('__giphy__');
      const stickerUrl = isGiphy ? stickerFile.replace('__giphy__', '') : `/stickers/${stickerFile}`;
      const fileName = isGiphy ? `giphy-sticker-${Date.now()}.gif` : stickerFile;

      await sendMessageAPI(
        activeChat,
        '',
        [
          {
            type: 'sticker',
            url: stickerUrl,
            fileName,
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
      // Removed generic notify.error because http.ts global interceptor already shows the specific backend error toast
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

      console.log('[Messenger] Uploading file:', file.name, file.type, file.size);

      // Upload file to server
      const uploadResult = await uploadApi.uploadFile(file);
      console.log('[Messenger] File uploaded successfully:', uploadResult);

      // Add to uploaded files list (for preview before send)
      setUploadedFiles([...uploadedFiles, file]);

      // Optionally focus message input for caption
      if (file.type.startsWith('image/')) {
        // For images, keep preview for user to add caption
        console.log('[Messenger] Image preview ready, user can add caption before sending');
      } else {
        // For videos and files, auto-send
        const attachment: MessageAttachment = {
          type: file.type.startsWith('video/') ? 'video' : 'file',
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        };

        const messageContent = file.type.startsWith('video/') ? t('messenger.captionVideo') : `File: ${file.name}`;
        await sendMessageAPI(activeChat, messageContent, [attachment], replyTo?.id);
        setReplyTo(null);

        console.log('[Messenger] Message sent with attachment');

        // Clear preview
        setFilePreview(null);
        setUploadedFiles([]);

        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('[Messenger] Failed to upload file:', error);
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
      console.log('[Messenger] Uploading voice message:', blob.size, 'bytes');

      // Convert blob to file
      const voiceFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

      // Upload voice file
      const uploadResult = await uploadApi.uploadFile(voiceFile);
      console.log('[Messenger] Voice message uploaded:', uploadResult);

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
      console.log('[Messenger] Voice message sent');

      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('[Messenger] Failed to upload voice message:', error);
      notify.error(t('messenger.errors.voiceMessage'));
    } finally {
      setUploadingFiles(false);
    }
  };
  void handleFileSelect;
  void handleVoiceRecording;

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeChat || activeChat === AI_CONVERSATION_ID) return;
    try {
      await toggleReaction(activeChat, messageId, emoji);
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
          messagesApi.togglePin(messageId, user.id).then(() => {
            // Reload pinned list after pin/unpin
            if (activeChat) {
              messagesApi.getPinnedMessages(activeChat, user.id).then((data) => {
                setPinnedMessages(data.map(formatMessageForDisplay));
              }).catch(() => { });
            }
          }).catch((err: unknown) => {
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


  // Server-side search with debounce
  useEffect(() => {
    if (!searchQuery.trim() || !activeChat || !user?.id) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await messagesApi.searchMessages(
          activeChat,
          searchQuery.trim(),
          user.id,
          searchSenderId || undefined
        );
        setSearchResults(results.map(formatMessageForDisplay));
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchSenderId, activeChat, user?.id, formatMessageForDisplay]);

  // ── Auto-fetch pinned messages when switching chat ──
  useEffect(() => {
    if (!activeChat || !user?.id) {
      setPinnedMessages([]);
      return;
    }
    // Fetch pinned
    messagesApi.getPinnedMessages(activeChat, user.id)
      .then((data) => setPinnedMessages(data.map(formatMessageForDisplay)))
      .catch(() => setPinnedMessages([]));
  }, [activeChat, user?.id, formatMessageForDisplay]);

  // ── Socket: realtime pin updates ──
  useEffect(() => {
    if (!activeChat || !user?.id) return;
    const unsub = subscribe('MESSAGE_PINNED', (event: any) => {
      const data = event?.data;
      if (data?.conversationId === activeChat) {
        // Reload full pinned list to stay in sync
        messagesApi.getPinnedMessages(activeChat, user.id)
          .then((pins) => setPinnedMessages(pins.map(formatMessageForDisplay)))
          .catch(() => { });
      }
    });
    return unsub;
  }, [activeChat, user?.id, subscribe, formatMessageForDisplay]);

  // ── Unpin from PinnedBar handler ──
  const handleUnpinFromBar = async (messageId: string) => {
    if (!user?.id || !activeChat) return;
    try {
      await messagesApi.togglePin(messageId, user.id);
      const data = await messagesApi.getPinnedMessages(activeChat, user.id);
      setPinnedMessages(data.map(formatMessageForDisplay));
    } catch {
      notify.error('Không thể bỏ ghim');
    }
  };

  // ── Scroll to pinned message ──
  const handleScrollToPinned = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 2000);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (container.scrollTop === 0 && !loadingMore && activeChat && hasMoreMap[activeChat]) {
      prevScrollHeightRef.current = container.scrollHeight;
      loadMoreMessages(activeChat);
    }
  };

  const filteredMessages = searchResults !== null ? searchResults : messages;

  // Smart auto-scroll: only scroll when user is near the bottom or sent a message.
  // If user is scrolled up reading old messages, don't interrupt them.
  useEffect(() => {
    const container = scrollContainerRef.current;
    const prevCount = prevMessageCountRef.current;
    const currentCount = messages.length;
    prevMessageCountRef.current = currentCount;

    // No new messages, skip
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

    // Check if the newest message is from the current user (they just sent it)
    const newestMessage = messages[messages.length - 1];
    const isSentByMe = newestMessage?.isMe;

    // Check if user is near the bottom (within 200px)
    const isNearBottom = container
      ? container.scrollHeight - container.scrollTop - container.clientHeight < 200
      : true;

    if (isSentByMe || isNearBottom) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
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

  // On mobile (< md), only one panel is visible at a time:
  // - If right sidebar is open → show only right sidebar
  // - If a chat is active → show only chat area
  // - Otherwise → show conversation list
  const mobileShowRightPanel = !rightSidebarCollapsed && !!activeConversation;
  const mobileShowChat = !!activeChat && !mobileShowRightPanel;
  const mobileShowSidebar = !activeChat || (!mobileShowChat && !mobileShowRightPanel);

  return (
    <div className="h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-3.5rem)] bg-slate-50 dark:bg-[#0c0e14] flex relative overflow-hidden transition-colors duration-300">

      {/* Left Sidebar - Conversations */}
      {/* Left Sidebar - hidden on mobile when chat or right panel is open */}
      <div className={`${mobileShowSidebar ? 'flex' : 'hidden'} md:flex flex-col shrink-0 h-full`}>
        <ChatSidebar
          formattedConversations={formattedConversations}
          activeChat={activeChat}
          onSelectChat={handleSelectChat}
          collapsed={leftSidebarCollapsed}
          onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          sidebarSearch={sidebarSearch}
          onSearchChange={setSidebarSearch}
          loading={conversationsLoading}
          aiConversationId={AI_CONVERSATION_ID}
          contextMenu={contextMenu}
          onContextMenu={(e, convId) => {
            setContextMenu({ x: e.clientX, y: e.clientY, convId });
          }}
          showHideInput={showHideInput}
          hidePin={hidePin}
          onHidePinChange={setHidePin}
          hideLoading={hideLoading}
          hideError={hideError}
          onHideError={setHideError}
          onHideConversation={async (convId, pin) => {
            if (!user?.id) return;
            setHideLoading(true);
            setHideError(null);
            try {
              await conversationsApi.hideConversation(convId, { userId: user.id, pin });
              setShowHideInput(null);
              setHidePin('');
              loadConversations();
              if (activeChat === convId) setActiveChat(null);
              notify.success('Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ ÃƒÂ¡Ã‚ÂºÃ‚Â©n hÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢i thoÃƒÂ¡Ã‚ÂºÃ‚Â¡i');
            } catch (err: any) {
              setHideError(err?.message || 'LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i');
            } finally {
              setHideLoading(false);
            }
          }}

        onCancelHide={() => { setShowHideInput(null); setHidePin(''); setHideError(null); }}
        onShowHidden={async () => {
          setShowHiddenPanel(true);
          if (!user?.id) return;
          setHiddenLoading(true);
          try {
            const data = await conversationsApi.getHiddenConversationsByUserId(user.id);
            setHiddenConversations(Array.isArray(data) ? data : []);
          } catch { setHiddenConversations([]); }
          finally { setHiddenLoading(false); }
        }}
        onStartHide={(convId) => {
          setShowHideInput(convId);
          setHidePin('');
          setHideError(null);
          if (leftSidebarCollapsed) setLeftSidebarCollapsed(false);
          setContextMenu(null);
        }}
        onTogglePinConversation={async (convId) => {
          if (!user?.id || pinLoading) return;
          setPinLoading(true);
          try {
            await conversationsApi.togglePinConversation(convId, { userId: user.id });
            await loadConversations();
          } catch (err: any) {
            const msg = err?.message || 'Không thể ghim hội thoại';
            notify.error(msg);
          } finally {
            setPinLoading(false);
          }
        }}
        pinLoading={pinLoading}
        onViewProfile={(userId, userName) => setViewProfileTarget({ userId, userName })}
      />
      </div>

      {/* Hidden Chats Panel + Context Menu + Unlock Modal */}
      <HiddenChatsPanel
        contextMenu={contextMenu}
        onContextMenuAction={(convId) => {
          setShowHideInput(convId);
          setHidePin('');
          setHideError(null);
          if (leftSidebarCollapsed) setLeftSidebarCollapsed(false);
          setContextMenu(null);
        }}
        showHiddenPanel={showHiddenPanel}
        hiddenConversations={hiddenConversations}
        hiddenLoading={hiddenLoading}
        onCloseHiddenPanel={() => { setShowHiddenPanel(false); setShowHideInput(null); setHidePin(''); }}
        onSelectHiddenConv={(conv) => {
          setPendingUnlockConv(conv);
          setUnlockPin('');
          setUnlockError(null);
          setShowUnlockModal(true);
        }}
        hashColor={hashColor}
        userId={user?.id}
        showUnlockModal={showUnlockModal}
        pendingUnlockConv={pendingUnlockConv}
        unlockPin={unlockPin}
        onUnlockPinChange={setUnlockPin}
        unlockLoading={unlockLoading}
        unlockError={unlockError}
        onUnlockErrorChange={setUnlockError}
        onUnlock={async () => {
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
            notify.success('Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ mÃƒÂ¡Ã‚Â»Ã…Â¸ khÃƒÆ’Ã‚Â³a hÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢i thoÃƒÂ¡Ã‚ÂºÃ‚Â¡i');
          } catch (err: any) {
            setUnlockError(err?.message || 'PIN khÃƒÆ’Ã‚Â´ng Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Âºng');
          } finally {
            setUnlockLoading(false);
          }
        }}
        onCloseUnlockModal={() => { setShowUnlockModal(false); setPendingUnlockConv(null); setUnlockPin(''); setUnlockError(null); }}
      />

      {/* Main Chat Area - hidden on mobile when sidebar list or right panel is showing */}
      <div className={`flex-1 flex flex-col bg-white min-w-0 relative ${mobileShowChat ? 'flex' : 'hidden'} md:flex`}>
        {invitePreviewLoading && (
          <div className="mx-4 mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Dang tai thong tin nhom tu link moi...
          </div>
        )}

        {invitePreview && !invitePreviewLoading && (
          <div className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white shadow-sm px-5 py-4">
            <h3 className="text-base font-semibold text-gray-900">Loi moi tham gia nhom</h3>
            <p className="mt-2 text-sm text-gray-700">
              <span className="font-medium">Ten nhom:</span> {invitePreview.conversation.groupName || 'Group Chat'}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-medium">So luong thanh vien:</span> {invitePreview.conversation.participantIds?.length || 0}
            </p>
            {invitePreview.conversation.approvalsRequired && (
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block">
                Nhom dang bat phe duyet. Sau khi tham gia, yeu cau cua ban se cho truong nhom/admin duyet.
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleJoinFromInvitePreview}
                disabled={inviteJoinLoading}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {inviteJoinLoading ? 'Dang xu ly...' : 'Tham gia'}
              </button>
              <button
                type="button"
                onClick={handleDeclineInvitePreview}
                disabled={inviteJoinLoading}
                className="h-9 px-4 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Tu choi
              </button>
            </div>
          </div>
        )}

        {/* Chat Header */}
        {activeConversation && (
          <ChatHeader
            conversation={activeConversation}
            isGroupChat={isGroupChat}
            isAIChat={isAIChat}
            showSearch={showSearch}
            showPinnedPanel={showPinnedPanel}
            rightSidebarCollapsed={rightSidebarCollapsed}
            callBlocked={(() => {
              if (isAIChat || isGroupChat) return false;
              return !!(blockedByOtherAll || blockedByOtherCall);
            })()}
            onToggleSearch={() => setShowSearch(!showSearch)}
            onTogglePinned={async () => {
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
            onToggleRightSidebar={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
            onVoiceCall={() => {
              const callInfo = getCallInfo();
              if (callInfo?.id && callInfo?.name) {
                const conversationId = callInfo.isGroup ? callInfo.id : undefined;
                const isGroup = callInfo.isGroup || false;
                startCall(callInfo.id, callInfo.name, 'voice', conversationId, isGroup);
              } else {
                notify.error(t('messenger.errors.startCall'));
              }
            }}
            onVideoCall={() => {
              const callInfo = getCallInfo();
              if (callInfo?.id && callInfo?.name) {
                const conversationId = callInfo.isGroup ? callInfo.id : undefined;
                const isGroup = callInfo.isGroup || false;
                startCall(callInfo.id, callInfo.name, 'video', conversationId, isGroup);
              } else {
                notify.error(t('messenger.errors.startVideoCall'));
              }
            }}
            onViewProfile={(userId, userName) => setViewProfileTarget({ userId, userName })}
            onBackToList={() => setActiveChat(null)}
          />
        )}

        {/* Search Bar */}
        {activeConversation && showSearch && (() => {
          // Build unique sender list from loaded messages
          const senderMap = new Map<string, string>();
          messages.forEach((m) => {
            if (m.senderId && m.sender) senderMap.set(m.senderId, m.sender);
          });
          const senders = Array.from(senderMap.entries());
          return (
            <div className="p-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#1a1d28]">
              <div className="relative mb-2">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('messenger.searchInConversationPlaceholder')}
                  className="w-full h-12 pl-12 pr-10 rounded-lg bg-gray-50 dark:bg-[#242838] border border-gray-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-[#1a1d28] text-base transition-all dark:text-[#edf0fa]"
                />
                <button
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchSenderId('');
                    setSearchResults(null);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2e3f] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              {senders.length > 0 && (
                <select
                  value={searchSenderId}
                  onChange={(e) => setSearchSenderId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-gray-50 dark:bg-[#242838] border border-gray-200 dark:border-white/5 text-sm text-gray-700 dark:text-[#9aa3bc] focus:outline-none focus:ring-1 focus:ring-blue-500 mb-1"
                >
                  <option value="">{t('messenger.searchAllSenders')}</option>
                  {senders.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              )}
              {searchLoading && <p className="text-xs text-gray-400 mt-1 pl-1">{t('messenger.searching')}</p>}
              {searchResults !== null && !searchLoading && (
                <p className="text-xs text-gray-400 mt-1 pl-1">
                  {t('messenger.searchResultsCount', { count: searchResults.length })}
                </p>
              )}
            </div>
          );
        })()}
        {/* Pinned Messages Panel (full list — toggle via header button) */}
        {activeConversation && showPinnedPanel && (
          <PinnedMessagesPanel
            messages={pinnedMessages}
            loading={pinnedLoading}
            onClose={() => setShowPinnedPanel(false)}
          />
        )}

        {/* Pinned Bar — always visible under header (Zalo-style) */}
        {activeConversation && !showPinnedPanel && (
          <PinnedBar
            messages={pinnedMessages}
            onUnpin={handleUnpinFromBar}
            onScrollTo={handleScrollToPinned}
          />
        )}

        {/* Appointment Bar — shows upcoming appointments */}
        {activeConversation && (
          <AppointmentBar
            messages={filteredMessages}
            onScrollTo={handleScrollToPinned}
          />
        )}

        {/* Messages Area */}
        <ChatMessages
          activeConversation={activeConversation ?? null}
          filteredMessages={filteredMessages}
          isGroupChat={isGroupChat}
          selectedMessage={selectedMessage}
          menuPosition={menuPosition}
          onSelectMessage={setSelectedMessage}
          onSetMenuPosition={setMenuPosition}
          onMessageAction={handleMessageAction}
          onReaction={handleReaction}
          messagesEndRef={messagesEndRef}
          scrollContainerRef={scrollContainerRef}
          onVote={handleVotePoll}
          voting={votingPollMessageId}
          userId={user?.id || ''}
          participantNames={activeConversationRaw?.participantNames}
          participantIds={activeConversationRaw?.participantIds}
          onJoinAppointment={handleJoinAppointment}
          joiningAppointment={joiningAppointmentId}
          onViewProfile={(userId, userName) => setViewProfileTarget({ userId, userName })}
          onScroll={handleScroll}
          loadingMore={loadingMore}
          messagesLoading={messagesLoading}
          backgroundUrl={activeConversationRaw?.backgroundUrl}
          searchKeyword={searchResults !== null ? searchQuery : ''}
        />

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
              <TypingIndicator
                isAIChat={isAIChat}
                typingNames={typingNames}
                conversationName={activeConversation?.name}
              />
            )}

            {/* Message Input */}
            {activeConversationRaw?.isDisbanded ? (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-center rounded-xl mx-4 mb-4 mt-2">
                <p className="text-red-500 font-medium text-sm">Nhóm này đã được giải tán bởi nhóm trưởng</p>
              </div>
            ) : (
              <MessageInput
                message={message}
                onMessageChange={handleMessageInputChange}
                onSend={handleSendMessage}
                editingMessageId={editingMessageId}
                isAIChat={isAIChat}
                isAiLoading={isAiLoading}
                uploadingFiles={uploadingFiles}
                filePreview={filePreview}
                onClearFilePreview={() => { if (filePreview) URL.revokeObjectURL(filePreview.preview); setFilePreview(null); }}
                uploadedFiles={uploadedFiles}
                onSetUploadedFiles={setUploadedFiles}
                onOpenPollModal={() => setIsCreatePollOpen(true)}
                onOpenAppointmentModal={() => setIsCreateAppointmentOpen(true)}
                isGroup={isGroupChat}
                fileInputRef={fileInputRef}
                onFileUpload={handleFileUpload}
                showAttachmentMenu={showAttachmentMenu}
                onToggleAttachmentMenu={() => { setShowAttachmentMenu((prev) => !prev); setShowStickerPanel(false); }}
                onShareLocation={() => {
                  const text = `[Location] ${t('messenger.attachments.locationShared')}`;
                  if (activeChat && user?.id) {
                    sendMessageAPI(activeChat, text, [], undefined).catch(() => { });
                    setShowAttachmentMenu(false);
                  }
                }}
                onShareContact={() => {
                  if (activeChat && user?.id) {
                    const contactName = user.fullName || user.username || user.id;
                    sendMessageAPI(
                      activeChat,
                      '',
                      [
                        {
                          type: 'contact',
                          url: `user:${user.id}`,
                          fileName: contactName,
                        },
                      ],
                      undefined
                    ).catch(() => { });
                    setShowAttachmentMenu(false);
                  }
                }}
                showStickerPanel={showStickerPanel}
                onToggleStickerPanel={() => { setShowStickerPanel((prev) => !prev); setShowAttachmentMenu(false); setShowEmojiPicker(false); }}
                activeStickerTopic={activeStickerTopic}
                onStickerTopicChange={setActiveStickerTopic}
                onSendSticker={handleSendSticker}
                showEmojiPicker={showEmojiPicker}
                onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
                onEmojiSelect={handleEmojiSelect}
                showVoicePreview={showVoicePreview}
                voiceTranscript={voiceTranscriptRef.current}
                onVoiceSendAudio={handleVoiceSendAudio}
                onVoiceConvertToText={handleVoiceConvertToText}
                onVoiceCancel={handleVoiceCancel}
                isRecording={isRecording}
                recordingDuration={recordingDuration}
                onVoiceRecord={handleVoiceRecord}
                onGenerateDailySummary={handleGenerateDailySummaryForAi}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                canSend={(() => {
                  if (isAIChat) return true;
                  const conv = activeConversationRaw;
                  if (!conv) return true;
                  // One-way block: only blocked side is restricted.
                  if (!conv.isGroup && blockedByOtherAll) return false;
                  if (!conv.isGroup && blockedByOtherMessage) return false;
                  // Group: admin-only send check
                  if (conv.onlyAdminsCanSend && !canManageGroup) return false;
                  return true;
                })()}
                sendBlockedReason={(() => {
                  const conv = activeConversationRaw;
                  if (!conv?.isGroup) {
                    if (blockedByOtherAll) {
                      return 'Bạn đã bị chặn. Không thể gửi tin nhắn.';
                    }
                    if (blockedByOtherMessage) {
                      return 'Bạn đã bị chặn tin nhắn. Không thể gửi tin nhắn.';
                    }
                  }
                  return t('messenger.onlyAdminsCanSend');
                })()}
                onSendGiphySuggestion={(url) => handleSendSticker(`__giphy__${url}`)}
                onOpenScheduleModal={() => setIsCreateAppointmentOpen(true)}
              />
            )}
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

          </>
        )}
      </div>

      {/* Right Sidebar - Conversation Info */}
      {/* Right Sidebar - on mobile takes full screen, on desktop stays side-by-side */}
      {activeConversation && !rightSidebarCollapsed && (
        <div className={`${mobileShowRightPanel ? 'absolute inset-0 z-30' : 'hidden'} md:relative md:block md:z-auto`}>
          <ChatInfoSidebar
            conversation={activeConversation}
            conversationRaw={activeConversationRaw ?? null}
            isGroupChat={isGroupChat}
            isAIChat={isAIChat}
            isOwner={isOwner}
            isAdmin={isAdmin}
            canManageGroup={canManageGroup}
            groupNameDraft={groupNameDraft}
            onGroupNameChange={setGroupNameDraft}
            groupAvatarDraft={groupAvatarDraft}
            onGroupAvatarChange={setGroupAvatarDraft}
            groupActionMessage={groupActionMessage}
            groupActionError={groupActionError}
            updatingGroup={updatingGroup}
            pendingJoins={pendingJoins}
            onSaveGroupMeta={handleSaveGroupMeta}
            onRemoveMember={handleRemoveMember}
            onJoinRequestDecision={handleJoinRequestDecision}
            onClearConversationForMe={handleClearConversationForMe}
            onClearGroupHistory={handleClearGroupHistory}
            onToggleRequireApproval={handleToggleRequireApproval}
            onToggleOnlyAdminsCanSend={handleToggleOnlyAdminsCanSend}
            onToggleAiAssistant={handleToggleAiAssistant}
            onTransferOwnership={handleTransferOwnership}
            onToggleAdmin={(memberId, isAdmin) => {
              handleToggleAdminDirect(memberId, activeConversationRaw?.adminIds || [], isAdmin);
            }}
            onDisbandGroup={handleDisbandGroup}
            friendList={friendList}
            onInviteFriends={handleInviteFriends}
            onShowSearch={() => setShowSearch(true)}
            onCloseRightSidebar={() => setRightSidebarCollapsed(true)}
            userId={user?.id}
          />
        </div>
      )}


      {forwardingMessage && (
        <ForwardModal
          message={forwardingMessage}
          conversations={conversations}
          getConversationDisplayName={getConversationDisplayName}
          targetConversationId={forwardTargetConversationId}
          onTargetChange={setForwardTargetConversationId}
          note={forwardNote}
          onNoteChange={setForwardNote}
          isForwarding={isForwarding}
          onConfirm={handleConfirmForward}
          onCancel={resetForwardDialog}
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
