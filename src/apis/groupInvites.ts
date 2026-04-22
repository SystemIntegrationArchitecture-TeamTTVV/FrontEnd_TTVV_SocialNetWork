import { httpClient } from './http';

export type GroupInviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export interface GroupInvite {
  id: string;
  conversationId: string;
  inviterId: string;
  inviteeId: string;
  status: GroupInviteStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGroupInviteRequest {
  conversationId: string;
  inviterId: string;
  inviteeId: string;
}

export const groupInvitesApi = {
  create: async (payload: CreateGroupInviteRequest): Promise<GroupInvite> => {
    return httpClient.post<GroupInvite>('/api/message/group-invites', payload);
  },

  listByUser: async (userId: string): Promise<GroupInvite[]> => {
    return httpClient.get<GroupInvite[]>(`/api/message/group-invites/user/${userId}`);
  },

  accept: async (inviteId: string, userId: string): Promise<GroupInvite> => {
    const qs = new URLSearchParams({ userId }).toString();
    return httpClient.post<GroupInvite>(`/api/message/group-invites/${inviteId}/accept?${qs}`);
  },

  decline: async (inviteId: string, userId: string): Promise<GroupInvite> => {
    const qs = new URLSearchParams({ userId }).toString();
    return httpClient.post<GroupInvite>(`/api/message/group-invites/${inviteId}/decline?${qs}`);
  },
};
