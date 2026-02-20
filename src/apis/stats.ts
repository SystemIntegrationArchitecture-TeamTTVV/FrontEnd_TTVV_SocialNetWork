import { httpClient } from "./http";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  totalViews: number;
  newUsersThisMonth: number;
  engagementRate: number;
  userGrowth: Record<string, number>;
}

export interface TopPost {
  id: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  views: number;
  likes: number;
  comments: number;
}

export interface EngagementStats {
  metrics: Record<string, number>;
  dailyTrend: Record<string, number>;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  activeUserRate: number;
  newUsersRate: number;
  byRegion: Record<string, number>;
}

export interface ContentStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  postsPerDay: number;
  commentsPerDay: number;
  byType: Record<string, number>;
}

export const statsApi = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      return await httpClient.get<DashboardStats>("/api/stats/dashboard");
    } catch (error) {
      console.error("Failed to get dashboard stats:", error);
      throw error;
    }
  },

  /**
   * Get top posts by engagement
   */
  getTopPosts: async (limit: number = 5): Promise<TopPost[]> => {
    try {
      return await httpClient.get<TopPost[]>(
        `/api/stats/top-posts?limit=${limit}`,
      );
    } catch (error) {
      console.error("Failed to get top posts:", error);
      throw error;
    }
  },

  /**
   * Get engagement statistics
   */
  getEngagementStats: async (): Promise<EngagementStats> => {
    try {
      return await httpClient.get<EngagementStats>("/api/stats/engagement");
    } catch (error) {
      console.error("Failed to get engagement stats:", error);
      throw error;
    }
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStats> => {
    try {
      return await httpClient.get<UserStats>("/api/stats/users");
    } catch (error) {
      console.error("Failed to get user stats:", error);
      throw error;
    }
  },

  /**
   * Get content statistics
   */
  getContentStats: async (): Promise<ContentStats> => {
    try {
      return await httpClient.get<ContentStats>("/api/stats/content");
    } catch (error) {
      console.error("Failed to get content stats:", error);
      throw error;
    }
  },
};
