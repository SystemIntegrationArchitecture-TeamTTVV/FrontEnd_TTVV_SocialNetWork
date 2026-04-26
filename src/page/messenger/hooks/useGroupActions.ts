import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { conversationsApi } from '../../../apis/conversations';

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
      await conversationsApi.deleteConversation(activeChat, userId);
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

  const handleClearConversationForMe = async () => {
    if (!activeChat || !userId) return;
    if (!window.confirm(t('messenger.group.confirmClearChatForMe'))) return;

    setUpdatingGroup(true);
    try {
      await conversationsApi.clearConversationForUser(activeChat, userId);
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

  const handleJoinRequestDecision = async (requesterId: string, approved: boolean) => {
    if (!activeChat || !userId) return;
    setUpdatingGroup(true);
    setGroupActionError(null);
    setGroupActionMessage(null);
    try {
      await conversationsApi.handleJoinRequest(activeChat, {
        adminId: userId,
        requesterId,
        action: approved ? 'approve' : 'reject',
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

  const handleAdminToggle = (memberId: string) => {
    setAdminDraft((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
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
    handleRemoveMember,
    handleSaveGroupMeta,
    handleDeleteGroup,
    handleClearConversationForMe,
    handleJoinRequestDecision,
    handleAdminToggle,
    handleUpdateRoles,
  };
}
