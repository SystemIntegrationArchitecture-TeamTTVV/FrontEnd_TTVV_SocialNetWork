import { httpClient } from './http';

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames?: string[];
  participantAvatars?: string[];
  ownerId?: string;
  adminIds?: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  onlyAdminsCanSend?: boolean;
  onlyAdminsCanAddMembers?: boolean;
  approvalsRequired?: boolean;
  hiddenForCurrentUser?: boolean;
  hiddenRequiresPin?: boolean;
  clearBeforeAt?: string;
  pendingJoinIds?: string[];
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConversationDTO {
  participantIds: string[];
  participantNames?: string[];
  participantAvatars?: string[];
  isGroup?: boolean; // used for direct conversations
  groupName?: string;
  groupAvatar?: string;
}

export interface CreateGroupConversationDTO extends CreateConversationDTO {
  ownerId: string;
  adminIds?: string[];
  isGroup: true;
}

export interface GroupMemberUpdateRequest {
  requesterId: string;
  participantIds: string[];
}

export interface RemoveMemberRequest {
  requesterId: string;
  participantId: string;
}

export interface GroupRoleUpdateRequest {
  requesterId: string;
  newOwnerId?: string;
  adminIds?: string[];
}

export interface LeaveGroupRequest {
  requesterId: string;
  newOwnerId?: string;
}

export interface ConversationMetaUpdateRequest {
  requesterId: string;
  groupName?: string;
  groupAvatar?: string;
  description?: string;
  approvalsRequired?: boolean;
  onlyAdminsCanSend?: boolean;
  onlyAdminsCanAddMembers?: boolean;
}

export interface JoinRequestUpdateRequest {
  requesterId: string;
  approverId: string;
  approved: boolean;
}

export interface ConversationPinRequest {
  userId: string;
  pin: string;
}

export interface ConversationVisibilityRequest {
  userId: string;
}

export interface ConversationActionRequest {
  userId: string;
  payload?: string;
}

export const conversationsApi = {
  /**
   * Get all conversations for a user
   */
  getConversationsByUserId: async (userId: string): Promise<Conversation[]> => {
    return httpClient.get<Conversation[]>(`/api/message/conversations/user/${userId}`);
  },

  /**
   * Get hidden conversations for a user (requires PIN to unlock)
   */
  getHiddenConversationsByUserId: async (userId: string): Promise<Conversation[]> => {
    return httpClient.get<Conversation[]>(`/api/message/conversations/user/${userId}/hidden`);
  },

  /**
   * Get or create a direct conversation between two users
   */
  getOrCreateDirectConversation: async (
    userId1: string,
    userId2: string
  ): Promise<Conversation> => {
    return httpClient.get<Conversation>(`/api/message/conversations/direct/${userId1}/${userId2}`);
  },

  /**
   * Get conversation by ID
   */
  getConversationById: async (id: string): Promise<Conversation> => {
    return httpClient.get<Conversation>(`/api/message/conversations/${id}`);
  },

  searchGroupConversations: async (userId: string, keyword: string): Promise<Conversation[]> => {
    const qs = new URLSearchParams({ userId, keyword }).toString();
    return httpClient.get<Conversation[]>(`/api/message/conversations/groups/search?${qs}`);
  },

  /**
   * Create a new conversation
   */
  createConversation: async (data: CreateConversationDTO): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations`, data);
  },

  /**
   * Create a new group conversation (>=3 members, includes owner)
   */
  createGroupConversation: async (data: CreateGroupConversationDTO): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/group`, data);
  },

  addGroupMembers: async (conversationId: string, data: GroupMemberUpdateRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/members`, data);
  },

  removeGroupMember: async (conversationId: string, data: RemoveMemberRequest): Promise<Conversation> => {
    return httpClient.delete<Conversation>(`/api/message/conversations/${conversationId}/members`, true, true, data as any);
  },

  updateGroupRoles: async (conversationId: string, data: GroupRoleUpdateRequest): Promise<Conversation> => {
    return httpClient.put<Conversation>(`/api/message/conversations/${conversationId}/roles`, data);
  },

  /**
   * Update conversation
   */
  updateConversation: async (
    id: string,
    data: Partial<CreateConversationDTO>
  ): Promise<Conversation> => {
    return httpClient.put<Conversation>(`/api/message/conversations/${id}`, data);
  },

  updateConversationMeta: async (
    id: string,
    data: ConversationMetaUpdateRequest
  ): Promise<Conversation> => {
    return httpClient.put<Conversation>(`/api/message/conversations/${id}/meta`, data);
  },

  hideConversation: async (id: string, data: ConversationPinRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${id}/hide`, data);
  },

  unhideConversation: async (id: string, data: ConversationPinRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${id}/unhide`, data);
  },

  clearConversationForUser: async (id: string, data: ConversationVisibilityRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${id}/clear-for-user`, data);
  },

  restoreConversation: async (id: string, data: ConversationVisibilityRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${id}/restore`, data);
  },

  leaveGroup: async (conversationId: string, data: LeaveGroupRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/leave`, data);
  },

  /**
   * Delete conversation
   */
  deleteConversation: async (id: string): Promise<void> => {
    return httpClient.delete(`/api/message/conversations/${id}`);
  },

  deleteConversationAsUser: async (id: string, requesterId: string): Promise<void> => {
    const qs = encodeURIComponent(requesterId);
    return httpClient.delete(`/api/message/conversations/${id}?requesterId=${qs}`);
  },

  requestJoinGroup: async (conversationId: string, requesterId: string): Promise<Conversation> => {
    const qs = encodeURIComponent(requesterId);
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/join-requests?requesterId=${qs}`);
  },

  getPendingJoinRequests: async (conversationId: string, requesterId: string): Promise<string[]> => {
    const qs = encodeURIComponent(requesterId);
    return httpClient.get<string[]>(`/api/message/conversations/${conversationId}/join-requests?requesterId=${qs}`);
  },

  handleJoinRequest: async (
    conversationId: string,
    data: JoinRequestUpdateRequest
  ): Promise<Conversation> => {
    return httpClient.put<Conversation>(`/api/message/conversations/${conversationId}/join-requests`, data);
  },

  toggleMute: async (conversationId: string, data: ConversationActionRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/mute`, data);
  },

  togglePinConversation: async (conversationId: string, data: ConversationActionRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/pin`, data);
  },

  toggleBanMember: async (conversationId: string, data: ConversationActionRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/ban`, data);
  },

  updateNickname: async (conversationId: string, data: ConversationActionRequest): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/nickname`, data);
  },

  getInviteLink: async (conversationId: string, requesterId: string): Promise<string> => {
    const qs = new URLSearchParams({ requesterId }).toString();
    return httpClient.get<string>(`/api/message/conversations/${conversationId}/invite-link?${qs}`);
  },

  resetInviteLink: async (conversationId: string, requesterId: string): Promise<string> => {
    const qs = new URLSearchParams({ requesterId }).toString();
    return httpClient.post<string>(`/api/message/conversations/${conversationId}/invite-link/reset?${qs}`);
  },

  joinByInviteLink: async (token: string, requesterId: string): Promise<Conversation> => {
    const qs = new URLSearchParams({ token, requesterId }).toString();
    return httpClient.post<Conversation>(`/api/message/conversations/join-by-url?${qs}`);
  },

  toggleBlockConversation: async (conversationId: string, userId: string): Promise<Conversation> => {
    const qs = new URLSearchParams({ userId }).toString();
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/block?${qs}`);
  },

  updateConversationBackground: async (conversationId: string, backgroundUrl: string): Promise<Conversation> => {
    const qs = new URLSearchParams({ backgroundUrl }).toString();
    return httpClient.post<Conversation>(`/api/message/conversations/${conversationId}/background?${qs}`);
  },
};

