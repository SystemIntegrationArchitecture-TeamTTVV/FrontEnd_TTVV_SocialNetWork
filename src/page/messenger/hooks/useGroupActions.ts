import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationsApi } from '../../../apis/conversations';
import { messagesApi } from '../../../apis/messages';

interface UseGroupActionsProps {
  activeChat: string | null;
  userId?: string;
  isGroupChat: boolean;
  isOwner: boolean;
  loadConversations: () => Promise<void>;
  setActiveChat: (id: string | null) => void;
}

export function useGroupActions({
  activeChat,
  userId,
  isGroupChat,
  isOwner,
  loadConversations,
  setActiveChat,
}: UseGroupActionsProps) {
  const { t } = useTranslation();

  const [groupMemberInput, setGroupMemberInput] = useState('');
  const [groupNameDraft, setGroupNameDraft] = useState('');
  const [groupAvatarDraft, setGroupAvatarDraft] = useState('');
  const [adminDraft, setAdminDraft] = useState<string[]>([]);
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [pendingJoins, setPendingJoins] = useState<string[]>([]);
  const [groupActionError, setGroupActionError] = useState<string | null>(null);
  const [groupActionMessage, setGroupActionMessage] = useState<string | null>(null);
  const [updatingGroup, setUpdatingGroup] = useState(false);

  const parseIdsInput = (input: string) =>
    input
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const handleAddMembers = async () => {
    if (!activeChat || !userId) return;
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
        requesterId: userId,
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

  const handleInviteFriends = async (selectedIds: string[]) => {
    if (!activeChat || !userId || selectedIds.length === 0) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      const updatedConversation = await conversationsApi.addGroupMembers(activeChat, {
        requesterId: userId,
        participantIds: selectedIds,
      });
      // If some/all invitees were routed to pending, update local pending list
      if (updatedConversation.pendingJoinIds && updatedConversation.pendingJoinIds.length > 0) {
        setPendingJoins(updatedConversation.pendingJoinIds);
        setGroupActionMessage('Lời mời đã được gửi, chờ admin phê duyệt');
      } else {
        setGroupActionMessage('Đã mời thành công');
      }
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to invite friends', err);
      setGroupActionError(err instanceof Error ? err.message : 'Không thể mời bạn bè');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeChat || !userId) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      if (memberId === userId && isGroupChat && isOwner) {
        if (!newOwnerId || newOwnerId === userId) {
          setGroupActionError(t('messenger.group.ownerMustChooseNewOwner'));
          return;
        }
        await conversationsApi.leaveGroup(activeChat, {
          requesterId: userId,
          newOwnerId,
        });
        setGroupActionMessage(t('messenger.group.leaveSuccess'));
        await loadConversations();
        setActiveChat(null);
        return;
      }

      await conversationsApi.removeGroupMember(activeChat, {
        requesterId: userId,
        participantId: memberId,
      });
      const selfRemoved = memberId === userId;
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
    if (!activeChat || !userId || !isGroupChat) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.updateConversationMeta(activeChat, {
        requesterId: userId,
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
    if (!activeChat || !userId || !isGroupChat) return;
    if (!window.confirm(t('messenger.group.confirmDeleteGroup'))) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.deleteConversation(activeChat);
      await loadConversations();
      setActiveChat(null);
    } catch (err: unknown) {
      console.error('Failed to delete group', err);
      const message = err instanceof Error ? err.message : t('messenger.group.deleteGroupError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleDisbandGroup = async () => {
    if (!activeChat || !userId || !isGroupChat) return;
    if (!window.confirm("Bạn có chắc chắn muốn giải tán nhóm này? Toàn bộ lịch sử chat sẽ bị xoá.")) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.disbandGroup(activeChat, userId);
      setGroupActionMessage("Giải tán nhóm thành công");
      await loadConversations();
      setActiveChat(null);
    } catch (err: unknown) {
      console.error('Failed to disband group', err);
      const message = err instanceof Error ? err.message : "Giải tán nhóm thất bại";
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleClearConversationForMe = async () => {
    if (!activeChat || !userId) return;
    if (!window.confirm(t('messenger.group.confirmClearChatForMe'))) return;

    setUpdatingGroup(true);
    try {
      await conversationsApi.clearConversationForUser(activeChat, { userId });
      await loadConversations();
      setActiveChat(null);
    } catch (err: unknown) {
      console.error('Failed to clear chat for me', err);
      const message = err instanceof Error ? err.message : t('messenger.group.clearChatForMeError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleClearGroupHistory = async () => {
    if (!activeChat || !userId || !isGroupChat) return;
    if (!isOwner) {
      setGroupActionError(t('messenger.group.onlyOwnerCanClearHistory'));
      return;
    }
    if (!window.confirm(t('messenger.group.confirmClearGroupHistory'))) return;

    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await messagesApi.clearGroupConversationHistory(activeChat, userId);
      setGroupActionMessage(t('messenger.group.clearGroupHistorySuccess'));
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to clear group history', err);
      const message = err instanceof Error ? err.message : t('messenger.group.clearGroupHistoryError');
      setGroupActionError(message);
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleJoinRequestDecision = async (requesterId: string, approved: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.handleJoinRequest(activeChat, {
        approverId: userId,
        requesterId,
        approved,
      });
      setGroupActionMessage(approved ? t('messenger.group.approveJoinSuccess') : t('messenger.group.rejectJoinSuccess'));
      setPendingJoins((prev) => prev.filter((id) => id !== requesterId));
      if (approved) {
        await loadConversations();
      }
    } catch (err: unknown) {
      console.error('Failed to handle join request', err);
      setGroupActionError(err instanceof Error ? err.message : t('messenger.group.handleJoinRequestError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleToggleAdminDirect = async (memberId: string, currentAdmins: string[], makeAdmin: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      const newAdmins = makeAdmin
        ? [...currentAdmins, memberId]
        : currentAdmins.filter((id) => id !== memberId);
      await conversationsApi.updateGroupRoles(activeChat, {
        requesterId: userId,
        adminIds: newAdmins,
      });
      setGroupActionMessage(makeAdmin ? 'Đã bổ nhiệm phó nhóm' : 'Đã hủy tư cách phó nhóm');
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to toggle admin', err);
      setGroupActionError(err instanceof Error ? err.message : 'Không thể thay đổi quyền phó nhóm');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleUpdateRoles = async () => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);

    try {
      await conversationsApi.updateGroupRoles(activeChat, {
        requesterId: userId,
        adminIds: adminDraft,
        newOwnerId: newOwnerId !== userId ? newOwnerId : undefined,
      });
      setGroupActionMessage(t('messenger.group.updateRolesSuccess'));
      await loadConversations();
      if (newOwnerId && newOwnerId !== userId) {
        setActiveChat(null);
      }
    } catch (err: unknown) {
      console.error('Failed to update roles', err);
      setGroupActionError(err instanceof Error ? err.message : t('messenger.group.updateRolesError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleTransferOwnership = async (targetUserId: string) => {
    if (!activeChat || !userId || !targetUserId || targetUserId === userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.updateGroupRoles(activeChat, {
        requesterId: userId,
        newOwnerId: targetUserId,
      });
      setGroupActionMessage('Chuyển quyền trưởng nhóm thành công');
      await loadConversations();
      // Current user is no longer owner — keep them in the chat but update state
    } catch (err: unknown) {
      console.error('Failed to transfer ownership', err);
      setGroupActionError(err instanceof Error ? err.message : 'Không thể chuyển quyền trưởng nhóm');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleToggleRequireApproval = async (currentValue: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.updateConversationMeta(activeChat, {
        requesterId: userId,
        approvalsRequired: !currentValue,
      });
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to toggle require approval', err);
      setGroupActionError(err instanceof Error ? err.message : t('messenger.group.updateMetaError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleToggleOnlyAdminsCanSend = async (currentValue: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.updateConversationMeta(activeChat, {
        requesterId: userId,
        onlyAdminsCanSend: !currentValue,
      });
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to toggle onlyAdminsCanSend', err);
      setGroupActionError(err instanceof Error ? err.message : t('messenger.group.updateMetaError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleToggleAiAssistant = async (currentValue: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.updateConversationMeta(activeChat, {
        requesterId: userId,
        aiAssistantEnabled: !currentValue,
      });
      await loadConversations();
    } catch (err: unknown) {
      console.error('Failed to toggle aiAssistantEnabled', err);
      setGroupActionError(err instanceof Error ? err.message : t('messenger.group.updateMetaError'));
    } finally {
      setUpdatingGroup(false);
    }
  };

  return {
    groupMemberInput,
    setGroupMemberInput,
    groupNameDraft,
    setGroupNameDraft,
    groupAvatarDraft,
    setGroupAvatarDraft,
    adminDraft,
    setAdminDraft,
    newOwnerId,
    setNewOwnerId,
    pendingJoins,
    setPendingJoins,
    groupActionError,
    setGroupActionError,
    groupActionMessage,
    setGroupActionMessage,
    updatingGroup,
    setUpdatingGroup,
    parseIdsInput,
    handleAddMembers,
    handleInviteFriends,
    handleRemoveMember,
    handleSaveGroupMeta,
    handleDeleteGroup,
    handleClearConversationForMe,
    handleClearGroupHistory,
    handleJoinRequestDecision,
    handleToggleAdminDirect,
    handleUpdateRoles,
    handleTransferOwnership,
    handleToggleRequireApproval,
    handleToggleOnlyAdminsCanSend,
    handleToggleAiAssistant,
    handleDisbandGroup,
  };
}
