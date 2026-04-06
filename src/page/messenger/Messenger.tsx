import { Link, useNavigate, useLocation, type Location } from 'react-router-dom';
import { Settings, Edit, Search, Phone, Video, Info, Plus, Send, Check, CheckCheck, MoreVertical, X, User, Bell, Palette, Pencil, Lock, Search as SearchIcon, Reply, Forward, Trash2, Copy, Pin, Star, ChevronLeft, ChevronRight, Smile, Mic, FileText, Image as ImageIcon, Users, Bot, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../common/icons/IconComponents';
import { useMessages } from '../../hooks/useMessages';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import { useSocket } from '../../contexts/SocketContext';
import EmojiPicker from '../../components/chat/EmojiPicker';
import { ImageUpload, VideoUpload } from '../../components/chat/FileUpload';
import VoiceRecorder from '../../components/chat/VoiceRecorder';
import { conversationsApi } from '../../apis/conversations';
import { uploadApi } from '../../apis/upload';
import { messagesApi, type Message, type MessageAttachment } from '../../apis/messages';
import { aiApi, type AIChatRequest, type AIDailySummaryResponse } from '../../apis/ai';
import { getLocaleTag } from '../../i18n';

interface MessengerLocationState {
  openConversationId?: string;
}

export default function Messenger() {
  const navigate = useNavigate();
  const location = useLocation() as Location & { state?: MessengerLocationState };
  const { user } = useAuth();
  const { startCall } = useCall();
  const { isConnected, subscribe } = useSocket();
  const {
    conversations,
    messages: apiMessages,
    loading,
    loadConversations,
    loadMessages,
    sendMessage: sendMessageAPI,
    removeMessage,
    formatMessageForDisplay,
  } = useMessages();

  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [filePreview, setFilePreview] = useState<{ file: File; preview: string } | null>(null);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
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

  // Load conversations on mount
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

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
    if (activeChat) {
      loadMessages(activeChat);
    }
  }, [activeChat, loadMessages]);

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

        return {
          id: conv.id,
          name,
          avatar: initials,
          color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          online: false,
          lastMessage: conv.lastMessagePreview || '',
          time: formatTime(conv.lastMessageAt),
          unread: 0,
          isGroup: conv.isGroup,
        };
      })
      .filter((c): c is { id: string; name: string; avatar: string; color: string; online: boolean; lastMessage: string; time: string; unread: number; isGroup: boolean } => Boolean(c));

    return [aiConversation, ...regularConversations];
  }, [conversations, user?.id, aiMessages, t, i18n.language]);

  const activeConversation = activeChat 
    ? formattedConversations.find((c) => c.id === activeChat)
    : null;
  
  // Get call info - supports both direct and group calls
  const getCallInfo = () => {
    if (!activeChat || !user?.id) {
      console.log('❌ getCallInfo: No active chat or user');
      return null;
    }
    
    // AI chat doesn't support calls
    if (activeChat === AI_CONVERSATION_ID) {
      return null;
    }
    
    const conv = conversations.find(c => c.id === activeChat);
    console.log('🔍 getCallInfo: Found conversation:', conv);
    
    if (!conv) {
      console.log('❌ getCallInfo: Conversation not found for activeChat:', activeChat);
      return null;
    }
    
    // For group calls: use conversationId as the "recipient" ID
    if (conv.isGroup) {
      console.log('📞 getCallInfo: Group call - conversationId:', activeChat);
      return {
        id: activeChat, // Use conversationId for group calls
        name: conv.groupName || 'Group Chat',
        isGroup: true,
      };
    }
    
    // For direct calls: return other participant info
    console.log('👥 getCallInfo: Direct call - Participant IDs:', conv.participantIds);
    console.log('👤 getCallInfo: Current user ID:', user.id);
    
    const otherParticipantId = conv.participantIds.find(id => id !== user.id);
    const otherParticipantIndex = conv.participantIds.findIndex(id => id !== user.id);
    const otherParticipantName = conv.participantNames?.[otherParticipantIndex] || 'Unknown User';
    
    console.log('🎯 getCallInfo: Returning recipient:', {
      id: otherParticipantId,
      name: otherParticipantName,
      conversationId: activeChat,
      isGroup: false,
    });
    
    if (!otherParticipantId) {
      console.error('❌ getCallInfo: No other participant found!');
      return null;
    }
    
    return {
      id: otherParticipantId,
      name: otherParticipantName,
      isGroup: false,
    };
  };

  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
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
    if (!message.trim() && !replyTo && !filePreview) return;
    if (!activeChat || !user?.id) return;

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
      
      // If there's a file preview (image), upload and send with caption
      if (filePreview) {
        const uploadResult = await uploadApi.uploadFile(filePreview.file);
        
        attachments = [{
          type: 'image',
          url: uploadResult.url,
          fileName: uploadResult.fileName,
          fileSize: uploadResult.fileSize,
        }];
        
        // Clear preview
        URL.revokeObjectURL(filePreview.preview);
        setFilePreview(null);
        setUploadedFiles([]);
      }

      // Send message (can have empty content if attachments exist)
      const messageContent = message.trim();
      
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
      alert(t('messenger.sendMessageError'));
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
      alert(t('messenger.errors.noConversationSelected'));
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
      alert(t('messenger.errors.uploadFile'));
      
      // Clear preview on error
      setFilePreview(null);
      setUploadedFiles([]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleVoiceRecording = async (blob: Blob) => {
    if (!activeChat) {
      alert(t('messenger.errors.noConversationSelected'));
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
      alert(t('messenger.errors.voiceMessage'));
    } finally {
      setUploadingFiles(false);
    }
  };

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
        console.log('Forward message:', messageId);
        // TODO: Implement forward API
        break;
      case 'copy':
        navigator.clipboard.writeText(message.content);
        break;
      case 'pin':
        messagesApi.togglePin(messageId).catch((err: unknown) => {
          console.error('Failed to toggle pin:', err);
        });
        break;
      case 'star':
        if (user?.id) {
          messagesApi.toggleStar(messageId, user.id).catch((err: unknown) => {
            console.error('Failed to toggle star:', err);
          });
        }
        break;
      case 'delete':
        if (activeChat && confirm(t('messenger.confirmDeleteMessage'))) {
          removeMessage(activeChat, messageId).catch((err: unknown) => {
            console.error('Failed to delete message:', err);
            alert(t('messenger.errors.deleteMessage'));
          });
        }
        break;
      case 'edit':
        setMessage(message.content);
        // TODO: Call update message API when sending
        break;
    }
    setSelectedMessage(null);
    setMenuPosition(null);
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
        leftSidebarCollapsed ? 'w-20' : 'w-[400px]'
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
          {formattedConversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveChat(conv.id)}
              className={`cursor-pointer transition-all duration-200 mx-3 my-1 rounded-2xl flex items-center gap-3 ${
                activeChat === conv.id 
                  ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'hover:bg-gray-100/80 dark:hover:bg-[#1e2130]/80'
              } ${leftSidebarCollapsed ? 'p-3 justify-center' : 'p-3'}`}
              title={leftSidebarCollapsed ? conv.name : ''}
            >
              {leftSidebarCollapsed ? (
                <div className="relative">
                  {conv.id === AI_CONVERSATION_ID ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  ) : conv.isGroup ? (
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
                    {conv.id === AI_CONVERSATION_ID ? (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <Bot className="w-7 h-7 text-white" />
                      </div>
                    ) : conv.isGroup ? (
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
                onClick={() => {
                  const callInfo = getCallInfo();
                  if (callInfo?.id && callInfo?.name) {
                    // For group calls: pass conversationId and isGroup=true
                    // For direct calls: pass userId and isGroup=false
                    const conversationId = callInfo.isGroup ? callInfo.id : undefined;
                    const isGroup = callInfo.isGroup || false;
                    startCall(callInfo.id, callInfo.name, 'voice', conversationId, isGroup);
                  } else {
                    alert(t('messenger.errors.startCall'));
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
                    alert(t('messenger.errors.startVideoCall'));
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
        {showSearch && (
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
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-opacity ${
                      msg.senderId === 'ai' 
                        ? 'bg-gradient-to-br from-indigo-400 to-purple-500 cursor-default' 
                        : 'bg-green-500 cursor-pointer hover:opacity-90'
                    }`}
                    onClick={msg.senderId === 'ai' ? undefined : () => navigate(`/profile/${msg.senderId}`)}
                  >
                    {msg.senderId === 'ai' ? (
                      <Bot className="w-6 h-6 text-white" />
                    ) : (
                      <span className="text-white font-bold text-base">{msg.sender.charAt(0)}</span>
                    )}
                  </div>
                )}
                <div className={`max-w-[70%] relative ${msg.isMe ? 'text-right' : ''}`}>
                  {/* Sender name for group chats or AI */}
                  {(isGroupChat || msg.senderId === 'ai') && !msg.isMe && (
                    <div className="flex items-center gap-2 mb-1.5">
                      {msg.senderId === 'ai' && (
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      )}
                      <p className="text-xs font-semibold text-gray-600">
                        {msg.sender}
                      </p>
                    </div>
                  )}
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
                      <span>{t('messenger.messageOptions.pinned')}</span>
                    </div>
                  )}

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {msg.attachments.map((attachment, idx) => (
                        <div key={idx}>
                          {attachment.type === 'image' && (
                            <div className="max-w-xs rounded-xl overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                              <img 
                                src={attachment.url} 
                                alt={attachment.fileName || t('messenger.attachment.imageAlt')}
                                className="w-full h-auto"
                                onClick={() => window.open(attachment.url, '_blank')}
                              />
                            </div>
                          )}
                          {attachment.type === 'video' && (
                            <div className="max-w-xs rounded-xl overflow-hidden shadow-sm">
                              <video 
                                src={attachment.url} 
                                controls
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                          {attachment.type === 'audio' && (
                            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl max-w-xs">
                              <Mic className="w-5 h-5 text-blue-500" />
                              <audio src={attachment.url} controls className="flex-1" />
                            </div>
                          )}
                          {attachment.type === 'file' && (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl max-w-xs hover:bg-gray-200 transition-colors"
                            >
                              <FileText className="w-6 h-6 text-gray-600" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {attachment.fileName || t('messenger.attachment.fileAlt')}
                                </p>
                                {attachment.fileSize && (
                                  <p className="text-xs text-gray-500">
                                    {(attachment.fileSize / 1024).toFixed(1)} KB
                                  </p>
                                )}
                              </div>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.image ? (
                    <div className="max-w-xs rounded-2xl mb-2 overflow-hidden shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                      {msg.image === 'beach' && <LargeBeachPlaceholder className="w-full h-full" />}
                    </div>
                  ) : null}

                  {msg.content && (
                    <div
                      className={`relative px-5 py-3.5 shadow-sm transition-all hover:shadow-md ${
                        msg.isMe
                          ? 'bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm'
                          : msg.senderId === 'ai'
                          ? 'bg-white dark:bg-[#1a1d28] text-gray-900 dark:text-gray-100 border border-gray-100/50 dark:border-white/5 rounded-2xl rounded-tl-sm'
                          : 'bg-white dark:bg-[#1a1d28] text-gray-900 dark:text-gray-100 border border-gray-100/50 dark:border-white/5 rounded-2xl rounded-tl-sm'
                      }`}
                      onDoubleClick={() => handleReaction(msg.id, '❤️')}
                    >
                      <p className="whitespace-pre-line text-[15px] leading-[1.6] font-normal">{msg.content}</p>
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
                              <button
                                onClick={() => handleMessageAction('delete', msg.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>{t('messenger.messageOptions.delete')}</span>
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

        {/* Typing Indicator */}
        {(isTyping || (isAIChat && isAiLoading)) && (
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
                    : t('messenger.typing.user', { name: activeConversation?.name ?? '' })}
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
                  <span className="text-xs text-gray-600 font-medium">{t('messenger.attachments.photo')}</span>
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
                  <span className="text-xs text-gray-600 font-medium">{t('messenger.attachments.video')}</span>
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
                  <span className="text-xs text-gray-600 font-medium">{t('messenger.attachments.file')}</span>
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
                  <span className="text-xs text-gray-600 font-medium">
                    {isRecording ? t('messenger.attachments.recording') : t('messenger.attachments.voice')}
                  </span>
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
              title={t('messenger.attachmentsTitle')}
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
              placeholder={replyTo ? t('messenger.replyingTo', { sender: replyTo.sender }) : t('messenger.typeMessagePlaceholder')}
              className="flex-1 h-10 md:h-11 lg:h-12 px-4 md:px-5 rounded-2xl bg-gray-100/50 dark:bg-[#22263a]/50 border border-transparent focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-[#1a1d28] text-sm md:text-[15px] transition-all dark:text-gray-100 dark:placeholder:text-gray-500"
            />

            <button 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                showEmojiPicker ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              title={t('messenger.emojiPicker.title')}
              disabled={uploadingFiles}
            >
              <Smile className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            {message.trim() || replyTo || filePreview ? (
              <button
                onClick={handleSendMessage}
                disabled={uploadingFiles || isAiLoading || (isAIChat && !message.trim())}
                className="w-10 h-10 md:w-11 md:h-11 lg:w-12 lg:h-12 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-all shrink-0 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('messenger.send')}
              >
                {isAiLoading ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </button>
            ) : (
              <VoiceRecorder onRecordingComplete={handleVoiceRecording} />
            )}
          </div>
        </div>
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
                  <button
                    onClick={() => {
                      // TODO: Mở modal chọn bạn bè để thêm vào nhóm (tương tự NewMessage.tsx)
                      // Tạm thời giữ input text cho đến khi có modal
                      const input = prompt(t('messenger.groupPanel.addMembersPrompt'));
                      if (input && input.trim()) {
                        setGroupMemberInput(input.trim());
                        handleAddMembers();
                      }
                    }}
                    disabled={updatingGroup}
                    className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>{updatingGroup ? t('messenger.groupPanel.processing') : t('messenger.groupPanel.addMembers')}</span>
                  </button>
                  {/* Hidden input for backward compatibility */}
                    <input
                      type="text"
                      value={groupMemberInput}
                      onChange={(e) => setGroupMemberInput(e.target.value)}
                    className="hidden"
                  />
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
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          {/* Customize Chat */}
          <div className="mb-6">
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
          <div className="mb-6">
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
          <div>
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
    </div>
  );
}
