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
  visibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
  allowComments?: boolean;
  allowSharing?: boolean;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  groupId?: string;
  pageId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePostRequest {
  authorId?: string;
  content: string;
  images?: string[];
  videos?: string[];
  location?: string;
  feeling?: string;
  activity?: string;
  visibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
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
  visibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME';
}

class PostsApi {
  private baseUrl = '/api/common/posts';

  /**
   * Get all posts (newsfeed)
   */
  async getAllPosts(): Promise<PostData[]> {
    try {
      console.log('📡 [Posts API] Fetching all posts...');
      const response = await httpClient.get<PostData[]>(this.baseUrl);
      console.log('✅ [Posts API] Successfully fetched posts:', response.length);
      return response;
    } catch (error) {
      console.error('❌ [Posts API] Failed to fetch posts:', error);
      throw error;
    }
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
  async sharePost(postId: string, userId: string, content?: string, visibility?: 'PUBLIC' | 'FRIENDS' | 'ONLY_ME'): Promise<PostData> {
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
}

export const postsApi = new PostsApi();

// Explicit re-exports for better module resolution
export type { PostData, CreatePostRequest, UpdatePostRequest };
