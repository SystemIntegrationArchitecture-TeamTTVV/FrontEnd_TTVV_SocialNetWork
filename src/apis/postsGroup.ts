import { httpClient } from './http';

export interface PostGroupData {
  id?: string;
  authorId?: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ONLY_ME';
  allowComments?: boolean;
  allowSharing?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  groupId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePostGroupRequest {
  authorId?: string;
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ONLY_ME';
  allowComments?: boolean;
  allowSharing?: boolean;
  groupId: string; // 🔥 bắt buộc vì post trong group
}

export interface UpdatePostGroupRequest {
  content?: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'PRIVATE' | 'ONLY_ME';
}

class PostGroupApi {
  private baseUrl = '/api/common/group-posts';

  /**
   * 🔥 Get all posts in a group
   */
  async getPostsByGroupId(groupId: string, viewerId?: string): Promise<PostGroupData[]> {
    try {
      console.log(`📡 [PostGroup API] Fetching posts for group ${groupId}...`);
      const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
      const response = await httpClient.get<PostGroupData[]>(
        `${this.baseUrl}/group/${groupId}${query}`
      );
      console.log('✅ [PostGroup API] Successfully fetched group posts:', response.length);
      return response;
    } catch (error) {
      console.error(`❌ [PostGroup API] Failed to fetch posts for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * 🔥 Get post detail
   */
  async getPostById(postId: string, viewerId?: string): Promise<PostGroupData> {
    try {
      console.log(`📡 [PostGroup API] Fetching post ${postId}...`);
      const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
      const response = await httpClient.get<PostGroupData>(
        `${this.baseUrl}/${postId}${query}`
      );
      console.log('✅ [PostGroup API] Successfully fetched post:', response);
      return response;
    } catch (error) {
      console.error(`❌ [PostGroup API] Failed to fetch post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * 🔥 Create new group post
   */
  async createPost(data: CreatePostGroupRequest): Promise<PostGroupData> {
    try {
      console.log('📡 [PostGroup API] Creating post...', data);
      const response = await httpClient.post<PostGroupData>(
        this.baseUrl,
        data
      );
      console.log('✅ [PostGroup API] Successfully created post:', response);
      return response;
    } catch (error) {
      console.error('❌ [PostGroup API] Failed to create post:', error);
      throw error;
    }
  }

  /**
   * 🔥 Update post
   */
  async updatePost(postId: string, data: UpdatePostGroupRequest): Promise<PostGroupData> {
    try {
      console.log(`📡 [PostGroup API] Updating post ${postId}...`, data);
      const response = await httpClient.put<PostGroupData>(
        `${this.baseUrl}/${postId}`,
        data
      );
      console.log('✅ [PostGroup API] Successfully updated post:', response);
      return response;
    } catch (error) {
      console.error(`❌ [PostGroup API] Failed to update post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * 🔥 Delete post (soft delete)
   */
  async deletePost(postId: string): Promise<void> {
    try {
      console.log(`📡 [PostGroup API] Deleting post ${postId}...`);
      await httpClient.delete(`${this.baseUrl}/${postId}`);
      console.log('✅ [PostGroup API] Successfully deleted post');
    } catch (error) {
      console.error(`❌ [PostGroup API] Failed to delete post ${postId}:`, error);
      throw error;
    }
  }
}

export const postGroupApi = new PostGroupApi();

// Export types
// export type {
//   PostGroupData,
//   CreatePostGroupRequest,
//   UpdatePostGroupRequest
// };