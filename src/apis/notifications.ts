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
    return httpClient.get<Notification[]>(`/api/social/notifications/recipient/${recipientId}`);
  },

  getUnreadNotificationsByRecipientId: async (recipientId: string): Promise<Notification[]> => {
    return httpClient.get<Notification[]>(`/api/social/notifications/recipient/${recipientId}/unread`);
  },

  getUnreadNotificationCount: async (recipientId: string): Promise<number> => {
    return httpClient.get<number>(`/api/social/notifications/recipient/${recipientId}/unread/count`);
  },

  /** Filter by one or more comma-separated types, e.g. "FRIEND_REQUEST,FRIEND_ACCEPTED" */
  getNotificationsByType: async (recipientId: string, type: string): Promise<Notification[]> => {
    return httpClient.get<Notification[]>(
      `/api/social/notifications/recipient/${recipientId}/filter?type=${encodeURIComponent(type)}`
    );
  },

  getNotificationById: async (id: string): Promise<Notification> => {
    return httpClient.get<Notification>(`/api/social/notifications/${id}`);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return httpClient.put<Notification>(`/api/social/notifications/${id}/read`);
  },

  markAllAsRead: async (recipientId: string): Promise<void> => {
    return httpClient.put<void>(`/api/social/notifications/recipient/${recipientId}/read-all`);
  },

  deleteNotification: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/api/social/notifications/${id}`);
  },
};

