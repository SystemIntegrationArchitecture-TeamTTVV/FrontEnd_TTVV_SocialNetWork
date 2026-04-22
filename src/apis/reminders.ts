import { httpClient } from './http';

export interface Reminder {
  id: string;
  conversationId: string;
  userId: string;
  title: string;
  remindAt: string;
  isTriggered?: boolean;
  createdAt?: string;
}

export interface CreateReminderRequest {
  conversationId: string;
  userId: string;
  title: string;
  remindAt: string;
}

export const remindersApi = {
  create: async (payload: CreateReminderRequest): Promise<Reminder> => {
    return httpClient.post<Reminder>('/api/message/reminders', payload);
  },

  listByConversation: async (conversationId: string): Promise<Reminder[]> => {
    return httpClient.get<Reminder[]>(`/api/message/reminders/conversation/${conversationId}`);
  },

  delete: async (id: string): Promise<void> => {
    return httpClient.delete<void>(`/api/message/reminders/${id}`);
  },
};
