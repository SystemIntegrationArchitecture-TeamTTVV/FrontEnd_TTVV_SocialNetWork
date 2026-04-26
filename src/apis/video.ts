// src/apis/video.ts
import { httpClient } from "./http";

export interface VideoData {
  id?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  quality?: string;
  fileSize?: number;
  visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  allowComments?: boolean;
  allowReactions?: boolean;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  groupId?: string;
  pageId?: string;
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVideoRequest {
  authorId?: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  quality?: string;
  fileSize?: number;
  visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  allowComments?: boolean;
  allowReactions?: boolean;
  groupId?: string;
  pageId?: string;
  tags?: string[];
  category?: string;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  visibility?: "PUBLIC" | "FRIENDS" | "ONLY_ME";
  allowComments?: boolean;
  allowReactions?: boolean;
  tags?: string[];
  category?: string;
}

class VideosApi {
  private baseUrl = "/api/social/api/videos";

  async getAllVideos(): Promise<VideoData[]> {
    try {
      console.log("📡 [Videos API] Fetching all videos...");
      const response = await httpClient.get<VideoData[]>(this.baseUrl);
      console.log(
        "✅ [Videos API] Successfully fetched videos:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error("❌ [Videos API] Failed to fetch videos:", error);
      throw error;
    }
  }

  async getPopularVideos(): Promise<VideoData[]> {
    try {
      console.log("📡 [Videos API] Fetching popular videos...");
      const response = await httpClient.get<VideoData[]>(
        `${this.baseUrl}/popular`,
      );
      console.log(
        "✅ [Videos API] Successfully fetched popular videos:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error("❌ [Videos API] Failed to fetch popular videos:", error);
      throw error;
    }
  }

  async getVideoById(id: string): Promise<VideoData> {
    try {
      console.log(`📡 [Videos API] Fetching video ${id}...`);
      const response = await httpClient.get<VideoData>(`${this.baseUrl}/${id}`);
      console.log("✅ [Videos API] Successfully fetched video:", response);
      return response;
    } catch (error) {
      console.error(`❌ [Videos API] Failed to fetch video ${id}:`, error);
      throw error;
    }
  }

  async getVideosByUserId(userId: string): Promise<VideoData[]> {
    try {
      console.log(`📡 [Videos API] Fetching videos for user ${userId}...`);
      const response = await httpClient.get<VideoData[]>(
        `${this.baseUrl}/user/${userId}`,
      );
      console.log(
        "✅ [Videos API] Successfully fetched user videos:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Videos API] Failed to fetch videos for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  async getVideosByCategory(category: string): Promise<VideoData[]> {
    try {
      console.log(
        `📡 [Videos API] Fetching videos for category ${category}...`,
      );
      const response = await httpClient.get<VideoData[]>(
        `${this.baseUrl}/category/${category}`,
      );
      console.log(
        "✅ [Videos API] Successfully fetched category videos:",
        response.length,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Videos API] Failed to fetch videos for category ${category}:`,
        error,
      );
      throw error;
    }
  }

  async createVideo(videoData: CreateVideoRequest): Promise<VideoData> {
    try {
      console.log("📡 [Videos API] Creating new video...", videoData);
      const response = await httpClient.post<VideoData>(
        this.baseUrl,
        videoData,
      );
      console.log("✅ [Videos API] Successfully created video:", response);
      return response;
    } catch (error) {
      console.error("❌ [Videos API] Failed to create video:", error);
      throw error;
    }
  }

  async incrementViewCount(id: string): Promise<VideoData> {
    try {
      console.log(`📡 [Videos API] Incrementing view count for video ${id}...`);
      const response = await httpClient.post<VideoData>(
        `${this.baseUrl}/${id}/view`,
        {},
      );
      console.log(
        "✅ [Videos API] Successfully incremented view count:",
        response,
      );
      return response;
    } catch (error) {
      console.error(
        `❌ [Videos API] Failed to increment view count for video ${id}:`,
        error,
      );
      throw error;
    }
  }

  async updateVideo(
    id: string,
    videoData: UpdateVideoRequest,
  ): Promise<VideoData> {
    try {
      console.log(`📡 [Videos API] Updating video ${id}...`, videoData);
      const response = await httpClient.put<VideoData>(
        `${this.baseUrl}/${id}`,
        videoData,
      );
      console.log("✅ [Videos API] Successfully updated video:", response);
      return response;
    } catch (error) {
      console.error(`❌ [Videos API] Failed to update video ${id}:`, error);
      throw error;
    }
  }

  async deleteVideo(id: string): Promise<void> {
    try {
      console.log(`📡 [Videos API] Deleting video ${id}...`);
      await httpClient.delete(`${this.baseUrl}/${id}`);
      console.log("✅ [Videos API] Successfully deleted video");
    } catch (error) {
      console.error(`❌ [Videos API] Failed to delete video ${id}:`, error);
      throw error;
    }
  }
}

export const videosApi = new VideosApi();
