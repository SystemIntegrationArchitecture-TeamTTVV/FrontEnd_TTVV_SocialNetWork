// import { httpClient } from './http';
import { httpClient } from './http';
import type { Story } from '../types/story';

export const storiesApi = {
  /**
   * Mark a story as viewed by the current user.
   * Idempotent — safe to call on every open.
   */
  viewStory: async (storyId: string, userId: string): Promise<Story> => {
    return httpClient.post<Story>(`/api/social/stories/${storyId}/view?userId=${encodeURIComponent(userId)}`, {});
  },

  /**
   * Add a quick reaction to a story.
   * emoji: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   */
  reactStory: async (storyId: string, userId: string, emoji: string): Promise<Story> => {
    return httpClient.post<Story>(
      `/api/social/stories/${storyId}/react?userId=${encodeURIComponent(userId)}&emoji=${encodeURIComponent(emoji)}`,
      {}
    );
  },
};

// Legacy commented-out stubs kept below for reference

// export interface StoryData {
//   id: string;
//   authorId: string;
//   authorName: string;
//   authorAvatar: string | null;
//   type: 'IMAGE' | 'VIDEO' | 'TEXT';
//   mediaUrl: string | null;
//   thumbnailUrl?: string | null;
//   text?: string | null;
//   backgroundColor?: string | null;
//   visibility: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
//   viewCount: number;
//   reactionCount: number;
//   createdAt: string;
//   expiresAt: string;
//   active: boolean;
// }

// export interface CreateStoryRequest {
//   authorId: string;
//   type: 'IMAGE' | 'VIDEO' | 'TEXT';
//   mediaUrl?: string;
//   thumbnailUrl?: string;
//   text?: string;
//   backgroundColor?: string;
//   visibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
// }

// const baseUrl = '/api/common/stories';

// export const storiesApi = {
//   getAllActiveStories: async (): Promise<StoryData[]> => {
//     return await httpClient.get(baseUrl);
//   },

//   getStoriesByAuthorId: async (authorId: string): Promise<StoryData[]> => {
//     return await httpClient.get(`${baseUrl}/author/${authorId}`);
//   },

//   getStoryById: async (id: string): Promise<StoryData> => {
//     return await httpClient.get(`${baseUrl}/${id}`);
//   },

//   createStory: async (story: CreateStoryRequest): Promise<StoryData> => {
//     return await httpClient.post(baseUrl, story);
//   },

//   incrementViewCount: async (id: string): Promise<StoryData> => {
//     return await httpClient.put(`${baseUrl}/${id}/view`);
//   },

//   deleteStory: async (id: string): Promise<void> => {
//     await httpClient.delete(`${baseUrl}/${id}`);
//   },
// };
