import { httpClient } from './http';

export interface MessageAttachment {
  type: string; // 'image' | 'video' | 'file'
  url: string;
  fileName?: string;
  fileSize?: number;
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
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMessageDTO {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  attachments?: MessageAttachment[];
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
   * Delete message
   */
  deleteMessage: async (id: string): Promise<void> => {
    return httpClient.delete(`/api/message/messages/${id}`);
  },
};

