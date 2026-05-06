import { httpClient } from './http';

export interface ScheduledMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  scheduledAt: string;
  /** PENDING | SENT | CANCELLED */
  status: string;
  createdAt?: string;
}

export interface CreateScheduledMessageRequest {
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  scheduledAt: string; // ISO string
}

export const scheduledMessagesApi = {
  create: (conversationId: string, payload: CreateScheduledMessageRequest): Promise<ScheduledMessage> =>
    httpClient.post<ScheduledMessage>(
      `/scheduled-messages/conversation/${encodeURIComponent(conversationId)}`,
      payload,
      true,
      false,
    ),

  list: (conversationId: string, userId: string): Promise<ScheduledMessage[]> =>
    httpClient.get<ScheduledMessage[]>(
      `/scheduled-messages/conversation/${encodeURIComponent(conversationId)}?userId=${encodeURIComponent(userId)}`,
      true,
      false,
    ),

  cancel: (scheduledMessageId: string, userId: string): Promise<void> =>
    httpClient.delete<void>(
      `/scheduled-messages/${encodeURIComponent(scheduledMessageId)}?userId=${encodeURIComponent(userId)}`,
      true,
      false,
    ),
};
