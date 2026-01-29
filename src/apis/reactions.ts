// src/apis/reactions.ts
import { httpClient } from "./http";

export interface ReactionData {
  id?: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  type: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
  postId?: string;
  commentId?: string;
  videoId?: string;
  createdAt?: string;
}

export interface CreateReactionRequest {
  userId: string;
  type: "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
  postId?: string;
  commentId?: string;
  videoId?: string;
}

export const reactionsApi = {
  /**
   * Get reactions for a post
   */
  getReactionsByPostId: async (postId: string): Promise<ReactionData[]> => {
    try {
      console.log(
        `📡 [Reactions API] Fetching reactions for post ${postId}...`,
      );
      const response = await httpClient.get<ReactionData[]>(
        `/api/common/reactions/post/${postId}`,
      );
      console.log(
        "✅ [Reactions API] Successfully fetched post reactions:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to fetch reactions for post ${postId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get reactions for a comment
   */
  getReactionsByCommentId: async (
    commentId: string,
  ): Promise<ReactionData[]> => {
    try {
      console.log(
        `📡 [Reactions API] Fetching reactions for comment ${commentId}...`,
      );
      const response = await httpClient.get<ReactionData[]>(
        `/api/common/reactions/comment/${commentId}`,
      );
      console.log(
        "✅ [Reactions API] Successfully fetched comment reactions:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to fetch reactions for comment ${commentId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get reactions for a video
   */
  getReactionsByVideoId: async (videoId: string): Promise<ReactionData[]> => {
    try {
      console.log(
        `📡 [Reactions API] Fetching reactions for video ${videoId}...`,
      );
      const response = await httpClient.get<ReactionData[]>(
        `/api/common/reactions/video/${videoId}`, // ✨ SỬA LẠI ENDPOINT (bỏ /user/)
      );
      console.log(
        "✅ [Reactions API] Successfully fetched video reactions:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to fetch reactions for video ${videoId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Get all reactions by a user
   */
  getReactionsByUserId: async (userId: string): Promise<ReactionData[]> => {
    try {
      console.log(
        `📡 [Reactions API] Fetching reactions for user ${userId}...`,
      );
      const response = await httpClient.get<ReactionData[]>(
        `/api/common/reactions/user/${userId}`,
      );
      console.log(
        "✅ [Reactions API] Successfully fetched user reactions:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to fetch reactions for user ${userId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Create or update a reaction
   */
  async createReaction(
    reactionData: CreateReactionRequest,
  ): Promise<ReactionData> {
    try {
      console.log("📡 [Reactions API] Creating reaction...", reactionData);
      const response = await httpClient.post<ReactionData>(
        "/api/common/reactions",
        reactionData,
      );
      console.log(
        "✅ [Reactions API] Successfully created reaction:",
        response,
      );
      return response;
    } catch (error) {
      console.error("❌ [Reactions API] Failed to create reaction:", error);
      throw error;
    }
  },

  /**
   * Delete a reaction by ID
   */
  async deleteReaction(id: string): Promise<void> {
    try {
      console.log(`📡 [Reactions API] Deleting reaction ${id}...`);
      await httpClient.delete(`/api/common/reactions/${id}`);
      console.log("✅ [Reactions API] Successfully deleted reaction");
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to delete reaction ${id}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Delete reaction from post
   */
  async deleteReactionByPostIdAndUserId(
    postId: string,
    userId: string,
  ): Promise<void> {
    try {
      console.log(
        `📡 [Reactions API] Deleting reaction for post ${postId} by user ${userId}...`,
      );
      await httpClient.delete(
        `/api/common/reactions/post/${postId}/user/${userId}`,
      );
      console.log("✅ [Reactions API] Successfully deleted post reaction");
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to delete reaction for post ${postId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Delete reaction from comment
   */
  async deleteReactionByCommentIdAndUserId(
    commentId: string,
    userId: string,
  ): Promise<void> {
    try {
      console.log(
        `📡 [Reactions API] Deleting reaction for comment ${commentId} by user ${userId}...`,
      );
      await httpClient.delete(
        `/api/common/reactions/comment/${commentId}/user/${userId}`,
      );
      console.log("✅ [Reactions API] Successfully deleted comment reaction");
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to delete reaction for comment ${commentId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Delete reaction from video
   */
  async deleteReactionByVideoIdAndUserId(
    videoId: string,
    userId: string,
  ): Promise<void> {
    try {
      console.log(
        `📡 [Reactions API] Deleting reaction for video ${videoId} by user ${userId}...`,
      );
      await httpClient.delete(
        `/api/common/reactions/video/${videoId}/user/${userId}`,
      );
      console.log("✅ [Reactions API] Successfully deleted video reaction");
    } catch (error) {
      console.error(
        `❌ [Reactions API] Failed to delete reaction for video ${videoId}:`,
        error,
      );
      throw error;
    }
  },

  /**
   * Toggle reaction on a post (create if not exists, delete if exists)
   */
  togglePostReaction: async (
    postId: string,
    userId: string,
    type: ReactionData["type"] = "LIKE",
  ): Promise<ReactionData | null> => {
    try {
      return await reactionsApi.createReaction({
        userId,
        postId,
        type,
      });
    } catch (error: any) {
      if (
        error.message?.includes("409") ||
        error.message?.includes("already")
      ) {
        await reactionsApi.deleteReactionByPostIdAndUserId(postId, userId);
        return null;
      }
      throw error;
    }
  },

  /**
   * Toggle reaction on a comment (create if not exists, delete if exists)
   */
  toggleCommentReaction: async (
    commentId: string,
    userId: string,
    type: ReactionData["type"] = "LIKE",
  ): Promise<ReactionData | null> => {
    try {
      return await reactionsApi.createReaction({
        userId,
        commentId,
        type,
      });
    } catch (error: any) {
      if (
        error.message?.includes("409") ||
        error.message?.includes("already")
      ) {
        await reactionsApi.deleteReactionByCommentIdAndUserId(
          commentId,
          userId,
        );
        return null;
      }
      throw error;
    }
  },

  /**
   * Toggle reaction on a video (create if not exists, delete if exists)
   */
  toggleVideoReaction: async (
    videoId: string,
    userId: string,
    type: ReactionData["type"] = "LIKE",
  ): Promise<ReactionData | null> => {
    try {
      return await reactionsApi.createReaction({
        userId,
        videoId,
        type,
      });
    } catch (error: any) {
      if (
        error.message?.includes("409") ||
        error.message?.includes("already")
      ) {
        await reactionsApi.deleteReactionByVideoIdAndUserId(videoId, userId);
        return null;
      }
      throw error;
    }
  },
};
