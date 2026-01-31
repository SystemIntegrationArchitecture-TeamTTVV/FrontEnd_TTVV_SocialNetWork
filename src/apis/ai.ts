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

// Export types explicitly
export type { AIChatRequest, AIChatResponse };

const baseUrl = '/api/common/ai';

export const aiApi = {
  chat: async (request: AIChatRequest): Promise<AIChatResponse> => {
    return await httpClient.post<AIChatResponse>(`${baseUrl}/chat`, request);
  },
};
