// â”€â”€â”€ ChatInfoSidebar â€” right sidebar with profile, group management, media â”€â”€
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Smile, Pencil, Lock, Search as SearchIcon,
  Trash2, UserPlus, Crown, Shield,
  MessageSquareLock, UserCheck, X,
} from 'lucide-react';
import { useState } from 'react';
import { LargeBeachPlaceholder, LargeSunPlaceholder, LargePartyPlaceholder } from '../../../common/icons/IconComponents';
import type { Conversation } from '../../../apis/conversations';

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
  groupMemberInput: string;
  onGroupMemberInputChange: (v: string) => void;
  groupActionMessage: string | null;
  groupActionError: string | null;
  updatingGroup: boolean;
  pendingJoins: string[];
  // Handlers
  onSaveGroupMeta: () => void;
  onAddMembers: () => void;
  onRemoveMember: (memberId: string) => void;
  onJoinRequestDecision: (userId: string, accept: boolean) => void;

  onClearConversationForMe: () => void;
  onToggleRequireApproval: (current: boolean) => void;
  onToggleOnlyAdminsCanSend: (current: boolean) => void;
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
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
        checked ? 'bg-blue-500' : 'bg-gray-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
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
  '#6366f1','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444',
];
function colorFromId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export default function ChatInfoSidebar({
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
  groupMemberInput,
  onGroupMemberInputChange,
  groupActionMessage,
  groupActionError,
  updatingGroup,
  pendingJoins,
  onSaveGroupMeta,
  onAddMembers,
  onRemoveMember,
  onJoinRequestDecision,

  onClearConversationForMe,
  onToggleRequireApproval,
  onToggleOnlyAdminsCanSend,
  onShowSearch,
  onCloseRightSidebar,
  userId,
}: ChatInfoSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [addMemberMode, setAddMemberMode] = useState(false);

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
          <button onClick={onClearConversationForMe} className="flex flex-col items-center gap-1.5 hover:opacity-80 transition-opacity">
            <div className="w-12 h-12 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-xs text-red-500 font-medium">{t('messenger.groupPanel.leave')}</span>
          </button>
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

      {/* â”€â”€ GROUP MANAGEMENT SECTION â”€â”€ */}
      {isGroupChat && conversationRaw && (
        <div className="flex-1 px-4 py-4 space-y-4">

          {/* Group Info (editable) â€” only for admins/owner */}
          {canManageGroup && (
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

          {/* Group Permissions â€” only for admins/owner */}
          {canManageGroup && (
            <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('messenger.groupPanel.permissionsTitle', 'Quyá»n nhÃ³m')}
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
                    {t('messenger.groupPanel.onlyAdminsCanSend', 'Chá»‰ trÆ°á»Ÿng/phÃ³ nhÃ³m Ä‘Æ°á»£c gá»­i tin')}
                  </span>
                </div>
                <Toggle
                  checked={!!conversationRaw.onlyAdminsCanSend}
                  onChange={() => onToggleOnlyAdminsCanSend(!!conversationRaw.onlyAdminsCanSend)}
                  disabled={updatingGroup}
                />
              </div>
            </section>
          )}

          {/* Pending Join Requests */}
          {canManageGroup && conversationRaw.approvalsRequired && pendingJoins.length > 0 && (
            <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4 space-y-2">
              <h5 className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                {t('messenger.groupPanel.joinRequestsTitle', { count: pendingJoins.length })}
              </h5>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {pendingJoins.map((pid) => (
                  <div key={pid} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-amber-100 shadow-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <MemberAvatar name={pid} color={colorFromId(pid)} />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{pid}</p>
                        <p className="text-xs text-amber-600">{t('messenger.groupPanel.pendingApproval')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onJoinRequestDecision(pid, true)}
                        disabled={updatingGroup}
                        className="px-2.5 py-1 rounded-lg text-xs bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 font-medium transition-colors"
                      >
                        {t('messenger.groupPanel.accept')}
                      </button>
                      <button
                        onClick={() => onJoinRequestDecision(pid, false)}
                        disabled={updatingGroup}
                        className="px-2.5 py-1 rounded-lg text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:opacity-60 font-medium transition-colors"
                      >
                        {t('messenger.groupPanel.reject')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Members List */}
          <section className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {t('messenger.groupPanel.membersTitle')}
              </h5>
              {canManageGroup && (
                <button
                  onClick={() => setAddMemberMode((v) => !v)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t('messenger.groupPanel.addMembers')}
                </button>
              )}
            </div>

            {/* Add member input */}
            {canManageGroup && addMemberMode && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={groupMemberInput}
                  onChange={(e) => onGroupMemberInputChange(e.target.value)}
                  placeholder={t('messenger.groupPanel.addMembersPrompt')}
                  disabled={updatingGroup}
                  className="flex-1 h-9 px-3 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs shadow-sm disabled:opacity-60"
                  onKeyDown={(e) => { if (e.key === 'Enter') { onAddMembers(); setAddMemberMode(false); } }}
                />
                <button
                  onClick={() => { onAddMembers(); setAddMemberMode(false); }}
                  disabled={updatingGroup}
                  className="h-9 px-3 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {updatingGroup ? '...' : t('messenger.groupPanel.addMembers')}
                </button>
              </div>
            )}

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
                    {canKick && (
                      <button
                        onClick={() => onRemoveMember(pid)}
                        disabled={updatingGroup}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${
                          isSelf
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
