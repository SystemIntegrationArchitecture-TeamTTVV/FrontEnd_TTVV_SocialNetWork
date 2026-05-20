import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Bell, BellOff, Search as SearchIcon, Trash2, X,
  Palette, Lock, ShieldOff, Flag, Pencil,
  Mail, Phone, MapPin, Briefcase, GraduationCap, FileText,
  Circle, Loader2, ImageOff, PhoneOff, MessageSquareOff,
} from 'lucide-react';
import { usersApi, type User as UserType } from '../../../apis/users';
import { conversationsApi } from '../../../apis/conversations';
import { reportsApi } from '../../../apis/reports';
import { messagesApi, type Message } from '../../../apis/messages';
import { uploadApi } from '../../../apis/upload';
import { useSocket } from '../../../contexts/SocketContext';
import { notify } from '../../../services/notify';
import type { Conversation } from '../../../apis/conversations';
import { cn } from '../../../utils/cn';
import ReportModal from '../../../components/common/ReportModal';

const BLOCK_OVERRIDE_STORAGE_KEY = 'messenger:block-overrides';

type BlockOverrideState = {
  blocked: boolean;
  messageBlocked: boolean;
  callBlocked: boolean;
  updatedAt: string;
};

const readBlockOverrides = (): Record<string, BlockOverrideState> => {
  try {
    const raw = localStorage.getItem(BLOCK_OVERRIDE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeBlockOverrides = (next: Record<string, BlockOverrideState>) => {
  try {
    localStorage.setItem(BLOCK_OVERRIDE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage errors
  }
};

interface DirectChatSidebarProps {
  conversation: {
    id: string;
    name: string;
    avatar: string;
    imageUrl?: string;
    online: boolean;
    color: string;
  };
  conversationRaw: Conversation | null;
  onClearConversationForMe: () => void;
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
  loadConversations?: () => void;
}

export default function DirectChatSidebar({
  conversation,
  conversationRaw,
  onClearConversationForMe,
  onShowSearch,
  onCloseRightSidebar,
  userId,
  loadConversations,
}: DirectChatSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { subscribe } = useSocket();

  const getServerBlockState = () => ({
    blocked: !!(userId && conversationRaw?.blockedByUserIds?.includes(userId)),
    messageBlocked: !!(userId && conversationRaw?.messageBlockedByUserIds?.includes(userId)),
    callBlocked: !!(userId && conversationRaw?.callBlockedByUserIds?.includes(userId)),
  });

  const getResolvedBlockState = () => {
    const server = getServerBlockState();
    if (!conversationRaw?.id) return server;
    const override = readBlockOverrides()[conversationRaw.id];
    if (!override) return server;
    return {
      blocked: override.blocked,
      messageBlocked: override.messageBlocked,
      callBlocked: override.callBlocked,
    };
  };

  const [otherUser, setOtherUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(() =>
    !!(userId && conversationRaw?.mutedByUserIds?.includes(userId))
  );
  const [isBlocked, setIsBlocked] = useState(() => getResolvedBlockState().blocked);
  const [isMessageBlocked, setIsMessageBlocked] = useState(() => getResolvedBlockState().messageBlocked);
  const [isCallBlocked, setIsCallBlocked] = useState(() => getResolvedBlockState().callBlocked);
  const [blockActionLoading, setBlockActionLoading] = useState(false);
  const blockStateLockUntilRef = useRef<number>(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(conversation.online);
  const [removingBackground, setRemovingBackground] = useState(false);
  
  // New States
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameDraft, setNicknameDraft] = useState('');
  const [updatingNickname, setUpdatingNickname] = useState(false);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  
  // To update UI instantly if needed (though we rely on parent/socket mostly, 
  // local state gives immediate feedback)
  const localNicknameFromConv = userId
    ? conversationRaw?.nicknames?.[conversationRaw?.participantIds?.find(id => id !== userId) || '']
    : undefined;
  const [localNickname, setLocalNickname] = useState(localNicknameFromConv || conversation.name);

  const persistBlockOverride = (next: { blocked: boolean; messageBlocked: boolean; callBlocked: boolean }) => {
    if (!conversationRaw?.id) return;
    const all = readBlockOverrides();
    all[conversationRaw.id] = {
      blocked: next.blocked,
      messageBlocked: next.messageBlocked,
      callBlocked: next.callBlocked,
      updatedAt: new Date().toISOString(),
    };
    writeBlockOverrides(all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messenger:block-override-updated', {
        detail: { conversationId: conversationRaw.id, ...next },
      }));
    }
  };

  // Sync isMuted/isBlocked/isMessageBlocked/isCallBlocked when conversationRaw changes (e.g. via socket update)
  useEffect(() => {
    if (blockActionLoading) return;
    if (Date.now() < blockStateLockUntilRef.current) return;
    if (userId && conversationRaw) {
      setIsMuted(!!(conversationRaw.mutedByUserIds?.includes(userId)));
      const resolved = getResolvedBlockState();
      setIsBlocked(resolved.blocked);
      setIsMessageBlocked(resolved.messageBlocked);
      setIsCallBlocked(resolved.callBlocked);
    }
  }, [conversationRaw?.mutedByUserIds, conversationRaw?.blockedByUserIds, conversationRaw?.messageBlockedByUserIds, conversationRaw?.callBlockedByUserIds, userId]);

  // Compute other user ID
  const otherUserId = conversationRaw?.participantIds?.find(id => id !== userId) || '';

  // ── Fetch other user profile ──
  useEffect(() => {
    if (!otherUserId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    usersApi.getUserById(otherUserId)
      .then(user => {
        if (!cancelled) setOtherUser(user);
      })
      .catch(err => console.warn('Failed to fetch user info:', err))
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [otherUserId]);

  // ── Fetch Media Messages ──
  useEffect(() => {
    if (!conversationRaw?.id || !userId) return;
    let cancelled = false;
    
    messagesApi.getMediaMessages(conversationRaw.id, userId)
      .then(messages => {
        if (!cancelled) setMediaMessages(messages);
      })
      .catch(err => console.warn('Failed to fetch media:', err));
      
    return () => { cancelled = true; };
  }, [conversationRaw?.id, userId]);

  // ── Realtime presence updates via socket ──
  useEffect(() => {
    if (!otherUserId) return;
    const unsub = subscribe('USER_PRESENCE_CHANGED', (event: any) => {
      const data = event?.data;
      if (data?.userId === otherUserId) {
        setOnlineStatus(!!data.online);
      }
    });
    return unsub;
  }, [otherUserId, subscribe]);

  // ── Realtime: listen for meta changes (block, mute, nickname, background) ──
  useEffect(() => {
    if (!conversationRaw?.id) return;
    const unsub = subscribe('CONVERSATION_META_UPDATED', (event: any) => {
      const data = event?.data;
      if (data?.conversationId === conversationRaw.id) {
        // Determine if the current user performed this action
        // If we just called an API, we already showed a toast → skip for self
        const actorId = data?.userId || data?.actorId;
        const isSelfAction = actorId === userId;

        // Show notification for background changes (only to the OTHER user)
        if (!isSelfAction && 'backgroundUrl' in (data || {})) {
          const oldBg = conversationRaw.backgroundUrl ?? null;
          const newBg = data.backgroundUrl ?? null;
          if (oldBg !== newBg) {
            if (newBg) {
              notify.success('Ảnh nền đoạn chat đã được cập nhật');
            } else {
              notify.success('Ảnh nền đoạn chat đã được gỡ bỏ');
            }
          }
        }
        // Show notification for block changes (only to the OTHER user)
        if ('blockedByUserIds' in (data || {})) {
          blockStateLockUntilRef.current = 0;
          const wasBlocked = conversationRaw.blockedByUserIds?.length ?? 0;
          const nowBlocked = data.blockedByUserIds?.length ?? 0;
          const nextSelfBlocked = !!(userId && data.blockedByUserIds?.includes(userId));
          setIsBlocked(nextSelfBlocked);
          persistBlockOverride({
            blocked: nextSelfBlocked,
            messageBlocked: isMessageBlocked,
            callBlocked: isCallBlocked,
          });
          if (!isSelfAction && nowBlocked > wasBlocked) {
            notify.error('Cuộc trò chuyện đã bị chặn');
          } else if (!isSelfAction && nowBlocked < wasBlocked) {
            notify.success('Đã được mở chặn');
          }
        }
        if ('messageBlockedByUserIds' in (data || {})) {
          blockStateLockUntilRef.current = 0;
          const was = conversationRaw.messageBlockedByUserIds?.length ?? 0;
          const now = data.messageBlockedByUserIds?.length ?? 0;
          const nextSelfBlocked = !!(userId && data.messageBlockedByUserIds?.includes(userId));
          setIsMessageBlocked(nextSelfBlocked);
          persistBlockOverride({
            blocked: isBlocked,
            messageBlocked: nextSelfBlocked,
            callBlocked: isCallBlocked,
          });
          if (!isSelfAction && now > was) {
            notify.error('Tin nhắn đã bị chặn');
          } else if (!isSelfAction && now < was) {
            notify.success('Đã được mở chặn tin nhắn');
          }
        }
        if ('callBlockedByUserIds' in (data || {})) {
          blockStateLockUntilRef.current = 0;
          const was = conversationRaw.callBlockedByUserIds?.length ?? 0;
          const now = data.callBlockedByUserIds?.length ?? 0;
          const nextSelfBlocked = !!(userId && data.callBlockedByUserIds?.includes(userId));
          setIsCallBlocked(nextSelfBlocked);
          persistBlockOverride({
            blocked: isBlocked,
            messageBlocked: isMessageBlocked,
            callBlocked: nextSelfBlocked,
          });
          if (!isSelfAction && now > was) {
            notify.error('Cuộc gọi đã bị chặn');
          } else if (!isSelfAction && now < was) {
            notify.success('Đã được mở chặn cuộc gọi');
          }
        }
        // Refresh conversations to get latest state
        loadConversations?.();
      }
    });
    return unsub;
  }, [conversationRaw?.id, conversationRaw?.blockedByUserIds, conversationRaw?.messageBlockedByUserIds, conversationRaw?.callBlockedByUserIds, conversationRaw?.backgroundUrl, userId, subscribe, loadConversations]);

  // ── Mute toggle ──
  const handleToggleMute = async () => {
    if (!conversationRaw?.id || !userId) return;
    try {
      await conversationsApi.toggleMute(conversationRaw.id, { userId });
      setIsMuted(!isMuted);
      notify.success(isMuted ? 'Đã bật thông báo' : 'Đã tắt thông báo');
      loadConversations?.();
    } catch {
      notify.error('Không thể thay đổi trạng thái thông báo');
    }
  };

  // ── Block ALL toggle (messages + calls) ──
  const handleToggleBlock = async () => {
    if (!conversationRaw?.id || !userId) return;
    const prev = { isBlocked, isMessageBlocked, isCallBlocked };
    const nextIsBlocked = !isBlocked;
    setIsBlocked(nextIsBlocked);
    setIsMessageBlocked(nextIsBlocked);
    setIsCallBlocked(nextIsBlocked);
    persistBlockOverride({
      blocked: nextIsBlocked,
      messageBlocked: nextIsBlocked,
      callBlocked: nextIsBlocked,
    });
    blockStateLockUntilRef.current = Date.now() + 1500;
    setBlockActionLoading(true);
    try {
      await conversationsApi.toggleBlockConversation(conversationRaw.id, userId);
      notify.success(isBlocked ? 'Đã mở chặn tất cả' : 'Đã chặn tất cả');
      loadConversations?.();
    } catch {
      setIsBlocked(prev.isBlocked);
      setIsMessageBlocked(prev.isMessageBlocked);
      setIsCallBlocked(prev.isCallBlocked);
      persistBlockOverride({
        blocked: prev.isBlocked,
        messageBlocked: prev.isMessageBlocked,
        callBlocked: prev.isCallBlocked,
      });
      notify.error('Không thể thay đổi trạng thái chặn');
    } finally {
      setBlockActionLoading(false);
    }
  };

  // ── Block Messages only ──
  const handleToggleBlockMessages = async () => {
    if (!conversationRaw?.id || !userId) return;
    const prev = isMessageBlocked;
    setIsMessageBlocked(!prev);
    persistBlockOverride({
      blocked: isBlocked,
      messageBlocked: !prev,
      callBlocked: isCallBlocked,
    });
    blockStateLockUntilRef.current = Date.now() + 1500;
    setBlockActionLoading(true);
    try {
      await conversationsApi.toggleBlockMessages(conversationRaw.id, userId);
      notify.success(isMessageBlocked ? 'Đã mở chặn tin nhắn' : 'Đã chặn tin nhắn');
      loadConversations?.();
    } catch {
      setIsMessageBlocked(prev);
      persistBlockOverride({
        blocked: isBlocked,
        messageBlocked: prev,
        callBlocked: isCallBlocked,
      });
      notify.error('Không thể thay đổi trạng thái chặn tin nhắn');
    } finally {
      setBlockActionLoading(false);
    }
  };

  // ── Block Calls only ──
  const handleToggleBlockCalls = async () => {
    if (!conversationRaw?.id || !userId) return;
    const prev = isCallBlocked;
    setIsCallBlocked(!prev);
    persistBlockOverride({
      blocked: isBlocked,
      messageBlocked: isMessageBlocked,
      callBlocked: !prev,
    });
    blockStateLockUntilRef.current = Date.now() + 1500;
    setBlockActionLoading(true);
    try {
      await conversationsApi.toggleBlockCalls(conversationRaw.id, userId);
      notify.success(isCallBlocked ? 'Đã mở chặn cuộc gọi' : 'Đã chặn cuộc gọi');
      loadConversations?.();
    } catch {
      setIsCallBlocked(prev);
      persistBlockOverride({
        blocked: isBlocked,
        messageBlocked: isMessageBlocked,
        callBlocked: prev,
      });
      notify.error('Không thể thay đổi trạng thái chặn cuộc gọi');
    } finally {
      setBlockActionLoading(false);
    }
  };

  // ── Update Nickname (Messenger-style: set nickname FOR the other person) ──
  const handleUpdateNickname = async () => {
    if (!conversationRaw?.id || !userId || !otherUserId) return;
    setUpdatingNickname(true);
    try {
      // userId in body = otherUserId (who we're nicknaming)
      // requesterId query param = current user (who is making the change)
      await conversationsApi.updateNickname(
        conversationRaw.id,
        { userId: otherUserId, payload: nicknameDraft.trim() },
        userId
      );
      setLocalNickname(nicknameDraft.trim() || conversation.name);
      notify.success('Đã cập nhật biệt danh');
      setShowNicknameModal(false);
      // Reload conversations so header and sidebar reflect new nickname
      loadConversations?.();
    } catch {
      notify.error('Không thể cập nhật biệt danh');
    } finally {
      setUpdatingNickname(false);
    }
  };

  // ── Update Background ──
  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !conversationRaw?.id) return;
    try {
      notify.success('Đang tải ảnh lên...');
      const uploadResult = await uploadApi.uploadFile(file);
      await conversationsApi.updateConversationBackground(conversationRaw.id, uploadResult.url, userId);
      notify.success('Đã cập nhật ảnh nền');
      // Triggers CONVERSATION_META_UPDATED via socket to refresh for both participants
      loadConversations?.();
    } catch {
      notify.error('Lỗi cập nhật ảnh nền');
    } finally {
      e.target.value = ''; // reset input
    }
  };

  // ── Remove Background ──
  const handleRemoveBackground = async () => {
    if (!conversationRaw?.id) return;
    setRemovingBackground(true);
    try {
      await conversationsApi.updateConversationBackground(conversationRaw.id, '', userId);
      notify.success('Đã gỡ ảnh nền');
      loadConversations?.();
    } catch {
      notify.error('Lỗi gỡ ảnh nền');
    } finally {
      setRemovingBackground(false);
    }
  };



  const profileLink = otherUserId ? `/profile/${otherUserId}` : `/profile/${conversation.id}`;
  const blockedByOtherAll = !!(otherUserId && conversationRaw?.blockedByUserIds?.includes(otherUserId));
  const blockedByOtherMessage = !!(otherUserId && conversationRaw?.messageBlockedByUserIds?.includes(otherUserId));
  const blockedByOtherCall = !!(otherUserId && conversationRaw?.callBlockedByUserIds?.includes(otherUserId));
  const hasAnyBlock = isBlocked || isMessageBlocked || isCallBlocked || blockedByOtherAll || blockedByOtherMessage || blockedByOtherCall;

  return (
    <div className="border-l border-gray-200/50 dark:border-white/5 bg-white overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full h-full md:w-[320px] md:h-full lg:w-85 shadow-sm flex flex-col">

      {/* Header close button */}
      <div className="flex items-center justify-end px-4 pt-3 pb-1">
        <button
          onClick={onCloseRightSidebar}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="text-center px-4 pb-5">
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
          style={{ backgroundColor: conversation.color }}
          onClick={() => navigate(profileLink)}
        >
          {otherUser?.avatar ? (
            <img src={otherUser.avatar} alt={conversation.name} className="w-full h-full object-cover" />
          ) : conversation.imageUrl ? (
            <img src={conversation.imageUrl} alt={conversation.name} className="w-full h-full object-cover" />
          ) : (
            conversation.avatar
          )}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{localNickname || conversation.name}</h3>
        <div className="flex items-center justify-center gap-1.5">
          <Circle
            className={`w-2.5 h-2.5 ${onlineStatus ? 'text-green-500 fill-green-500' : 'text-gray-300 fill-gray-300'}`}
          />
          <span className={`text-xs font-medium ${onlineStatus ? 'text-green-600' : 'text-gray-400'}`}>
            {onlineStatus ? t('messenger.activeNow') : 'Ngoại tuyến'}
          </span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-3 px-4 pb-5">
        <button
          onClick={() => navigate(profileLink)}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.sidebarProfile')}</span>
        </button>
        <button
          onClick={handleToggleMute}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isMuted ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-100 hover:bg-gray-200'
          }`}>
            {isMuted
              ? <BellOff className="w-5 h-5 text-amber-600" />
              : <Bell className="w-5 h-5 text-gray-600" />
            }
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {isMuted ? 'Đã tắt TB' : t('messenger.groupPanel.sidebarMute')}
          </span>
        </button>
        <button
          onClick={() => { onShowSearch(); onCloseRightSidebar(); }}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.searchInConversation')}</span>
        </button>
        <button
          onClick={onClearConversationForMe}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <span className="text-xs text-red-500 font-medium">Xoá chat</span>
        </button>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* ── User Info Section ── */}
      <div className="px-4 py-4 space-y-4 flex-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        ) : otherUser ? (
          <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-2.5">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Thông tin
            </h5>

            {otherUser.bio && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Giới thiệu</p>
                  <p className="text-sm text-gray-700 leading-snug">{otherUser.bio}</p>
                </div>
              </div>
            )}

            {otherUser.showEmail && otherUser.email && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.email}</p>
                </div>
              </div>
            )}

            {otherUser.showPhone && otherUser.phoneNumber && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-purple-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Số điện thoại</p>
                  <p className="text-sm text-gray-700">{otherUser.phoneNumber}</p>
                </div>
              </div>
            )}

            {otherUser.workPlace && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Nơi làm việc</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.workPlace}</p>
                </div>
              </div>
            )}

            {otherUser.education && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Học vấn</p>
                  <p className="text-sm text-gray-700 truncate">{otherUser.education}</p>
                </div>
              </div>
            )}

            {(otherUser.city || otherUser.country) && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium">Vị trí</p>
                  <p className="text-sm text-gray-700 truncate">
                    {[otherUser.city, otherUser.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!otherUser.bio && !otherUser.email && !otherUser.phoneNumber &&
              !otherUser.workPlace && !otherUser.education && !otherUser.city && (
              <p className="text-sm text-gray-400 text-center py-2">Chưa có thông tin</p>
            )}
          </section>
        ) : null}

        {/* ── Customize Chat ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t('messenger.groupPanel.customizeChat')}
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => {
                setNicknameDraft(localNickname || conversation.name);
                setShowNicknameModal(true);
              }}
              className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4 text-green-500" />
              </div>
              <span>Đổi biệt danh</span>
            </button>
            <label className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleBackgroundUpload}
                className="hidden"
              />
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-purple-500" />
              </div>
              <span>Đổi ảnh nền</span>
            </label>
            {conversationRaw?.backgroundUrl && (
              <>
                {/* Current background preview */}
                <div className="mx-2.5 mb-1 rounded-xl overflow-hidden border border-gray-200 relative group">
                  <img
                    src={conversationRaw.backgroundUrl}
                    alt="Ảnh nền hiện tại"
                    className="w-full h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-[10px] text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-0.5 rounded-full">
                      Ảnh nền hiện tại
                    </span>
                  </div>
                </div>
                {/* Remove background button */}
                <button
                  onClick={handleRemoveBackground}
                  disabled={removingBackground}
                  className="w-full p-2.5 rounded-xl hover:bg-red-50 transition-colors text-left text-sm text-red-500 font-medium flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    {removingBackground ? (
                      <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                    ) : (
                      <ImageOff className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span>{removingBackground ? 'Đang gỡ...' : 'Gỡ ảnh nền'}</span>
                </button>
              </>
            )}
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <span>{t('messenger.groupPanel.disappearingMessages')}</span>
            </button>
          </div>
        </section>

        {/* ── Photos & Videos ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {t('messenger.groupPanel.photosVideos')}
            </h4>
            <button className="text-xs text-blue-600 hover:underline font-medium">
              {t('messenger.groupPanel.seeAll')}
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {mediaMessages.length === 0 ? (
              <p className="col-span-3 text-xs text-gray-400 text-center py-2">Chưa có ảnh/video nào</p>
            ) : (
              mediaMessages.flatMap(m => m.attachments || [])
                .filter(a => a.type === 'image' || a.type === 'video')
                .slice(0, 9)
                .map((media, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity bg-gray-100">
                    {media.type === 'image' ? (
                      <img src={media.url} alt="media" className="w-full h-full object-cover" onClick={() => window.open(media.url, '_blank')} />
                    ) : (
                      <video src={media.url} className="w-full h-full object-cover" />
                    )}
                  </div>
                ))
            )}
          </div>
        </section>

        {/* ── Actions (Block / Report) ── */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-1">
          <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Quyền riêng tư
          </h5>

          {/* Block status banner */}
          {hasAnyBlock && (
            <div className="mb-2 p-2.5 rounded-xl bg-red-50 border border-red-100">
              <p className="text-[11px] font-semibold text-red-600 mb-1.5">Trạng thái chặn:</p>
              <div className="flex flex-wrap gap-1.5">
                {isBlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-medium">🚫 Bạn chặn tất cả</span>
                )}
                {isMessageBlocked && !isBlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-medium">💬 Bạn chặn tin nhắn</span>
                )}
                {isCallBlocked && !isBlocked && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-medium">📞 Bạn chặn cuộc gọi</span>
                )}
                {blockedByOtherAll && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium">⛔ Bạn đã bị chặn tất cả</span>
                )}
                {blockedByOtherMessage && !blockedByOtherAll && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium">⛔ Bạn đã bị chặn tin nhắn</span>
                )}
                {blockedByOtherCall && !blockedByOtherAll && (
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-medium">⛔ Bạn đã bị chặn cuộc gọi</span>
                )}
              </div>
            </div>
          )}

          {/* Block messages */}
          <button
            onClick={handleToggleBlockMessages}
            disabled={isBlocked || blockActionLoading}
            className={`w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm font-medium flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
              isMessageBlocked ? 'text-orange-600' : 'text-gray-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isMessageBlocked ? 'bg-orange-50' : 'bg-gray-100'
            }`}>
              <MessageSquareOff className={`w-4 h-4 ${isMessageBlocked ? 'text-orange-500' : 'text-gray-500'}`} />
            </div>
            <span>{isMessageBlocked ? 'Mở chặn tin nhắn' : 'Chặn tin nhắn'}</span>
          </button>

          {/* Block calls */}
          <button
            onClick={handleToggleBlockCalls}
            disabled={isBlocked || blockActionLoading}
            className={`w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm font-medium flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
              isCallBlocked ? 'text-purple-600' : 'text-gray-700'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isCallBlocked ? 'bg-purple-50' : 'bg-gray-100'
            }`}>
              <PhoneOff className={`w-4 h-4 ${isCallBlocked ? 'text-purple-500' : 'text-gray-500'}`} />
            </div>
            <span>{isCallBlocked ? 'Mở chặn cuộc gọi' : 'Chặn cuộc gọi'}</span>
          </button>

          {/* Block all */}
          <button
            onClick={handleToggleBlock}
            disabled={blockActionLoading}
            className={`w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm font-medium flex items-center gap-3 ${
              isBlocked ? 'text-red-600' : 'text-gray-700'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              isBlocked ? 'bg-red-50' : 'bg-orange-50'
            }`}>
              <ShieldOff className={`w-4 h-4 ${isBlocked ? 'text-red-500' : 'text-orange-500'}`} />
            </div>
            <span>{isBlocked ? 'Mở chặn tất cả' : 'Chặn tất cả'}</span>
          </button>

          <div className="h-px bg-gray-100 my-1" />

          {/* Report */}
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <span>Báo cáo</span>
          </button>
        </section>
      </div>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={otherUserId || conversation.id}
          targetType="user"
          targetName={conversation.name || 'Người dùng'}
        />
      )}

      {/* ── Nickname Modal ── */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNicknameModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-900">Đổi biệt danh</h3>
              </div>
              <button onClick={() => setShowNicknameModal(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500 mb-3">Mọi người trong đoạn chat sẽ thấy biệt danh mới.</p>
              <input
                autoFocus
                type="text"
                value={nicknameDraft}
                onChange={e => setNicknameDraft(e.target.value)}
                placeholder="Nhập biệt danh..."
                className="w-full px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm"
              />
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setShowNicknameModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={handleUpdateNickname}
                disabled={updatingNickname}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updatingNickname ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
