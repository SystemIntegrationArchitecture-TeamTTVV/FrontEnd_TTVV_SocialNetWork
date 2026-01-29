// src/apis/comments.ts
import { httpClient } from "./http";

export interface CommentData {
  id?: string;
  postId?: string;
  videoId?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  content: string;
  images?: string[];
  parentCommentId?: string;
  likeCount?: number;
  replyCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCommentRequest {
  postId?: string;
  videoId?: string;
  userId: string;
  content: string;
  images?: string[];
  parentCommentId?: string;
}

export interface UpdateCommentRequest {
  content?: string;
  images?: string[];
}

export const commentsApi = {
  /**
   * Get all comments for a post
   */
  getCommentsByPostId: async (postId: string): Promise<CommentData[]> => {
    try {
      console.log(`📡 [Comments API] Fetching comments for post ${postId}...`);
      const response = await httpClient.get<CommentData[]>(
        `/api/common/comments/post/${postId}`,
      );
      console.log(
        "✅ [Comments API] Successfully fetched post comments:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Comments API] Failed to fetch comments for post ${postId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get all comments for a video
   */
  getCommentsByVideoId: async (videoId: string): Promise<CommentData[]> => {
    try {
      console.log(
        `📡 [Comments API] Fetching comments for video ${videoId}...`,
      );
      const response = await httpClient.get<CommentData[]>(
        `/api/common/comments/video/${videoId}`,
      );
      console.log(
        "✅ [Comments API] Successfully fetched video comments:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Comments API] Failed to fetch comments for video ${videoId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get replies for a comment
   */
  getRepliesByCommentId: async (commentId: string): Promise<CommentData[]> => {
    try {
      console.log(
        `📡 [Comments API] Fetching replies for comment ${commentId}...`,
      );
      const response = await httpClient.get<CommentData[]>(
        `/api/common/comments/parent/${commentId}/replies`,
      );
      console.log(
        "✅ [Comments API] Successfully fetched comment replies:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Comments API] Failed to fetch replies for comment ${commentId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get a single comment by ID
   */
  getCommentById: async (id: string): Promise<CommentData> => {
    try {
      console.log(`📡 [Comments API] Fetching comment ${id}...`);
      const response = await httpClient.get<CommentData>(
        `/api/common/comments/${id}`,
      );
      console.log("✅ [Comments API] Successfully fetched comment:", response);
      return response;
    } catch (error) {
      console.error(`❌ [Comments API] Failed to fetch comment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new comment
   */
  createComment: async (
    commentData: CreateCommentRequest,
  ): Promise<CommentData> => {
    try {
      console.log("📡 [Comments API] Creating comment...", commentData);
      const response = await httpClient.post<CommentData>(
        "/api/common/comments",
        commentData,
      );
      console.log("✅ [Comments API] Successfully created comment:", response);
      return response;
    } catch (error) {
      console.error("❌ [Comments API] Failed to create comment:", error);
      throw error;
    }
  },

  /**
   * Update a comment
   */
  updateComment: async (
    id: string,
    commentData: UpdateCommentRequest,
  ): Promise<CommentData> => {
    try {
      console.log(`📡 [Comments API] Updating comment ${id}...`, commentData);
      const response = await httpClient.put<CommentData>(
        `/api/common/comments/${id}`,
        commentData,
      );
      console.log("✅ [Comments API] Successfully updated comment:", response);
      return response;
    } catch (error) {
      console.error(`❌ [Comments API] Failed to update comment ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a comment
   */
  deleteComment: async (id: string): Promise<void> => {
    try {
      console.log(`📡 [Comments API] Deleting comment ${id}...`);
      await httpClient.delete(`/api/common/comments/${id}`);
      console.log("✅ [Comments API] Successfully deleted comment");
    } catch (error) {
      console.error(`❌ [Comments API] Failed to delete comment ${id}:`, error);
      throw error;
    }
  },
};
