// import { httpClient } from './http';

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
