import { httpClient } from './http';

export interface Notification {
  id: string;
  recipientId: string;
  recipientName?: string;
  actorId: string;
  actorName?: string;
  actorAvatar?: string;
  type: string; // FRIEND_REQUEST, FRIEND_ACCEPTED, LIKE_POST, COMMENT_POST, etc.
  title: string;
  content: string;
  image?: string;
  relatedId?: string;
  relatedType?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotificationsByRecipientId: async (recipientId: string): Promise<Notification[]> => {
    return httpClient.get<Notification[]>(`/api/common/notifications/recipient/${recipientId}`);
  },

  getUnreadNotificationsByRecipientId: async (recipientId: string): Promise<Notification[]> => {
    return httpClient.get<Notification[]>(`/api/common/notifications/recipient/${recipientId}/unread`);
  },

  getUnreadNotificationCount: async (recipientId: string): Promise<number> => {
    return httpClient.get<number>(`/api/common/notifications/recipient/${recipientId}/unread/count`);
  },

  getNotificationById: async (id: string): Promise<Notification> => {
    return httpClient.get<Notification>(`/api/common/notifications/${id}`);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return httpClient.put<Notification>(`/api/common/notifications/${id}/read`);
  },

  markAllAsRead: async (recipientId: string): Promise<void> => {
    return httpClient.put<void>(`/api/common/notifications/recipient/${recipientId}/read-all`);
  },

  deleteNotification: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/api/common/notifications/${id}`);
  },
};

