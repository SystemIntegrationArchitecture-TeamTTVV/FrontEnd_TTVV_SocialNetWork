import { httpClient } from './http';

export interface FriendSuggestion {
  userId: string;
  fullName: string;
  username: string;
  avatar?: string;
  mutualFriendCount: number;
}

export const friendSuggestionsApi = {
  getSuggestions: (userId: string, limit = 10): Promise<FriendSuggestion[]> =>
    httpClient.get<FriendSuggestion[]>(
      `/api/friends/suggestions?userId=${encodeURIComponent(userId)}&limit=${limit}`,
      true,
      false,
    ),
};
