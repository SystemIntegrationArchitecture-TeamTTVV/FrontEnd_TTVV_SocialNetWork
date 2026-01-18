import { httpClient } from './http';

export interface Conversation {
  id: string;
  participantIds: string[];
  participantNames?: string[];
  participantAvatars?: string[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateConversationDTO {
  participantIds: string[];
  participantNames?: string[];
  participantAvatars?: string[];
  isGroup?: boolean;
  groupName?: string;
  groupAvatar?: string;
}

export const conversationsApi = {
  /**
   * Get all conversations for a user
   */
  getConversationsByUserId: async (userId: string): Promise<Conversation[]> => {
    return httpClient.get<Conversation[]>(`/api/message/conversations/user/${userId}`);
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

  /**
   * Create a new conversation
   */
  createConversation: async (data: CreateConversationDTO): Promise<Conversation> => {
    return httpClient.post<Conversation>(`/api/message/conversations`, data);
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

  /**
   * Delete conversation
   */
  deleteConversation: async (id: string): Promise<void> => {
    return httpClient.delete(`/api/message/conversations/${id}`);
  },
};

