import { httpClient } from './http';

export interface BlockedUser {
  userId: string;
  username?: string;
  fullName?: string;
  avatar?: string;
  blockedAt?: string;
}

export const blockingApi = {
  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    return httpClient.get<BlockedUser[]>('/api/users/me/blocks', true, true);
  },

  blockUser: async (targetUserId: string): Promise<{ message: string }> => {
    return httpClient.post<{ message: string }>(`/api/users/me/blocks/${encodeURIComponent(targetUserId)}`, {}, true, true);
  },

  unblockUser: async (targetUserId: string): Promise<{ message: string }> => {
    return httpClient.delete<{ message: string }>(`/api/users/me/blocks/${encodeURIComponent(targetUserId)}`, true, true);
  },
};
