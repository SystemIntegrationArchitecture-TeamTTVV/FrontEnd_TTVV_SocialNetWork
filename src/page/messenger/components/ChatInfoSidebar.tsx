// ─── ChatInfoSidebar — right sidebar with profile, group management, media ──
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Palette, Smile, Pencil, Lock, Search as SearchIcon,
  Trash2, Users,
} from 'lucide-react';
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
  adminDraft: string[];
  newOwnerId: string;
  onNewOwnerIdChange: (v: string) => void;
  // Handlers
  onSaveGroupMeta: () => void;
  onAddMembers: () => void;
  onRemoveMember: (memberId: string) => void;
  onJoinRequestDecision: (userId: string, accept: boolean) => void;
  onAdminToggle: (pid: string) => void;
  onUpdateRoles: () => void;
  onDeleteGroup: () => void;
  onClearConversationForMe: () => void;
  // UI
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
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
  adminDraft,
  newOwnerId,
  onNewOwnerIdChange,
  onSaveGroupMeta,
  onAddMembers,
  onRemoveMember,
  onJoinRequestDecision,
  onAdminToggle,
  onUpdateRoles,
  onDeleteGroup,
  onClearConversationForMe,
  onShowSearch,
  onCloseRightSidebar,
  userId,
}: ChatInfoSidebarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="border-l border-gray-200/50 dark:border-white/5 glass-surface overflow-y-auto transition-all duration-300 ease-in-out shrink-0 w-full md:w-[320px] lg:w-[360px] p-4 md:p-6 shadow-sm">

      {/* Profile Section */}
      <div className="text-center mb-6">
        <div
          className="w-20 h-20 md:w-24 md:h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
          style={{ backgroundColor: conversation.color }}
          onClick={() => navigate(`/profile/${conversation.id}`)}
        >
          {conversation.avatar}
        </div>
        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">{conversation.name}</h3>
        {conversation.online && (
          <p className="text-sm md:text-base text-green-500 font-medium">{t('messenger.activeNow')}</p>
        )}
      </div>

      {isGroupChat && conversationRaw && (
        <div className="mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-base md:text-lg font-bold text-gray-900">{t('messenger.groupPanel.title')}</h4>
            <span className="text-xs text-gray-500">
              {t('messenger.groupPanel.memberCount', { count: conversationRaw.participantIds.length })}
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
                onChange={(e) => onGroupNameChange(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={t('messenger.groupPanel.groupNamePlaceholder')}
                disabled={updatingGroup}
              />
              <label className="text-sm font-medium text-gray-700">{t('messenger.groupPanel.groupAvatarUrl')}</label>
              <input
                type="text"
                value={groupAvatarDraft}
                onChange={(e) => onGroupAvatarChange(e.target.value)}
                className="w-full h-11 px-4 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder={t('messenger.groupPanel.groupAvatarPlaceholder')}
                disabled={updatingGroup}
              />
              <button
                onClick={onSaveGroupMeta}
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
                  onClick={() => {/* handled by parent */}}
                  disabled={updatingGroup}
                  className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${
                    conversationRaw.approvalsRequired ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      conversationRaw.approvalsRequired ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {canManageGroup && conversationRaw.approvalsRequired && pendingJoins.length > 0 && (
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
                        onClick={() => onJoinRequestDecision(pid, true)}
                        disabled={updatingGroup}
                        className="px-2 py-1 rounded-md text-xs bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-60"
                      >
                        {t('messenger.groupPanel.accept')}
                      </button>
                      <button
                        onClick={() => onJoinRequestDecision(pid, false)}
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
                  onChange={(e) => onGroupMemberInputChange(e.target.value)}
                  placeholder={t('messenger.groupPanel.addMembersPrompt')}
                  disabled={updatingGroup}
                  className="flex-1 h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:opacity-60"
                />
                <button
                  onClick={onAddMembers}
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
              {conversationRaw.participantIds.map((pid, idx) => {
                const name = conversationRaw.participantNames?.[idx] || pid;
                const isMemberOwner = pid === conversationRaw.ownerId;
                const isMemberAdmin = conversationRaw.adminIds?.includes(pid);
                const isSelf = pid === userId;
                const canKick = isSelf || (
                  isOwner && !isMemberOwner
                ) || (
                  isAdmin && !isOwner && !isMemberOwner && !isMemberAdmin
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
                          onClick={() => onRemoveMember(pid)}
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
                    onChange={(e) => onNewOwnerIdChange(e.target.value)}
                    className="w-full h-11 px-3 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={updatingGroup}
                  >
                    {conversationRaw.participantIds.map((pid, idx) => {
                      const name = conversationRaw.participantNames?.[idx] || pid;
                      return (
                        <option key={pid} value={pid}>
                          {name} {pid === conversationRaw.ownerId ? t('messenger.groupPanel.currentOwnerSuffix') : ''}
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
                    {conversationRaw.participantIds
                      .filter(pid => pid !== conversationRaw.ownerId)
                      .map((pid) => {
                        const name = conversationRaw.participantNames?.[conversationRaw.participantIds.indexOf(pid)] || pid;
                        const isMemberAdmin = conversationRaw.adminIds?.includes(pid);
                        return (
                          <label key={pid} className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={adminDraft.includes(pid)}
                              onChange={() => onAdminToggle(pid)}
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
                  onClick={onUpdateRoles}
                  disabled={updatingGroup}
                  className="w-full h-11 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
                >
                  {updatingGroup ? t('messenger.groupPanel.saving') : t('messenger.groupPanel.saveRoles')}
                </button>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <button
                  onClick={onDeleteGroup}
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
          <button onClick={onClearConversationForMe} className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity">
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
              onShowSearch();
              onCloseRightSidebar();
            }}
            className="w-full p-2.5 md:p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left text-xs md:text-sm text-gray-700 font-medium flex items-center gap-2 md:gap-3"
          >
            <SearchIcon className="w-4 h-4 md:w-5 md:h-5 text-gray-500 shrink-0" />
            <span>{t('messenger.groupPanel.searchInConversation')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
