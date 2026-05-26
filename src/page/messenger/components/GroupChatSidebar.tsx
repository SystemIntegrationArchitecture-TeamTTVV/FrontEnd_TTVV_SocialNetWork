import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Search as SearchIcon,
  Trash2, UserPlus, Crown, Shield,
  MessageSquareLock, UserCheck, X, Check, Users, Link2, Copy, Bot, Image as ImageIcon, Loader2
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import type { Conversation } from '../../../apis/conversations';
import type { FriendDTO } from '../../../apis/friendRequests';
import { conversationsApi } from '../../../apis/conversations';
import { messagesApi, type Message } from '../../../apis/messages';
import { uploadApi } from '../../../apis/upload';
import { usersApi, type User as AppUser } from '../../../apis/users';
import { notify } from '../../../services/notify';

interface ActiveConversation {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  color: string;
  isGroup?: boolean;
  otherParticipantId?: string;
}

interface ChatInfoSidebarProps {
  conversation: ActiveConversation;
  conversationRaw: Conversation | null;
  isGroupChat: boolean;
  isAIChat: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  canManageGroup: boolean;
  // Group state
  groupNameDraft: string;
  onGroupNameChange: (v: string) => void;
  groupAvatarDraft: string;
  onGroupAvatarChange: (v: string) => void;
  groupActionMessage: string | null;
  groupActionError: string | null;
  updatingGroup: boolean;
  pendingJoins: string[];
  // Handlers
  onSaveGroupMeta: () => void;
  onRemoveMember: (memberId: string) => void;
  onJoinRequestDecision: (userId: string, accept: boolean) => void;
  onDisbandGroup: () => void;

  onClearConversationForMe: () => void;
  onClearGroupHistory: () => void;
  onToggleRequireApproval: (current: boolean) => void;
  onToggleOnlyAdminsCanSend: (current: boolean) => void;
  onToggleAiAssistant?: (current: boolean) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  onToggleAdmin: (memberId: string, isAdmin: boolean) => void;
  friendList: FriendDTO[];
  onInviteFriends: (ids: string[]) => void;
  // UI
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
  onViewProfile?: (userId: string, userName: string) => void;
}

/** Small toggle switch component */
function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${checked ? 'bg-blue-500' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'
          }`}
      />
    </button>
  );
}

/** Colored initials avatar */
function MemberAvatar({ name, color }: { name: string; color: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';
  return (
    <div
      className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}

const COLORS = [
  '#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444',
];
function colorFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function GroupChatSidebar({
  conversation,
  conversationRaw,
  isGroupChat,
  isAIChat,
  isOwner,
  isAdmin,
  canManageGroup,
  groupNameDraft,
  onGroupNameChange,
  groupAvatarDraft,
  onGroupAvatarChange,
  groupActionMessage,
  groupActionError,
  updatingGroup,
  pendingJoins: pendingJoinsRaw,
  onSaveGroupMeta,
  onRemoveMember,
  onJoinRequestDecision,
  onDisbandGroup,

  onClearConversationForMe,
  onClearGroupHistory,
  onToggleRequireApproval,
  onToggleOnlyAdminsCanSend,
  onToggleAiAssistant,
  onTransferOwnership,
  onToggleAdmin,
  friendList,
  onInviteFriends,
  onShowSearch,
  onCloseRightSidebar,
  userId,
  onViewProfile,
}: ChatInfoSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transferOwnerId, setTransferOwnerId] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [inviteLinkLoading, setInviteLinkLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ pid: string; x: number; y: number } | null>(null);
  const [mediaMessages, setMediaMessages] = useState<Message[]>([]);
  const [pendingUsersById, setPendingUsersById] = useState<Record<string, AppUser>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingJoins = pendingJoinsRaw || [];
  const isDisbanded = !!conversationRaw?.isDisbanded;
  
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      const res = await uploadApi.uploadFile(file);
      onGroupAvatarChange(res.url);
      notify.success('Tải ảnh lên thành công');
    } catch (error) {
      notify.error('Lỗi khi tải ảnh lên');
      console.error(error);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadInviteLink = async () => {
      if (!isGroupChat || !conversationRaw?.id || !userId || isDisbanded) {
        setInviteLink('');
        return;
      }

      setInviteLinkLoading(true);
      try {
        const token = await conversationsApi.getInviteLink(conversationRaw.id, userId);
        if (cancelled) return;
        setInviteLink(`${window.location.origin}/messenger?inviteToken=${encodeURIComponent(token)}`);
      } catch (error) {
        if (cancelled) return;
        setInviteLink('');
        console.error('Failed to load invite link', error);
      } finally {
        if (!cancelled) setInviteLinkLoading(false);
      }
    };

    void loadInviteLink();

    return () => {
      cancelled = true;
    };
  }, [isGroupChat, conversationRaw?.id, userId, isDisbanded]);

  useEffect(() => {
    const unresolvedIds = pendingJoins.filter((id) => {
      if (pendingUsersById[id]) return false;
      return !friendList.some((f) => f.friendId === id && (f.friendName || f.friendAvatar));
    });
    if (unresolvedIds.length === 0) return;

    let cancelled = false;
    const fetchPendingUsers = async () => {
      const results = await Promise.allSettled(unresolvedIds.map((id) => usersApi.getUserById(id)));
      if (cancelled) return;

      const next: Record<string, AppUser> = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value?.id) {
          next[r.value.id] = r.value;
        }
      });
      if (Object.keys(next).length > 0) {
        setPendingUsersById((prev) => ({ ...prev, ...next }));
      }
    };

    fetchPendingUsers().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pendingJoins, pendingUsersById, friendList]);

  return (
    <div className="border-l border-gray-200/50 dark:border-white/5 bg-white overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full h-full md:w-[320px] md:h-full lg:w-85 shadow-sm flex flex-col">

      {/* Header banner + avatar */}
      <div className="relative">
        {/* Color banner */}
        <div
          className="h-20 w-full"
          style={{ backgroundColor: conversation.color }}
        />
        {/* Close button */}
        <button
          onClick={onCloseRightSidebar}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/30 hover:bg-white/50 text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        {/* Avatar overlapping banner */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '44px' }}>
          {conversationRaw?.groupAvatar ? (
            <img
              src={conversationRaw.groupAvatar}
              alt={conversation.name}
              className="w-16 h-16 rounded-full border-4 border-white object-cover shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => navigate(`/profile/${conversation.id}`)}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              style={{ backgroundColor: conversation.color }}
              onClick={() => navigate(`/profile/${conversation.id}`)}
            >
              {conversation.avatar}
            </div>
          )}
        </div>
      </div>

      {/* Name + member count */}
      <div className="text-center pt-10 pb-3 px-4">
        <h3 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight">{conversation.name}</h3>
        {isGroupChat && conversationRaw && (
          <p className="text-sm text-gray-500 font-medium">
            {t('messenger.groupPanel.memberCount', { count: conversationRaw.participantIds.length })} thành viên
          </p>
        )}
        {!isGroupChat && conversation.online && (
          <p className="text-sm text-green-500 font-medium">{t('messenger.activeNow')}</p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-4 px-4 pb-4">
        <button
          onClick={() => navigate(`/profile/${conversation.id}`)}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group"
        >
          <div className="w-11 h-11 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-100">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[12px] text-gray-700 font-medium leading-tight text-center">Trang cá<br/>nhân</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group">
          <div className="w-11 h-11 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-100">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-[12px] text-gray-700 font-medium leading-tight text-center">Tắt<br/>thông báo</span>
        </button>
        <button
          onClick={() => { onShowSearch(); onCloseRightSidebar(); }}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group"
        >
          <div className="w-11 h-11 rounded-full bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors shadow-sm border border-gray-100">
            <SearchIcon className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-[12px] text-gray-700 font-medium leading-tight text-center">Tìm trong<br/>trò chuyện</span>
        </button>
        {!isAIChat && (
          isGroupChat ? (
            isOwner ? (
              <button onClick={onDisbandGroup} disabled={isDisbanded} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed group">
                <div className="w-11 h-11 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm border border-red-50">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-[12px] text-red-600 font-medium leading-tight text-center">Giải tán<br/>nhóm</span>
              </button>
            ) : !isDisbanded ? (
              <button onClick={() => userId && onRemoveMember(userId)} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group">
                <div className="w-11 h-11 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm border border-red-50">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-[12px] text-red-600 font-medium leading-tight text-center">{t('messenger.groupPanel.leave', 'Rời nhóm')}</span>
              </button>
            ) : null
          ) : (
            <button onClick={onClearConversationForMe} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity group">
              <div className="w-11 h-11 rounded-full bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm border border-red-50">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-[12px] text-red-600 font-medium leading-tight text-center">{t('messenger.groupPanel.leave', 'Rời nhóm')}</span>
            </button>
          )
        )}
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Feedback banners */}
      {(groupActionMessage || groupActionError) && (
        <div className="px-4 pt-3">
          {groupActionMessage && (
            <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs border border-green-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              {groupActionMessage}
            </div>
          )}
          {groupActionError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              {groupActionError}
            </div>
          )}
        </div>
      )}

      {/* ── GROUP MANAGEMENT SECTION ── */}
      {isGroupChat && conversationRaw && (
        <div className="flex-1 px-3 py-2 space-y-2.5">
          
          {isDisbanded && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
              <span className="font-semibold text-sm">Nhóm này đã được giải tán</span>
            </div>
          )}

          {/* Group Info (editable) — only for admins/owner */}
          {!isDisbanded && canManageGroup && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              <h5 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
                THÔNG TIN NHÓM
              </h5>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-gray-600">Tên nhóm</label>
                  <input
                    type="text"
                    value={groupNameDraft}
                    onChange={(e) => onGroupNameChange(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[13px] font-medium text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400"
                    placeholder="Nhập tên nhóm..."
                    disabled={updatingGroup}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-semibold text-gray-600">Avatar nhóm (chọn ảnh)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={groupAvatarDraft}
                      onChange={(e) => onGroupAvatarChange(e.target.value)}
                      className="flex-1 h-10 px-3.5 rounded-xl bg-white border border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-[13px] font-medium text-gray-800 transition-all placeholder:font-normal placeholder:text-gray-400"
                      placeholder="URL hoặc upload ảnh..."
                      disabled={updatingGroup || uploadingAvatar}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={updatingGroup || uploadingAvatar}
                      className="h-10 px-3 shrink-0 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center justify-center"
                      title="Tải ảnh lên"
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
              <button
                onClick={onSaveGroupMeta}
                disabled={updatingGroup}
                className="w-full h-10 mt-1 rounded-xl bg-[#1a66ff] text-white text-[13px] font-bold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {updatingGroup ? t('messenger.groupPanel.saving', 'Đang lưu...') : t('messenger.groupPanel.saveInfo', 'Lưu thông tin nhóm')}
              </button>
            </section>
          )}

          {/* Group Permissions — only for admins/owner */}
          {!isDisbanded && canManageGroup && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
              <h5 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide pb-2">
                QUYỀN NHÓM
              </h5>

              {/* Require approval toggle */}
              <div className="flex items-center justify-between gap-3 py-2 group hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-[13px] text-gray-700 leading-snug">
                    {t('messenger.groupPanel.requireApproval', 'Yêu cầu phê duyệt khi có người tham gia')}
                  </span>
                </div>
                <Toggle
                  checked={!!conversationRaw.approvalsRequired}
                  onChange={() => onToggleRequireApproval(!!conversationRaw.approvalsRequired)}
                  disabled={updatingGroup}
                />
              </div>

              {/* Only admins can send toggle */}
              <div className="flex items-center justify-between gap-3 py-2 group hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <MessageSquareLock className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-[13px] text-gray-700 leading-snug">
                    {t('messenger.groupPanel.onlyAdminsCanSend', 'Chỉ trưởng/phó nhóm được gửi tin')}
                  </span>
                </div>
                <Toggle
                  checked={!!conversationRaw.onlyAdminsCanSend}
                  onChange={() => onToggleOnlyAdminsCanSend(!!conversationRaw.onlyAdminsCanSend)}
                  disabled={updatingGroup}
                />
              </div>

              {/* AI Assistant toggle */}
              <div className="flex items-center justify-between gap-3 py-2 group hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                    <Bot className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[13px] text-gray-700 leading-snug block">
                      {t('messenger.groupPanel.aiAssistant', 'Trợ lý AI (@ZalaBot)')}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-snug mt-0.5 block">
                      {t('messenger.groupPanel.aiAssistantHint', 'Mention @ZalaBot để hỏi AI trong nhóm')}
                    </span>
                  </div>
                </div>
                <Toggle
                  checked={!!conversationRaw.aiAssistantEnabled}
                  onChange={() => onToggleAiAssistant?.(!!conversationRaw.aiAssistantEnabled)}
                  disabled={updatingGroup}
                />
              </div>

              {isOwner && (
                <div className="pt-2 mt-2 border-t border-red-50">
                  <div className="flex items-center justify-between gap-3 py-2 group hover:bg-red-50 -mx-2 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] text-gray-700 leading-snug">
                          Xóa lịch sử nhóm
                        </p>
                        <p className="text-[11px] text-gray-400 leading-snug mt-0.5">
                          Chỉ trưởng nhóm mới có quyền xóa toàn bộ tin nhắn trong đoạn chat.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClearGroupHistory}
                      disabled={updatingGroup}
                      className="h-8 px-3 rounded-full bg-[#ff3333] text-white text-[12px] font-bold hover:bg-red-700 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shrink-0 transition-all"
                    >
                      Xóa lịch sử
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {!isDisbanded && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <h5 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">
                LINK THAM GIA NHÓM
              </h5>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                Tất cả thành viên đều thấy link này. Người chưa vào nhóm bấm link sẽ tự động tham gia hoặc vào danh sách chờ phê duyệt.
              </p>

              <div className="flex items-center gap-2 mt-2">
                <div className="h-10 flex-1 rounded-full border border-gray-200 bg-white px-4 text-xs text-gray-700 flex items-center overflow-hidden">
                  <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mr-2" />
                  <span className="truncate">
                    {inviteLinkLoading ? 'Đang tạo link...' : (inviteLink || 'Chưa tạo được link')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!inviteLink) return;
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      notify.success('Đã sao chép link tham gia nhóm');
                    } catch {
                      notify.error('Không thể sao chép link');
                    }
                  }}
                  disabled={!inviteLink || inviteLinkLoading}
                  className="h-10 w-10 shrink-0 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transition-colors"
                  title="Sao chép link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* Pending Join Requests — badge button for admin/owner, opens popup */}
          {!isDisbanded && canManageGroup && pendingJoins.length > 0 && (
            <button
              onClick={() => setPendingOpen(true)}
              className="w-full flex items-center gap-2 p-3 rounded-2xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-amber-800">Phê duyệt tham gia</p>
                <p className="text-xs text-amber-600">{pendingJoins.length} người đang chờ duyệt</p>
              </div>
              <span className="min-w-5.5 h-5.5 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center px-1.5">
                {pendingJoins.length}
              </span>
            </button>
          )}

          {/* Members List */}
          <section className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <h5 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                {t('messenger.groupPanel.membersTitle')}
              </h5>
              {/* Invite button: visible to all members in the group */}
              {!isDisbanded && (
                <button
                  onClick={() => { setInviteOpen(true); setInviteSearch(''); setSelectedFriendIds([]); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Mời bạn bè
                </button>
              )}
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto -mx-1 px-1">
              {conversationRaw.participantIds.map((pid, idx) => {
                const name = conversationRaw.participantNames?.[idx] || pid;
                const isMemberOwner = pid === conversationRaw.ownerId;
                const isMemberAdmin = conversationRaw.adminIds?.includes(pid);
                const isSelf = pid === userId;
                const canKick = isSelf || (isOwner && !isMemberOwner) || (isAdmin && !isOwner && !isMemberOwner && !isMemberAdmin);

                return (
                  <div 
                    key={pid} 
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors group cursor-pointer"
                    onClick={() => onViewProfile?.(pid, name)}
                  >
                    <MemberAvatar name={name} color={colorFromId(pid)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                      {isMemberOwner && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 font-medium">{t('messenger.groupPanel.ownerBadge')}</span>
                        </div>
                      )}
                      {isMemberAdmin && !isMemberOwner && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Shield className="w-3 h-3 text-blue-500" />
                          <span className="text-xs text-blue-600 font-medium">{t('messenger.groupPanel.adminBadge')}</span>
                        </div>
                      )}
                    </div>
                    {!isDisbanded && (
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOwner && !isMemberOwner && (
                          <div className="relative dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const rect = e.currentTarget.getBoundingClientRect();
                                setContextMenu({ pid, x: rect.left, y: rect.bottom });
                              }}
                              className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                              Sửa
                            </button>
                            {contextMenu?.pid === pid && (
                              <div
                                className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isMemberAdmin ? (
                                  <button
                                    onClick={() => { onToggleAdmin(pid, false); setContextMenu(null); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    Hủy tư cách phó nhóm
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { onToggleAdmin(pid, true); setContextMenu(null); }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    Bổ nhiệm phó nhóm
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    if (window.confirm('Chuyển quyền trưởng nhóm cho người này?')) {
                                      onTransferOwnership(pid);
                                    }
                                    setContextMenu(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                >
                                  Chuyển quyền trưởng nhóm
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {canKick && (
                          <button
                            onClick={() => onRemoveMember(pid)}
                            disabled={updatingGroup}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${isSelf
                                ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 opacity-100'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                              }`}
                          >
                            {isSelf ? t('messenger.groupPanel.leave') : t('messenger.groupPanel.remove')}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Invite Friends Modal ── */}
          {inviteOpen && (() => {
            const memberSet = new Set(conversationRaw.participantIds);
            const invitable = friendList.filter(
              (f) => !memberSet.has(f.friendId)
            );
            const filtered = invitable.filter((f) =>
              (f.friendName ?? f.friendId).toLowerCase().includes(inviteSearch.toLowerCase())
            );
            const toggleFriend = (id: string) =>
              setSelectedFriendIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              );
            return (
              <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setInviteOpen(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <h3 className="text-base font-semibold text-gray-900">Mời bạn bè vào nhóm</h3>
                    </div>
                    <button onClick={() => setInviteOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 border border-gray-200">
                      <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <input
                        autoFocus
                        value={inviteSearch}
                        onChange={(e) => setInviteSearch(e.target.value)}
                        placeholder="Tìm bạn bè..."
                        className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Approval notice: shown to regular members (their invites always go to pending) */}
                  {!canManageGroup && (
                    <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-700 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      Người được mời sẽ vào danh sách chờ duyệt của admin
                    </div>
                  )}

                  {/* Friend list */}
                  <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
                    {filtered.length === 0 ? (
                      <p className="text-center text-sm text-gray-400 py-8">
                        {inviteSearch ? 'Không tìm thấy bạn bè' : 'Tất cả bạn bè đã trong nhóm'}
                      </p>
                    ) : (
                      filtered.map((f) => {
                        const isSelected = selectedFriendIds.includes(f.friendId);
                        return (
                            <button
                              key={f.friendId}
                              onClick={() => {
                                if (onViewProfile) {
                                  onViewProfile(f.friendId, f.friendName ?? f.friendId);
                                } else {
                                  toggleFriend(f.friendId);
                                }
                              }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                                }`}
                            >
                              {f.friendAvatar ? (
                                <img src={f.friendAvatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                              ) : (
                                <MemberAvatar name={f.friendName ?? f.friendId} color={colorFromId(f.friendId)} />
                              )}
                              <span className="flex-1 text-sm font-medium text-gray-800 text-left truncate">
                                {f.friendName ?? f.friendId}
                              </span>
                              <div 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFriend(f.friendId);
                                }}
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </button>
                        );
                      })
                    )}
                  </div>

                  {/* Footer */}
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 flex gap-2">
                    <button
                      onClick={() => setInviteOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                    >
                      Huỷ
                    </button>
                    <button
                      disabled={selectedFriendIds.length === 0 || updatingGroup}
                      onClick={() => {
                        onInviteFriends(selectedFriendIds);
                        setInviteOpen(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updatingGroup ? 'Đang mời…' : `Mời${selectedFriendIds.length > 0 ? ` (${selectedFriendIds.length})` : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── Pending Approvals Modal ── */}
          {pendingOpen && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPendingOpen(false)}>
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-semibold text-gray-900">Phê duyệt tham gia nhóm</h3>
                  </div>
                  <button onClick={() => setPendingOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {pendingJoins.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-8">Không có yêu cầu nào</p>
                  ) : (
                    pendingJoins.map((pid) => {
                      const friend = friendList.find((f) => f.friendId === pid);
                      const fetched = pendingUsersById[pid];
                      const displayName = friend?.friendName || fetched?.fullName || fetched?.username || pid;
                      const avatarUrl = friend?.friendAvatar || fetched?.avatar;
                      return (
                      <div key={pid} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          ) : (
                            <MemberAvatar name={displayName} color={colorFromId(pid)} />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-amber-600">Chờ phê duyệt</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => { onJoinRequestDecision(pid, true); if (pendingJoins.length <= 1) setPendingOpen(false); }}
                            disabled={updatingGroup}
                            className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 transition-colors"
                            title="Chấp nhận"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { onJoinRequestDecision(pid, false); if (pendingJoins.length <= 1) setPendingOpen(false); }}
                            disabled={updatingGroup}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:opacity-60 transition-colors"
                            title="Từ chối"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setPendingOpen(false)}
                    className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Ownership — owner only */}
          {!isDisbanded && isOwner && conversationRaw && (
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-amber-500" />
                </div>
                <h4 className="text-[13px] font-bold text-gray-800 uppercase tracking-wide">CHUYỂN QUYỀN TRƯỞNG NHÓM</h4>
              </div>
              <select
                value={transferOwnerId}
                onChange={(e) => setTransferOwnerId(e.target.value)}
                className="w-full h-10 text-[13px] rounded-xl border border-gray-200 bg-white px-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              >
                <option value="">-- Chọn thành viên --</option>
                {(conversationRaw.participantIds || []).map((pid, idx) => {
                  if (pid === userId) return null;
                  const name = conversationRaw.participantNames?.[idx] || pid;
                  return <option key={pid} value={pid}>{name}</option>;
                })}
              </select>
              <button
                disabled={!transferOwnerId || updatingGroup}
                onClick={() => {
                  if (!transferOwnerId) return;
                  onTransferOwnership(transferOwnerId);
                  setTransferOwnerId('');
                }}
                className="w-full h-10 rounded-xl text-[13px] font-semibold text-white bg-[#ffb74d] hover:bg-[#ffa726] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updatingGroup ? 'Đang xử lý…' : 'Xác nhận chuyển quyền'}
              </button>
            </section>
          )}

        </div>
      )}

      {/* â”€â”€ NON-GROUP SECTIONS â”€â”€ */}
      {!isGroupChat && (
        <div className="flex-1" />
      )}

      <div className="h-px bg-gray-100 mx-4" />


      {/* Media */}
      <div className="px-3 pb-3">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{t('messenger.groupPanel.photosVideos')}</h4>
            <button className="text-xs text-blue-600 hover:underline font-medium">{t('messenger.groupPanel.seeAll')}</button>
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
        </div>
      </div>

    </div>
  );
}
