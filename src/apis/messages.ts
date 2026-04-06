import { httpClient } from './http';

export interface MessageAttachment {
  type: string; // 'image' | 'video' | 'file'
  url: string;
  fileName?: string;
  fileSize?: number;
}

export interface MessageReplyTo {
  messageId: string;
  senderName: string;
  contentPreview: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  emojis?: string[];
  attachments?: MessageAttachment[];
  pinned?: boolean;
  starredByUserIds?: string[];
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
  replyTo?: MessageReplyTo;
}

export interface CreateMessageDTO {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: MessageAttachment[];
  replyToMessageId?: string;
}

export const messagesApi = {
  /**
   * Get all messages in a conversation
   */
  getMessagesByConversationId: async (conversationId: string): Promise<Message[]> => {
    return httpClient.get<Message[]>(`/api/message/messages/conversation/${conversationId}`);
  },

  /**
   * Get message by ID
   */
  getMessageById: async (id: string): Promise<Message> => {
    return httpClient.get<Message>(`/api/message/messages/${id}`);
  },

  /**
   * Create a new message
   */
  createMessage: async (data: CreateMessageDTO): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages`, data);
  },

  /**
   * Update message
   */
  updateMessage: async (id: string, data: Partial<CreateMessageDTO>): Promise<Message> => {
    return httpClient.put<Message>(`/api/message/messages/${id}`, data);
  },

  /**
   * Soft-delete message (sender only; server validates).
   */
  deleteMessage: async (id: string, userId: string): Promise<void> => {
    const qs = encodeURIComponent(userId);
    return httpClient.delete(`/api/message/messages/${id}?userId=${qs}`);
  },

  /**
   * Toggle pin for a message
   */
  togglePin: async (id: string): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/${id}/pin`);
  },

  /**
   * Toggle star for current user
   */
  toggleStar: async (id: string, userId: string): Promise<Message> => {
    const qs = encodeURIComponent(userId);
    return httpClient.post<Message>(`/api/message/messages/${id}/star?userId=${qs}`);
  },

  /**
   * Toggle emoji reaction (aggregated per message)
   */
  toggleReaction: async (id: string, emoji: string): Promise<Message> => {
    const qs = encodeURIComponent(emoji);
    return httpClient.post<Message>(`/api/message/messages/${id}/react?emoji=${qs}`);
  },
};

