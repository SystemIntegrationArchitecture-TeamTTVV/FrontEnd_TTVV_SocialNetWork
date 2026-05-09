import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Smile, Pencil, Lock, Search as SearchIcon,
  Trash2, UserPlus, Crown, Shield,
  MessageSquareLock, UserCheck, X, Check, Users, Link2, Copy, Bot,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../../common/icons/IconComponents';
import type { Conversation } from '../../../apis/conversations';
import type { FriendDTO } from '../../../apis/friendRequests';
import { conversationsApi } from '../../../apis/conversations';
import { notify } from '../../../services/notify';

interface ActiveConversation {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  color: string;
  isGroup?: boolean;
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
  onToggleAiAssistant: (current: boolean) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  friendList: FriendDTO[];
  onInviteFriends: (ids: string[]) => void;
  // UI
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
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
  friendList,
  onInviteFriends,
  onShowSearch,
  onCloseRightSidebar,
  userId,
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
  const pendingJoins = pendingJoinsRaw || [];
  const isDisbanded = !!conversationRaw?.isDisbanded;

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

  return (
    <div className="border-l border-gray-200/50 dark:border-white/5 bg-white overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full md:w-[320px] lg:w-85 shadow-sm flex flex-col">

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
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: conversation.color }}
          onClick={() => navigate(`/profile/${conversation.id}`)}
        >
          {conversation.avatar}
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-0.5">{conversation.name}</h3>
        {isGroupChat && conversationRaw && (
          <p className="text-xs text-gray-500">
            {t('messenger.groupPanel.memberCount', { count: conversationRaw.participantIds.length })}
          </p>
        )}
        {!isGroupChat && conversation.online && (
          <p className="text-xs text-green-500 font-medium">{t('messenger.activeNow')}</p>
        )}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex justify-center gap-3 px-4 pb-5">
        <button
          onClick={() => navigate(`/profile/${conversation.id}`)}
          className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.sidebarProfile')}</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity">
          <div className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
          </div>
          <span className="text-xs text-gray-600 font-medium">{t('messenger.groupPanel.sidebarMute')}</span>
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
        {!isAIChat && (
          isGroupChat ? (
            isOwner ? (
              <button onClick={onDisbandGroup} disabled={isDisbanded} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-xs text-red-500 font-medium">Giải tán nhóm</span>
              </button>
            ) : !isDisbanded ? (
              <button onClick={() => userId && onRemoveMember(userId)} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity">
                <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-xs text-red-500 font-medium">{t('messenger.groupPanel.leave')}</span>
              </button>
            ) : null
          ) : (
            <button onClick={onClearConversationForMe} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs text-red-500 font-medium">{t('messenger.groupPanel.leave')}</span>
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
        <div className="flex-1 px-4 py-4 space-y-4">
          
          {isDisbanded && (
            <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center">
              <span className="font-semibold text-sm">Nhóm này đã được giải tán</span>
            </div>
          )}

          {/* Group Info (editable) — only for admins/owner */}
          {!isDisbanded && canManageGroup && (
            <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('messenger.groupPanel.groupInfo')}
              </h5>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">{t('messenger.groupPanel.groupName')}</label>
                <input
                  type="text"
                  value={groupNameDraft}
                  onChange={(e) => onGroupNameChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                  placeholder={t('messenger.groupPanel.groupNamePlaceholder')}
                  disabled={updatingGroup}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">{t('messenger.groupPanel.groupAvatarUrl')}</label>
                <input
                  type="text"
                  value={groupAvatarDraft}
                  onChange={(e) => onGroupAvatarChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                  placeholder={t('messenger.groupPanel.groupAvatarPlaceholder')}
                  disabled={updatingGroup}
                />
              </div>
              <button
                onClick={onSaveGroupMeta}
                disabled={updatingGroup}
                className="w-full h-10 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-60 shadow-sm"
              >
                {updatingGroup ? t('messenger.groupPanel.saving') : t('messenger.groupPanel.saveInfo')}
              </button>
            </section>
          )}

          {/* Group Permissions — only for admins/owner */}
          {!isDisbanded && canManageGroup && (
            <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('messenger.groupPanel.permissionsTitle', 'Quyá» n nhÃ³m')}
              </h5>

              {/* Require approval toggle */}
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                  </div>
                  <span className="text-sm text-gray-700 leading-snug">
                    {t('messenger.groupPanel.requireApproval')}
                  </span>
                </div>
                <Toggle
                  checked={!!conversationRaw.approvalsRequired}
                  onChange={() => onToggleRequireApproval(!!conversationRaw.approvalsRequired)}
                  disabled={updatingGroup}
                />
              </div>

              {/* Only admins can send toggle */}
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <MessageSquareLock className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-700 leading-snug">
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
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700 leading-snug block">
                      {t('messenger.groupPanel.aiAssistant', 'Trợ lý AI (@ZalaBot)')}
                    </span>
                    <span className="text-xs text-gray-400 leading-snug">
                      {t('messenger.groupPanel.aiAssistantHint', 'Mention @ZalaBot để hỏi AI trong nhóm')}
                    </span>
                  </div>
                </div>
                <Toggle
                  checked={!!conversationRaw.aiAssistantEnabled}
                  onChange={() => onToggleAiAssistant(!!conversationRaw.aiAssistantEnabled)}
                  disabled={updatingGroup}
                />
              </div>

              {isOwner && (
                <div className="pt-2 border-t border-red-100 mt-1">
                  <div className="flex items-center justify-between gap-3 py-1">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">
                          {t('messenger.groupPanel.clearGroupHistory')}
                        </p>
                        <p className="text-xs text-gray-500 leading-snug mt-0.5">
                          {t('messenger.groupPanel.clearGroupHistoryHint')}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClearGroupHistory}
                      disabled={updatingGroup}
                      className="h-8 px-3 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {t('messenger.groupPanel.clearGroupHistory')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {!isDisbanded && (
            <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Link tham gia nhom
              </h5>
              <p className="text-xs text-gray-500 leading-relaxed">
                Tat ca thanh vien deu thay link nay. Nguoi chua vao nhom bam link se tu dong tham gia hoac vao danh sach cho phe duyet.
              </p>

              <div className="flex items-center gap-2">
                <div className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 flex items-center overflow-hidden">
                  <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mr-2" />
                  <span className="truncate">
                    {inviteLinkLoading ? 'Dang tao link...' : (inviteLink || 'Chua tao duoc link')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (!inviteLink) return;
                    try {
                      await navigator.clipboard.writeText(inviteLink);
                      notify.success('Da sao chep link tham gia nhom');
                    } catch {
                      notify.error('Khong the sao chep link');
                    }
                  }}
                  disabled={!inviteLink || inviteLinkLoading}
                  className="h-10 px-3 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  title="Sao chep link"
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
          <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
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
                  <div key={pid} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white transition-colors group">
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
                    {!isDisbanded && canKick && (
                      <button
                        onClick={() => onRemoveMember(pid)}
                        disabled={updatingGroup}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${isSelf
                            ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                            : 'bg-red-50 text-red-600 hover:bg-red-100 opacity-0 group-hover:opacity-100'
                          }`}
                      >
                        {isSelf ? t('messenger.groupPanel.leave') : t('messenger.groupPanel.remove')}
                      </button>
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
                            onClick={() => toggleFriend(f.friendId)}
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
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                              }`}>
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
                    pendingJoins.map((pid) => (
                      <div key={pid} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MemberAvatar name={pid} color={colorFromId(pid)} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{pid}</p>
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
                    ))
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
            <section className="mt-4 p-3 rounded-2xl border border-amber-100 bg-amber-50/60">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Chuyển quyền trưởng nhóm</h4>
              </div>
              <select
                value={transferOwnerId}
                onChange={(e) => setTransferOwnerId(e.target.value)}
                className="w-full text-sm rounded-xl border border-amber-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300 mb-2"
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
                className="w-full py-2 rounded-xl text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

      {/* Customize Chat */}
      <div className="px-4 py-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('messenger.groupPanel.customizeChat')}</h4>
          <div className="space-y-1">
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-purple-500" />
              </div>
              <span>{t('messenger.groupPanel.changeTheme')}</span>
            </button>
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                <Smile className="w-4 h-4 text-yellow-500" />
              </div>
              <span>{t('messenger.groupPanel.changeEmoji')}</span>
            </button>
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Pencil className="w-4 h-4 text-green-500" />
              </div>
              <span>{t('messenger.groupPanel.changeName')}</span>
            </button>
            <button className="w-full p-2.5 rounded-xl hover:bg-white transition-colors text-left text-sm text-gray-700 font-medium flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <span>{t('messenger.groupPanel.disappearingMessages')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Media */}
      <div className="px-4 pb-4">
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('messenger.groupPanel.photosVideos')}</h4>
            <button className="text-xs text-blue-600 hover:underline font-medium">{t('messenger.groupPanel.seeAll')}</button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <LargeBeachPlaceholder className="w-full h-full" />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <LargeSunPlaceholder className="w-full h-full" />
            </div>
            <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
              <LargePartyPlaceholder className="w-full h-full" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
