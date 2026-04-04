import { httpClient } from './http';

// Define types
type AIChatRequest = {
  message: string;
  userId?: string;
  conversationId?: string;
};

type AIChatResponse = {
  response: string;
  conversationId: string;
};

type AIAutoPostRequest = {
  prompt: string;
  userId: string;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
};

type AIAutoPostResponse = {
  generatedContent: string;
  post: {
    id?: string;
    content: string;
  };
};

type AIDraftPostResponse = {
  generatedContent: string;
  visibility: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
};

type AIDailySummaryRequest = {
  userId: string;
  limit?: number;
};

type AIDailySummaryResponse = {
  summary: string;
  notificationsCount: number;
  friendsPostCount: number;
  incomingMessageCount: number;
  generatedAt: string;
};

// Export types explicitly
export type {
  AIChatRequest,
  AIChatResponse,
  AIAutoPostRequest,
  AIAutoPostResponse,
  AIDraftPostResponse,
  AIDailySummaryRequest,
  AIDailySummaryResponse,
};

const baseUrl = '/api/common/ai';

export const aiApi = {
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    return await httpClient.post<AIChatResponse>(`${baseUrl}/chat`, request);
  },
  autoPost: async (request: AIAutoPostRequest): Promise<AIAutoPostResponse> => {
    return await httpClient.post<AIAutoPostResponse>(`${baseUrl}/auto-post`, request);
  },
  draftPost: async (request: AIAutoPostRequest): Promise<AIDraftPostResponse> => {
    return await httpClient.post<AIDraftPostResponse>(`${baseUrl}/draft-post`, request);
  },
  dailySummary: async (request: AIDailySummaryRequest): Promise<AIDailySummaryResponse> => {
    return await httpClient.post<AIDailySummaryResponse>(`${baseUrl}/daily-summary`, request);
  },
};
