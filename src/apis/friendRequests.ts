import { httpClient } from './http';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  status: 'PENDING' | 'ACTIVE';
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
export const getFriends = async (userId: string) => {
  const sent = await friendRequestsApi.getFriendRequestsBySenderId(userId);
  const received = await friendRequestsApi.getFriendRequestsByReceiverId(userId);

  const activeSent = sent
    .filter(r => r.status === "ACTIVE")
    .map(r => ({
      id: r.receiverId,
      name: r.receiverName,
      avatar: r.receiverAvatar
    }));

  const activeReceived = received
    .filter(r => r.status === "ACTIVE")
    .map(r => ({
      id: r.senderId,
      name: r.senderName,
      avatar: r.senderAvatar
    }));

  return [...activeSent, ...activeReceived];
};
