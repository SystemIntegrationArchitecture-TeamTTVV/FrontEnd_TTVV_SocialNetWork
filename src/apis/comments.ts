import { httpClient } from './http';

export interface CommentData {
  id?: string;
  postId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  createdAt?: string;
  updatedAt?: string;
  // Populated fields from backend
  userName?: string;
  userAvatar?: string;
  likeCount?: number;
  replyCount?: number;
}

export const commentsApi = {
  /**
   * Get all comments for a post
   */
  getCommentsByPostId: async (postId: string): Promise<CommentData[]> => {
    return httpClient.get<CommentData[]>(`/api/common/comments/post/${postId}`);
  },

  /**
   * Get replies for a comment
   */
  getRepliesByCommentId: async (commentId: string): Promise<CommentData[]> => {
    return httpClient.get<CommentData[]>(`/api/common/comments/parent/${commentId}/replies`);
  },

  /**
   * Create a new comment
   */
  createComment: async (postId: string, userId: string, content: string, parentCommentId?: string): Promise<CommentData> => {
    const payload: Partial<CommentData> = {
      postId,
      userId,
      content,
    };
    
    // Only include parentCommentId if it exists
    if (parentCommentId) {
      payload.parentCommentId = parentCommentId;
    }
    
    return httpClient.post<Partial<CommentData>, CommentData>('/api/common/comments', payload);
  },

  /**
   * Update a comment
   */
  updateComment: async (id: string, content: string): Promise<CommentData> => {
    return httpClient.put<Partial<CommentData>, CommentData>(`/api/common/comments/${id}`, {
      content,
    });
  },

  /**
   * Delete a comment
   */
  deleteComment: async (id: string): Promise<void> => {
    return httpClient.delete(`/api/common/comments/${id}`);
  },
};
