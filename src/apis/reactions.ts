import { httpClient } from './http';

export interface ReactionData {
  id?: string;
  userId: string;
  postId?: string;
  commentId?: string;
  type: 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY';
  createdAt?: string;
}

export const reactionsApi = {
  /**
   * Get reactions for a post
   */
  getReactionsByPostId: async (postId: string): Promise<ReactionData[]> => {
    return httpClient.get<ReactionData[]>(`/api/common/reactions/post/${postId}`);
  },

  /**
   * Get reactions for a comment
   */
  getReactionsByCommentId: async (commentId: string): Promise<ReactionData[]> => {
    return httpClient.get<ReactionData[]>(`/api/common/reactions/comment/${commentId}`);
  },

  /**
   * Get all reactions by a user
   */
  getReactionsByUserId: async (userId: string): Promise<ReactionData[]> => {
    return httpClient.get<ReactionData[]>(`/api/common/reactions/user/${userId}`);
  },

  /**
   * Create/toggle a reaction on a post
   */
  togglePostReaction: async (postId: string, userId: string, type: ReactionData['type'] = 'LIKE'): Promise<ReactionData | null> => {
    try {
      // Try to create reaction
      return await httpClient.post<ReactionData, ReactionData>('/api/common/reactions', {
        userId,
        postId,
        type,
      });
    } catch (error: any) {
      // If already exists, delete it
      if (error.message?.includes('409') || error.message?.includes('already')) {
        await httpClient.delete(`/api/common/reactions/post/${postId}/user/${userId}`);
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete reaction from post
   */
  deletePostReaction: async (postId: string, userId: string): Promise<void> => {
    return httpClient.delete(`/api/common/reactions/post/${postId}/user/${userId}`);
  },

  /**
   * Create/toggle a reaction on a comment
   */
  toggleCommentReaction: async (commentId: string, userId: string, type: ReactionData['type'] = 'LIKE'): Promise<ReactionData | null> => {
    try {
      // Try to create reaction
      return await httpClient.post<ReactionData, ReactionData>('/api/common/reactions', {
        userId,
        commentId,
        type,
      });
    } catch (error: any) {
      // If already exists, delete it
      if (error.message?.includes('409') || error.message?.includes('already')) {
        await httpClient.delete(`/api/common/reactions/comment/${commentId}/user/${userId}`);
        return null;
      }
      throw error;
    }
  },

  /**
   * Delete reaction from comment
   */
  deleteCommentReaction: async (commentId: string, userId: string): Promise<void> => {
    return httpClient.delete(`/api/common/reactions/comment/${commentId}/user/${userId}`);
  },
};
