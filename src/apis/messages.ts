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

export interface PollOption {
  optionId: string;
  text: string;
  voterUserIds?: string[];
}

export type MessageType = 'TEXT' | 'SYSTEM' | 'POLL' | 'APPOINTMENT';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  messageType?: MessageType;
  systemAction?: string;
  content: string;
  emojis?: string[];
  attachments?: MessageAttachment[];
  pollQuestion?: string;
  pollMultipleChoice?: boolean;
  pollClosed?: boolean;
  pollCanAddOptions?: boolean;
  pollHideResultsBeforeVote?: boolean;
  pollHideVoters?: boolean;
  pollOptions?: PollOption[];
  pollDeadline?: string;
  appointmentTitle?: string;
  appointmentTime?: string;
  appointmentLocation?: string;
  appointmentParticipants?: string[]; // userIds who accepted
  mentionUserIds?: string[];
  seenByUserIds?: string[];
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
  mentionUserIds?: string[];
}

export interface MessagePageResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TypingEventRequest {
  userId: string;
  typing: boolean;
}

export interface SeenEventRequest {
  userId: string;
  lastSeenMessageId?: string;
}

export interface DeliveredEventRequest {
  userId: string;
  lastDeliveredMessageId?: string;
}

export interface CreatePollRequest {
  userId: string;
  question: string;
  options: string[];
  multipleChoice?: boolean;
  canAddOptions?: boolean;
  hideResultsBeforeVote?: boolean;
  hideVoters?: boolean;
  deadline?: string; // ISO string
}

export interface VotePollRequest {
  userId: string;
  optionIds: string[];
}

export interface CreateAppointmentRequest {
  userId: string;
  title: string;
  time: string; // ISO string
  location?: string;
  description?: string;
}

export interface JoinAppointmentRequest {
  userId: string;
}

export const messagesApi = {
  /**
   * Get all messages in a conversation
   */
  getMessagesByConversationId: async (conversationId: string, userId?: string): Promise<Message[]> => {
    const params = new URLSearchParams();
    if (userId) {
      params.set('userId', userId);
    }
    const qs = params.toString();
    const url = qs
      ? `/api/message/messages/conversation/${conversationId}?${qs}`
      : `/api/message/messages/conversation/${conversationId}`;
    return httpClient.get<Message[]>(url);
  },

  getMessagesByConversationCursor: async (
    conversationId: string,
    before?: string,
    limit: number = 20,
    userId?: string
  ): Promise<MessagePageResponse> => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before) {
      params.set('before', before);
    }
    if (userId) {
      params.set('userId', userId);
    }
    return httpClient.get<MessagePageResponse>(
      `/api/message/messages/conversation/${conversationId}/cursor?${params.toString()}`
    );
  },

  getPinnedMessages: async (conversationId: string, userId: string): Promise<Message[]> => {
    const qs = new URLSearchParams({ userId }).toString();
    return httpClient.get<Message[]>(`/api/message/messages/conversation/${conversationId}/pinned?${qs}`);
  },

  /**
   * Search messages in a conversation (server-side)
   */
  searchMessages: async (conversationId: string, keyword: string, userId: string, senderId?: string): Promise<Message[]> => {
    const qs = new URLSearchParams({ keyword, userId });
    if (senderId) {
      qs.set('senderId', senderId);
    }
    return httpClient.get<Message[]>(`/api/message/messages/conversation/${conversationId}/search?${qs.toString()}`);
  },

  getMediaMessages: async (
    conversationId: string,
    userId: string,
    type?: string
  ): Promise<Message[]> => {
    const params = new URLSearchParams({ userId });
    if (type) {
      params.set('type', type);
    }
    return httpClient.get<Message[]>(
      `/api/message/messages/conversation/${conversationId}/media?${params.toString()}`
    );
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
   * Delete message for current user only.
   */
  deleteMessageForMe: async (id: string, userId: string): Promise<void> => {
    const qs = encodeURIComponent(userId);
    return httpClient.post(`/api/message/messages/${id}/delete-for-me?userId=${qs}`);
  },

  /**
   * Forward a message to a target conversation
   */
  forwardMessage: async (
    id: string,
    payload: { requesterId: string; targetConversationId: string; note?: string }
  ): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/${id}/forward`, payload);
  },
  /**
   * Toggle pin for a message
   */
  togglePin: async (id: string, userId: string): Promise<Message> => {
    const qs = encodeURIComponent(userId);
    return httpClient.post<Message>(`/api/message/messages/${id}/pin?userId=${qs}`);
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

  sendTypingEvent: async (conversationId: string, payload: TypingEventRequest): Promise<void> => {
    return httpClient.post<void>(`/api/message/messages/conversation/${conversationId}/typing`, payload);
  },

  markSeen: async (conversationId: string, payload: SeenEventRequest): Promise<void> => {
    return httpClient.post<void>(`/api/message/messages/conversation/${conversationId}/seen`, payload);
  },

  markDelivered: async (conversationId: string, payload: DeliveredEventRequest): Promise<void> => {
    return httpClient.post<void>(`/api/message/messages/conversation/${conversationId}/delivered`, payload);
  },

  createPoll: async (conversationId: string, payload: CreatePollRequest): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/conversation/${conversationId}/poll`, payload);
  },

  votePoll: async (messageId: string, payload: VotePollRequest): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/${messageId}/poll-vote`, payload);
  },
  createAppointment: async (conversationId: string, payload: CreateAppointmentRequest): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/conversation/${conversationId}/appointment`, payload);
  },
  joinAppointment: async (messageId: string, payload: JoinAppointmentRequest): Promise<Message> => {
    return httpClient.post<Message>(`/api/message/messages/${messageId}/appointment-join`, payload);
  },
};

