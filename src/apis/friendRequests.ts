import { httpClient } from './http';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  status: 'PENDING' | 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFriendRequestData {
  senderId: string;
  receiverId: string;
}

export const friendRequestsApi = {
  getFriendRequestsBySenderId: async (senderId: string): Promise<FriendRequest[]> => {
    return httpClient.get<FriendRequest[]>(`/api/common/friend-requests/sender/${senderId}`);
  },

  getFriendRequestsByReceiverId: async (receiverId: string): Promise<FriendRequest[]> => {
    return httpClient.get<FriendRequest[]>(`/api/common/friend-requests/receiver/${receiverId}`);
  },

  getPendingFriendRequestsByReceiverId: async (receiverId: string): Promise<FriendRequest[]> => {
    return httpClient.get<FriendRequest[]>(`/api/common/friend-requests/receiver/${receiverId}/pending`);
  },

  createFriendRequest: async (data: CreateFriendRequestData): Promise<FriendRequest> => {
    return httpClient.post<FriendRequest>('/api/common/friend-requests', data);
  },

  acceptFriendRequest: async (id: string): Promise<FriendRequest> => {
    return httpClient.put<FriendRequest>(`/api/common/friend-requests/${id}/accept`, null);
  },

  rejectFriendRequest: async (id: string): Promise<void> => {
    return httpClient.put<void>(`/api/common/friend-requests/${id}/reject`, null);
  },

  cancelFriendRequest: async (id: string): Promise<void> => {
    return httpClient.put<void>(`/api/common/friend-requests/${id}/cancel`, null);
  },

  unfriend: async (userId1: string, userId2: string): Promise<void> => {
    return httpClient.delete<void>(`/api/common/friend-requests/unfriend?userId1=${userId1}&userId2=${userId2}`);
  },

  deleteFriendRequest: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/api/common/friend-requests/${id}`);
  },
};
export interface FriendDTO {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  friendId: string;
  friendName?: string;
  friendAvatar?: string;
}

export const friendsApi = {
  /** Lấy danh sách bạn bè từ bảng Friend (sau khi accept) */
  getFriendsByUserId: async (userId: string): Promise<FriendDTO[]> => {
    return httpClient.get<FriendDTO[]>(`/api/common/friends/user/${userId}`);
  },
  checkIfFriends: async (userId: string, friendId: string): Promise<boolean> => {
    return httpClient.get<boolean>(`/api/common/friends/check?userId=${userId}&friendId=${friendId}`);
  },
};

export const getFriends = async (userId: string) => {
  const data = await friendsApi.getFriendsByUserId(userId);
  console.log('[getFriends] FriendDTO[]:', data);
  return (Array.isArray(data) ? data : []).map(f => ({
    id: f.friendId,
    name: f.friendName,
    avatar: f.friendAvatar,
  }));
};
