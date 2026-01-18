import { Link, useNavigate } from 'react-router-dom';
import { Settings, Edit, Search, Phone, Video, Info, Plus, Send, Check, CheckCheck, MoreVertical, X, User, Bell, Palette, Pencil, Lock, Search as SearchIcon, Reply, Forward, Trash2, Copy, Pin, Star, ChevronLeft, ChevronRight, Smile, Mic, FileText, Image as ImageIcon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../common/icons/IconComponents';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import EmojiPicker from '../../components/chat/EmojiPicker';
import { ImageUpload, VideoUpload } from '../../components/chat/FileUpload';
import VoiceRecorder from '../../components/chat/VoiceRecorder';
import type { Conversation } from '../../apis/conversations';

interface Message {
  id: number;
  sender: string;
  senderId: number;
  content: string;
  time: string;
  isMe: boolean;
  status: 'sent' | 'delivered' | 'read' | null;
  image?: string;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: { id: number; content: string; sender: string };
  pinned?: boolean;
  starred?: boolean;
}

export default function Messenger() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startCall } = useCall();
  const {
    conversations,
    messages: apiMessages,
    loading,
    loadConversations,
    loadMessages,
    sendMessage: sendMessageAPI,
    formatMessageForDisplay,
  } = useMessages();

  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat, loadMessages]);

  // Get current messages for active chat
  const messages = activeChat ? (apiMessages[activeChat] || []).map(formatMessageForDisplay) : [];

  // Format conversation for display
  const formatConversation = (conv: Conversation) => {
    if (!user?.id) return null;
    
    // For direct conversations, find the other participant
    const otherParticipantId = conv.participantIds.find(id => id !== user.id);
    const otherParticipantIndex = conv.participantIds.findIndex(id => id !== user.id);
    
    const name = conv.isGroup 
      ? conv.groupName || 'Group Chat'
      : conv.participantNames?.[otherParticipantIndex] || 'Unknown User';
    
    const avatar = conv.isGroup
      ? conv.groupAvatar || 'GC'
      : conv.participantAvatars?.[otherParticipantIndex] || name.charAt(0).toUpperCase();
    
    // Get initials for avatar
    const initials = conv.isGroup 
      ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
      : name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    // Format last message time
    const formatTime = (dateStr?: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);
      
      if (days === 0) {
        if (hours === 0) return 'Vừa xong';
        return `${hours}h`;
      } else if (days === 1) return 'Hôm qua';
      else if (days < 7) return `${days} ngày`;
      else return date.toLocaleDateString('vi-VN');
    };

    return {
      id: conv.id,
      name,
      avatar: initials,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      online: false, // TODO: Implement online status
      lastMessage: conv.lastMessagePreview || '',
      time: formatTime(conv.lastMessageAt),
      unread: 0, // TODO: Implement unread count
      isGroup: conv.isGroup,
    };
  };

  const formattedConversations = conversations.map(formatConversation).filter(Boolean) as any[];

  // Legacy dummy conversations for backward compatibility (will be removed later)
  const legacyConversations = [
    {
      id: 1,
      name: 'Sarah Johnson',
      avatar: 'SJ',
      color: '#42B72A',
      online: true,
      lastMessage: 'Bạn: Hẹn gặp lại sau nhé!',
      time: '2h',
      unread: 0,
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: 'MC',
      color: '#FF6B6B',
      online: true,
      lastMessage: 'Được rồi, cảm ơn!',
      time: '5h',
      unread: 0,
    },
    {
      id: 3,
      name: 'Emma Davis',
      avatar: 'ED',
      color: '#4ECDC4',
      online: false,
      lastMessage: 'Emma: Xem này này!',
      time: 'Hôm qua',
      unread: 2,
    },
    {
      id: 4,
      name: 'Alex Park',
      avatar: 'AP',
      color: '#FFD93D',
      online: false,
      lastMessage: 'Alex: Haha',
      time: '2 ngày',
      unread: 0,
    },
    {
      id: 5,
      name: 'Lisa Nguyen',
      avatar: 'LN',
      color: '#9B59B6',
      online: false,
      lastMessage: 'Lisa: Ok bạn nhé!',
      time: '3 ngày',
      unread: 0,
    },
    {
      id: 6,
      name: 'Nhóm bạn thân',
      avatar: 'GC',
      color: '#E4E6EB',
      online: false,
      lastMessage: 'Sarah: Đi chơi cuối tuần',
      time: '4 ngày',
      unread: 0,
      isGroup: true,
    },
  ];

  const [legacyMessages, setLegacyMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Chào bạn! Hôm nay thế nào?',
      time: '9:30 SA',
      isMe: false,
      status: null,
      reactions: [{ emoji: '❤️', users: ['Me'] }],
    },
    {
      id: 2,
      sender: 'Me',
      senderId: 0,
      content: 'Mình rất tốt, cảm ơn bạn!\nCòn bạn thì sao?',
      time: '9:32 SA',
      isMe: true,
      status: 'read',
      pinned: true,
    },
    {
      id: 3,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Tuyệt vời! Cuối tuần này có kế hoạch gì chưa?',
      time: '9:35 SA',
      isMe: false,
      status: null,
      replyTo: { id: 2, content: 'Mình rất tốt, cảm ơn bạn!', sender: 'Me' },
    },
    {
      id: 4,
      sender: 'Me',
      senderId: 0,
      content: 'Chưa có kế hoạch cụ thể!\nMình đang nghĩ đi chơi đâu đó thư giãn',
      time: '9:40 SA',
      isMe: true,
      status: 'read',
    },
    {
      id: 5,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: '',
      time: '9:45 SA',
      isMe: false,
      image: 'beach',
      status: null,
    },
    {
      id: 6,
      sender: 'Sarah Johnson',
      senderId: 1,
      content: 'Đi biển nhé! Bạn nghĩ sao?',
      time: '9:48 SA',
      isMe: false,
      status: null,
      reactions: [{ emoji: '👍', users: ['Me', 'Mike'] }, { emoji: '❤️', users: ['Me'] }],
    },
  ]);

  const activeConversation = activeChat 
    ? formattedConversations.find((c) => c.id === activeChat)
    : null;
  
  // Get the other participant info for direct calls
  const getCallRecipient = () => {
    if (!activeChat || !user?.id) {
      console.log('❌ getCallRecipient: No active chat or user');
      return null;
    }
    
    const conv = conversations.find(c => c.id === activeChat);
    console.log('🔍 getCallRecipient: Found conversation:', conv);
    
    if (!conv) {
      console.log('❌ getCallRecipient: Conversation not found for activeChat:', activeChat);
      return null;
    }
    
    if (conv.isGroup) {
      console.log('❌ getCallRecipient: Cannot call in group chat');
      return null;
    }
    
    console.log('👥 getCallRecipient: Participant IDs:', conv.participantIds);
    console.log('👤 getCallRecipient: Current user ID:', user.id);
    
    const otherParticipantId = conv.participantIds.find(id => id !== user.id);
    const otherParticipantIndex = conv.participantIds.findIndex(id => id !== user.id);
    const otherParticipantName = conv.participantNames?.[otherParticipantIndex] || 'Unknown User';
    
    console.log('🎯 getCallRecipient: Returning recipient:', {
      id: otherParticipantId,
      name: otherParticipantName,
      conversationId: activeChat
    });
    
    if (!otherParticipantId) {
      console.error('❌ getCallRecipient: No other participant found!');
      return null;
    }
    
    return {
      id: otherParticipantId,
      name: otherParticipantName,
    };
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  const handleSendMessage = async () => {
    if (!message.trim() && !replyTo) return;
    if (!activeChat) return;

    try {
      await sendMessageAPI(activeChat, message);
      setMessage('');
      setReplyTo(null);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is already handled in useMessages hook
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  const handleFileSelect = async (file: File) => {
    console.log('File selected:', file.name, file.type, file.size);
    // TODO: Implement file upload API
    alert(`Đang phát triển tính năng upload ${file.type.startsWith('image/') ? 'ảnh' : file.type.startsWith('video/') ? 'video' : 'file'}: ${file.name}`);
  };

  const handleVoiceRecording = async (blob: Blob) => {
    console.log('Voice recording completed:', blob.size, 'bytes');
    // TODO: Implement voice message upload
    alert('Đang phát triển tính năng gửi tin nhắn thoại');
  };

  const handleReaction = (messageId: string, emoji: string) => {
    // TODO: Implement reaction API call
    console.log('Reaction:', messageId, emoji);
    // For now, update local state - will implement API later
    setLegacyMessages(prevMessages => prevMessages.map(msg => {
      if (msg.id.toString() === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.users.includes('Me')) {
            const updatedUsers = existingReaction.users.filter(u => u !== 'Me');
            if (updatedUsers.length === 0) {
              return { ...msg, reactions: msg.reactions?.filter(r => r.emoji !== emoji) };
            }
            return {
              ...msg,
              reactions: msg.reactions?.map(r => 
                r.emoji === emoji ? { ...r, users: updatedUsers } : r
              )
            };
          } else {
            return {
              ...msg,
              reactions: msg.reactions?.map(r => 
                r.emoji === emoji ? { ...r, users: [...r.users, 'Me'] } : r
              )
            };
          }
        } else {
          return {
            ...msg,
            reactions: [...(msg.reactions || []), { emoji, users: ['Me'] }]
          };
        }
      }
      return msg;
    }));
  };

  const handleMessageAction = (action: string, messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    switch (action) {
      case 'reply':
        setReplyTo({ id: messageId, content: message.content, sender: message.sender });
        break;
      case 'forward':
        console.log('Forward message:', messageId);
        // TODO: Implement forward API
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'pin':
        // TODO: Implement pin API
        console.log('Pin message:', messageId);
        break;
      case 'star':
        // TODO: Implement star API
        console.log('Star message:', messageId);
        break;
      case 'delete':
        if (confirm('Bạn có chắc muốn xóa tin nhắn này?')) {
          // TODO: Call delete message API
          console.log('Delete message:', messageId);
        }
        break;
      case 'edit':
        setMessage(message.content);
        // TODO: Call update message API when sending
        break;
    }
    setSelectedMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
    setShowAttachmentMenu(false);
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Voice recording logic here
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-[calc(100vh-5rem)] bg-gray-50 flex relative overflow-hidden">
      {/* Left Sidebar - Conversations */}
      <div className={`border-r border-gray-200 bg-white flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
        leftSidebarCollapsed ? 'w-20' : 'w-[400px]'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          {!leftSidebarCollapsed && (
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          )}
          <div className={`flex gap-2 ${leftSidebarCollapsed ? 'flex-col w-full' : ''}`}>
            {!leftSidebarCollapsed && (
              <>
                <button 
                  onClick={() => navigate('/messenger/new')}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title="New message"
                >
                  <Edit className="w-5 h-5 text-gray-700" />
                </button>
                <Link
                  to="/messenger/settings"
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                </Link>
              </>
            )}
            <button
              onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              title={leftSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
        {!leftSidebarCollapsed && (
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages"
                className="w-full h-11 pl-11 pr-4 rounded-lg bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
              />
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && formattedConversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          )}
          {formattedConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                activeChat === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              } ${leftSidebarCollapsed ? 'p-3 flex justify-center' : 'p-4'}`}
              title={leftSidebarCollapsed ? conv.name : ''}
            >
              {leftSidebarCollapsed ? (
                <div className="relative">
                  {conv.isGroup ? (
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-9 h-9 rounded-lg bg-green-500 border-2 border-white flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <div className="absolute bottom-0 right-0 w-9 h-9 rounded-lg bg-red-500 border-2 border-white flex items-center justify-center shadow-sm">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        style={{ backgroundColor: conv.color }}
                      >
                        {conv.avatar}
                      </div>
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                      {conv.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                          {conv.unread}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {conv.isGroup ? (
                      <div className="relative w-14 h-14">
                        <div className="absolute top-0 left-0 w-11 h-11 rounded-xl bg-green-500 border-3 border-white flex items-center justify-center shadow-sm">
                          <span className="text-white text-sm font-bold">S</span>
                        </div>
                        <div className="absolute bottom-0 right-0 w-11 h-11 rounded-xl bg-red-500 border-3 border-white flex items-center justify-center shadow-sm">
                          <span className="text-white text-sm font-bold">M</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                          style={{ backgroundColor: conv.color }}
                        >
                          {conv.avatar}
                        </div>
                        {conv.online && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-3 border-white"></div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-gray-900 text-base truncate">{conv.name}</p>
                      <span className="text-sm text-gray-500 shrink-0 ml-2">{conv.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shrink-0 ml-2">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Chat Header */}
        {activeConversation && (
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {activeConversation.isGroup ? (
                <div className="relative w-12 h-12 shrink-0">
                  <div className="absolute top-0 left-0 w-9 h-9 rounded-xl bg-green-500 border-3 border-white flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">S</span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-9 h-9 rounded-xl bg-red-500 border-3 border-white flex items-center justify-center shadow-sm">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
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
                  <p className="text-sm text-green-500 font-medium">● Active now</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  showSearch ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                title="Search"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={() => {
                  const recipient = getCallRecipient();
                  if (recipient?.id && recipient?.name) {
                    startCall(recipient.id, recipient.name, 'voice');
                  } else {
                    alert('Không thể gọi điện trong nhóm chat hoặc cuộc trò chuyện không hợp lệ');
                  }
                }}
                disabled={!activeChat}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Call"
              >
                <Phone className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => {
                  const recipient = getCallRecipient();
                  if (recipient?.id && recipient?.name) {
                    startCall(recipient.id, recipient.name, 'video');
                  } else {
                    alert('Không thể gọi video trong nhóm chat hoặc cuộc trò chuyện không hợp lệ');
                  }
                }}
                disabled={!activeChat}
                className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                title="Video call"
              >
                <Video className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  !rightSidebarCollapsed ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-600'
                }`}
                title="Info"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in conversation..."
                className="w-full h-12 pl-12 pr-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base transition-all"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 bg-gray-50" ref={messagesEndRef}>
          {filteredMessages.map((msg) => {
            const isSelected = selectedMessage === msg.id;
            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-4 ${msg.isMe ? 'flex-row-reverse' : ''}`}
              >
                {!msg.isMe && (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#42B72A' }}
                    onClick={() => navigate(`/profile/${msg.senderId}`)}
                  >
                    {msg.sender.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[70%] relative ${msg.isMe ? 'text-right' : ''}`}>
                  {/* Reply To */}
                  {msg.replyTo && (
                    <div className={`mb-2 p-3 rounded-lg bg-gray-100 border-l-4 border-blue-500 text-left ${msg.isMe ? 'text-right' : ''}`}>
                      <p className="text-xs font-semibold text-gray-600 mb-1">{msg.replyTo.sender}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{msg.replyTo.content}</p>
                    </div>
                  )}
                  
                  {/* Pinned Badge */}
                  {msg.pinned && (
                    <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
                      <Pin className="w-3 h-3" />
                      <span>Pinned</span>
                    </div>
                  )}

                  {msg.image ? (
                    <div className="w-[320px] h-[240px] rounded-2xl mb-2 overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                      {msg.image === 'beach' && <LargeBeachPlaceholder className="w-full h-full" />}
                    </div>
                  ) : (
                    <div
                      className={`rounded-2xl px-5 py-3.5 mb-1 shadow-sm relative ${
                        msg.isMe
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-900 border border-gray-100'
                      }`}
                      onDoubleClick={() => handleReaction(msg.id, '❤️')}
                    >
                      <p className="whitespace-pre-line text-base leading-relaxed">{msg.content}</p>
                      
                      {/* Message Options */}
                      <div className={`absolute ${msg.isMe ? 'left-0' : 'right-0'} top-0 ${msg.isMe ? '-left-12' : '-right-12'} opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <div className="relative">
                          <button
                            onClick={() => setSelectedMessage(isSelected ? null : msg.id)}
                            className="w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          {isSelected && (
                            <div className={`absolute ${msg.isMe ? 'left-full' : 'right-full'} top-0 ml-2 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10 min-w-[180px]`}>
                              <button
                                onClick={() => handleMessageAction('reply', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Reply className="w-4 h-4" />
                                <span>Reply</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('forward', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Forward className="w-4 h-4" />
                                <span>Forward</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('copy', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Copy className="w-4 h-4" />
                                <span>Copy</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('pin', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Pin className="w-4 h-4" />
                                <span>{msg.pinned ? 'Unpin' : 'Pin'}</span>
                              </button>
                              <button
                                onClick={() => handleMessageAction('star', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                              >
                                <Star className={`w-4 h-4 ${msg.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                <span>{msg.starred ? 'Unstar' : 'Star'}</span>
                              </button>
                              {msg.isMe && (
                                <button
                                  onClick={() => handleMessageAction('edit', msg.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                >
                                  <Pencil className="w-4 h-4" />
                                  <span>Edit</span>
                                </button>
                              )}
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => handleMessageAction('delete', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3 text-gray-600" />
                      </button>
                      
                      {/* Quick Reactions Picker */}
                      <div
                        id={`reaction-picker-${msg.id}`}
                        className="hidden absolute bottom-full mb-2 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex gap-1 z-20"
                      >
                        {quickReactions.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => {
                              handleReaction(msg.id, emoji);
                              const picker = document.getElementById(`reaction-picker-${msg.id}`);
                              if (picker) picker.classList.add('hidden');
                            }}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-lg transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time and Status */}
                  <div className={`flex items-center gap-2 px-2 mt-1 ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-gray-500">{msg.time}</p>
                    {msg.isMe && msg.status && (
                      <div className="flex items-center">
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-4 h-4 text-blue-500" />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Check className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Preview */}
        {replyTo && (
          <div className="px-4 md:px-6 py-2.5 md:py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <div className="w-0.5 h-10 md:h-12 bg-blue-500 rounded-full shrink-0"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-gray-700">Replying to {replyTo.sender}</p>
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

        {/* Typing Indicator */}
        {isTyping && (
          <div className="px-4 md:px-6 py-2 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="truncate">{activeConversation?.name} is typing...</span>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-3 md:p-4 lg:p-5 border-t border-gray-100 bg-white">
          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="mb-2 md:mb-3 flex gap-2 overflow-x-auto pb-2">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="relative shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  </div>
                  <button
                    onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                    className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  </button>
                  <p className="text-xs text-gray-600 mt-1 truncate w-16 md:w-20">{file.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* Attachment Menu */}
          {showAttachmentMenu && (
            <div className="mb-2 md:mb-3 p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="grid grid-cols-4 gap-2 md:gap-3">
                <label className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Photo</span>
                </label>
                <label className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <Video className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Video</span>
                </label>
                <label className="flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-white transition-colors cursor-pointer">
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">File</span>
                </label>
                <button
                  onClick={handleVoiceRecord}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-white transition-colors ${
                    isRecording ? 'bg-red-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                    isRecording ? 'bg-red-100' : 'bg-orange-100'
                  }`}>
                    <Mic className={`w-5 h-5 md:w-6 md:h-6 ${isRecording ? 'text-red-600' : 'text-orange-600'}`} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">{isRecording ? 'Recording...' : 'Voice'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
            />
          )}

          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
              className={`w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showAttachmentMenu ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="Attachments"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <ImageUpload onFileSelect={handleFileSelect} />
            <VideoUpload onFileSelect={handleFileSelect} />
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              onFocus={() => setIsTyping(true)}
              onBlur={() => setTimeout(() => setIsTyping(false), 1000)}
              placeholder={replyTo ? `Replying to ${replyTo.sender}...` : "Type a message..."}
              className="flex-1 h-10 md:h-11 lg:h-12 px-4 md:px-5 rounded-full bg-gray-50 border border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm md:text-base transition-all"
            />
            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showEmojiPicker ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title="Emoji"
            >
              <Smile className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {message.trim() || replyTo ? (
              <button
                onClick={handleSendMessage}
                className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all shrink-0 shadow-md"
                title="Send"
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            ) : (
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Conversation Info */}
      {activeConversation && !rightSidebarCollapsed && (
        <div className="border-l border-gray-200 bg-white overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full md:w-[320px] lg:w-[360px] p-4 md:p-6">
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
              <p className="text-sm md:text-base text-green-500 font-medium">● Active now</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 md:gap-4 mb-6">
            <button className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <User className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">Profile</span>
            </button>
            <button className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <Bell className="w-6 h-6 md:w-7 md:h-7 text-gray-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-600 font-medium">Mute</span>
            </button>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Customize Chat */}
          <div className="mb-6">
            <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">Customize Chat</h4>
            <div className="space-y-1.5">
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Palette className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>Change Theme</span>
              </button>
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Smile className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>Change Emoji</span>
              </button>
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Pencil className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>Change Name</span>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 my-4 md:my-6"></div>

          {/* Media */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base md:text-lg font-bold text-gray-900">Photos & Videos</h4>
              <button className="text-xs md:text-sm text-blue-600 hover:underline font-medium">See all</button>
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
          <div>
            <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3">Privacy & Support</h4>
            <div className="space-y-1.5">
              <button className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3">
                <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>Disappearing Messages</span>
              </button>
              <button 
                onClick={() => {
                  setShowSearch(true);
                  setRightSidebarCollapsed(true);
                }}
                className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3"
              >
                <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
                <span>Search in Conversation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
