import { httpClient } from './http';

export interface PostData {
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
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'ONLY_ME';
  allowComments?: boolean;
  allowSharing?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  groupId?: string;
  pageId?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  deleteReason?: string;
  isHidden?: boolean;
  isDeleted?: boolean;
}

export interface AdminPostFilter {
  status?: string;
  sortBy?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreatePostRequest {
  authorId?: string;
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'ONLY_ME';
  allowComments?: boolean;
  allowSharing?: boolean;
  groupId?: string;
  pageId?: string;
}

export interface UpdatePostRequest {
  content?: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'ONLY_ME';
}

class PostsApi {
  private baseUrl = '/api/social/posts';

  /**
   * Get all posts (newsfeed)
   */
  async getAllPosts(viewerId?: string): Promise<PostData[]> {
    try {
      console.log('📡 [Posts API] Fetching all posts...');
      const query = viewerId ? `?viewerId=${encodeURIComponent(viewerId)}` : '';
      const response = await httpClient.get<PostData[]>(
        `${this.baseUrl}${query}`,
        Boolean(viewerId),
      );
      console.log('✅ [Posts API] Successfully fetched posts:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to fetch posts:', error);
      throw error;
    }
  }

  /**
   * Get all admin posts with filters
   */
  async getAdminPosts(filters: AdminPostFilter = {}): Promise<PostData[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') queryParams.append('status', filters.status);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.startDate) queryParams.append('startDate', `${filters.startDate}T00:00:00`);
      if (filters.endDate) queryParams.append('endDate', `${filters.endDate}T23:59:59`);
      
      const queryString = queryParams.toString();
      const url = queryString ? `/api/social/admin/posts?${queryString}` : '/api/social/admin/posts';
      
      const response = await httpClient.get<PostData[]>(url);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to fetch admin posts:', error);
      throw error;
    }
  }

  /**
   * Toggle hide post (Shadowban)
   */
  async hidePost(id: string): Promise<PostData> {
    const response = await httpClient.put<PostData>(`/api/social/admin/posts/${id}/hide`);
    return response;
  }

  /**
   * Toggle lock comments
   */
  async lockComments(id: string): Promise<PostData> {
    const response = await httpClient.put<PostData>(`/api/social/admin/posts/${id}/lock-comments`);
    return response;
  }

  /**
   * Soft delete post with reason
   */
  async softDeletePost(id: string, reason: string): Promise<PostData> {
    const response = await httpClient.put<PostData>(`/api/social/admin/posts/${id}/soft-delete`, { reason });
    return response;
  }

  /**
   * Restore soft-deleted post
   */
  async restorePost(id: string): Promise<PostData> {
    const response = await httpClient.put<PostData>(`/api/social/admin/posts/${id}/restore`);
    return response;
  }

  /**
   * Hard delete post
   */
  async hardDeletePost(id: string): Promise<void> {
    await httpClient.delete(`/api/social/admin/posts/${id}/hard-delete`);
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<PostData> {
    try {
      console.log(`📡 [Posts API] Fetching post ${id}...`);
      const response = await httpClient.get<PostData>(`${this.baseUrl}/${id}`);
      console.log('✅ [Posts API] Successfully fetched post:', response);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to fetch post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get posts by user ID
   */
  async getPostsByUserId(userId: string): Promise<PostData[]> {
    try {
      console.log(`📡 [Posts API] Fetching posts for user ${userId}...`);
      const response = await httpClient.get<PostData[]>(`${this.baseUrl}/user/${userId}`);
      console.log('✅ [Posts API] Successfully fetched user posts:', response.length);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to fetch posts for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get posts by group ID
   */
  async getPostsByGroupId(groupId: string): Promise<PostData[]> {
    try {
      console.log(`📡 [Posts API] Fetching posts for group ${groupId}...`);
      const response = await httpClient.get<PostData[]>(`${this.baseUrl}/group/${groupId}`);
      console.log('✅ [Posts API] Successfully fetched group posts:', response.length);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to fetch posts for group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Get posts by page ID
   */
  async getPostsByPageId(pageId: string): Promise<PostData[]> {
    try {
      console.log(`📡 [Posts API] Fetching posts for page ${pageId}...`);
      const response = await httpClient.get<PostData[]>(`${this.baseUrl}/page/${pageId}`);
      console.log('✅ [Posts API] Successfully fetched page posts:', response.length);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to fetch posts for page ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new post
   */
  async createPost(postData: CreatePostRequest): Promise<PostData> {
    try {
      console.log('📡 [Posts API] Creating new post...', postData);
      const response = await httpClient.post<PostData>(this.baseUrl, postData);
      console.log('✅ [Posts API] Successfully created post:', response);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to create post:', error);
      throw error;
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, postData: UpdatePostRequest): Promise<PostData> {
    try {
      console.log(`📡 [Posts API] Updating post ${id}...`, postData);
      const response = await httpClient.put<PostData>(`${this.baseUrl}/${id}`, postData);
      console.log('✅ [Posts API] Successfully updated post:', response);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to update post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    try {
      console.log(`📡 [Posts API] Deleting post ${id}...`);
      await httpClient.delete(`${this.baseUrl}/${id}`);
      console.log('✅ [Posts API] Successfully deleted post');
    } catch (error) {
      console.error(`❌ [Posts API] Failed to delete post ${id}:`, error);
      throw error;
    }
  }

  /**
   * Share a post
   */
  async sharePost(postId: string, userId: string, content?: string, visibility?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE' | 'ONLY_ME'): Promise<PostData> {
    try {
      console.log(`📡 [Posts API] Sharing post ${postId}...`);
      const shareData: CreatePostRequest = {
        authorId: userId,
        content: content || '',
        visibility: visibility || 'PUBLIC',
        allowComments: true,
        allowSharing: true,
      };
      
      const response = await httpClient.post<PostData>(`${this.baseUrl}/${postId}/share`, shareData);
      console.log('✅ [Posts API] Successfully shared post:', response);
      return response;
    } catch (error) {
      console.error(`❌ [Posts API] Failed to share post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Save a post
   */
  async savePost(postId: string): Promise<void> {
    try {
      await httpClient.post(`${this.baseUrl}/${postId}/save`);
    } catch (error) {
      console.error(`❌ [Posts API] Failed to save post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Unsave a post
   */
  async unsavePost(postId: string): Promise<void> {
    try {
      await httpClient.delete(`${this.baseUrl}/${postId}/save`);
    } catch (error) {
      console.error(`❌ [Posts API] Failed to unsave post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Get saved posts
   */
  async getSavedPosts(): Promise<PostData[]> {
    try {
      const response = await httpClient.get<PostData[]>(`${this.baseUrl}/saved`);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to fetch saved posts:', error);
      throw error;
    }
  }

  /**
   * Get saved post IDs
   */
  async getSavedPostIds(): Promise<string[]> {
    try {
      const response = await httpClient.get<string[]>(`${this.baseUrl}/saved/ids`);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to fetch saved post IDs:', error);
      throw error;
    }
  }
}

export const postsApi = new PostsApi();
