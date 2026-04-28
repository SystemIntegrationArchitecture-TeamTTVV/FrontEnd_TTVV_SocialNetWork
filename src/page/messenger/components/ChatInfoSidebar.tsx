import type { Conversation } from '../../../apis/conversations';
import type { FriendDTO } from '../../../apis/friendRequests';
import GroupChatSidebar from './GroupChatSidebar';
import DirectChatSidebar from './DirectChatSidebar';

interface ActiveConversation {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
  color: string;
  isGroup?: boolean;
}

export interface ChatInfoSidebarProps {
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
  onToggleRequireApproval: (current: boolean) => void;
  onToggleOnlyAdminsCanSend: (current: boolean) => void;
  onTransferOwnership: (newOwnerId: string) => void;
  friendList: FriendDTO[];
  onInviteFriends: (ids: string[]) => void;
  // UI
  onShowSearch: () => void;
  onCloseRightSidebar: () => void;
  userId?: string;
}

/**
 * Thin router — delegates to GroupChatSidebar or DirectChatSidebar
 * based on isGroupChat flag. Props interface unchanged for Messenger.tsx.
 */
export default function ChatInfoSidebar(props: ChatInfoSidebarProps) {
  if (props.isGroupChat) {
    return <GroupChatSidebar {...props} />;
  }

  return (
    <DirectChatSidebar
      conversation={props.conversation}
      conversationRaw={props.conversationRaw}
      onClearConversationForMe={props.onClearConversationForMe}
      onShowSearch={props.onShowSearch}
      onCloseRightSidebar={props.onCloseRightSidebar}
      userId={props.userId}
    />
  );
}
