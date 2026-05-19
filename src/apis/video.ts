// src/apis/video.ts
import { httpClient } from "./http";
import { API_CONFIG } from './config';

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
  private baseUrl = "/api/social/videos";

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

  /**
   * Upload video file (≤ 5 MB) + tạo bản ghi video trong một request multipart.
   */
  async uploadVideo(params: {
    authorId: string;
    title: string;
    description?: string;
    visibility: "PUBLIC" | "FRIENDS" | "ONLY_ME";
    file: File;
  }): Promise<VideoData> {
    const formData = new FormData();
    formData.append("authorId", params.authorId);
    formData.append("title", params.title);
    if (params.description?.trim()) {
      formData.append("description", params.description.trim());
    }
    formData.append("visibility", params.visibility);
    formData.append("file", params.file);

    const token = localStorage.getItem("token");
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    const fullUrl = `${API_CONFIG.BASE_URL.replace(/\/$/, "")}/api/common/videos/upload`;
    const res = await fetch(fullUrl, { method: "POST", headers, body: formData });

    if (!res.ok) {
      if (res.status === 413) throw new Error("VIDEO_TOO_LARGE");
      const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
  }
}

export const videosApi = new VideosApi();
